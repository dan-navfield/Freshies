import { View, Text, ScrollView, Pressable, StyleSheet, Image, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, CheckCircle, XCircle, AlertTriangle, Info, Plus } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { approveProduct, declineProduct } from '../../../src/services/approvalService';
import { ApprovalWithDetails, SEVERITY_CONFIG, FLAG_TYPES } from '../../../src/types/approval';

export default function ApprovalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [approval, setApproval] = useState<ApprovalWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentNotes, setParentNotes] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [addToRoutine, setAddToRoutine] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApproval();
  }, [id]);

  async function loadApproval() {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_approvals')
        .select(`
          *,
          children (
            first_name,
            age,
            avatar_url
          ),
          product_flags (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setApproval({
          ...data,
          child_name: data.children?.first_name || 'Unknown',
          child_age: data.children?.age || 0,
          child_avatar_url: data.children?.avatar_url,
          flags: data.product_flags || [],
          flag_count: data.product_flags?.length || 0,
          highest_severity: getHighestSeverity(data.product_flags || []),
        });
      }
    } catch (error) {
      console.error('Error loading approval:', error);
      Alert.alert('Error', 'Failed to load approval details');
    }
    setLoading(false);
  }

  function getHighestSeverity(flags: any[]): 'info' | 'caution' | 'warning' | 'danger' {
    if (flags.length === 0) return 'info';
    const severityOrder: Record<string, number> = { danger: 4, warning: 3, caution: 2, info: 1 };
    return flags.reduce((highest, flag) => {
      return (severityOrder[flag.severity] || 0) > (severityOrder[highest] || 0)
        ? flag.severity 
        : highest;
    }, 'info');
  }

  async function handleApprove() {
    if (!approval) return;
    
    setProcessing(true);
    const success = await approveProduct({
      approval_id: approval.id,
      action: 'approve',
      parent_notes: parentNotes || undefined,
      add_to_routine: addToRoutine,
      notify_child: true,
    });

    setProcessing(false);
    
    if (success) {
      Alert.alert(
        'Approved!',
        `${approval.product_name} has been approved for ${approval.child_name}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', 'Failed to approve product. Please try again.');
    }
  }

  async function handleDecline() {
    if (!approval) return;
    
    setProcessing(true);
    const success = await declineProduct({
      approval_id: approval.id,
      action: 'decline',
      parent_notes: parentNotes || undefined,
      notify_child: true,
    });

    setProcessing(false);
    
    if (success) {
      Alert.alert(
        'Declined',
        `${approval.product_name} has been declined for ${approval.child_name}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', 'Failed to decline product. Please try again.');
    }
  }

  if (loading || !approval) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const getSeverityColor = (severity: string) => {
    return SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]?.color || colors.charcoal;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Review Product</Text>
          <View style={styles.backButton} />
        </View>

        {/* Product Section */}
        <View style={styles.productSection}>
          {approval.product_image_url ? (
            <Image 
              source={{ uri: approval.product_image_url }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImagePlaceholderText}>📦</Text>
            </View>
          )}
          
          <Text style={styles.productName}>{approval.product_name}</Text>
          {approval.product_brand && (
            <Text style={styles.productBrand}>{approval.product_brand}</Text>
          )}

          {/* Child Info */}
          <View style={styles.childInfo}>
            <Image 
              source={{ 
                uri: approval.child_avatar_url || `https://ui-avatars.com/api/?name=${approval.child_name}&background=random&size=200`
              }}
              style={styles.childAvatar}
            />
            <View>
              <Text style={styles.childLabel}>Requested by</Text>
              <Text style={styles.childName}>{approval.child_name}, {approval.child_age}</Text>
            </View>
          </View>

          {approval.child_notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Child's Note:</Text>
              <Text style={styles.notesText}>{approval.child_notes}</Text>
            </View>
          )}
        </View>

        {/* Safety Flags */}
        {approval.flags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Concerns</Text>
            {approval.flags.map((flag) => (
              <View 
                key={flag.id}
                style={[
                  styles.flagCard,
                  { borderLeftColor: getSeverityColor(flag.severity) }
                ]}
              >
                <View style={styles.flagHeader}>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(flag.severity) + '20' }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: getSeverityColor(flag.severity) }
                    ]}>
                      {SEVERITY_CONFIG[flag.severity as keyof typeof SEVERITY_CONFIG]?.label}
                    </Text>
                  </View>
                  <Text style={styles.flagTitle}>{flag.title}</Text>
                </View>
                <Text style={styles.flagDescription}>{flag.description}</Text>
                {flag.ingredient && (
                  <Text style={styles.flagIngredient}>
                    Ingredient: <Text style={styles.flagIngredientName}>{flag.ingredient}</Text>
                  </Text>
                )}
                {flag.recommendation && (
                  <View style={styles.recommendationBox}>
                    <Info size={16} color={colors.purple} />
                    <Text style={styles.recommendationText}>{flag.recommendation}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Parent Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes for your child about this decision..."
            placeholderTextColor={colors.charcoal}
            multiline
            numberOfLines={4}
            value={parentNotes}
            onChangeText={setParentNotes}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <Pressable 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => setShowDeclineModal(true)}
          disabled={processing}
        >
          <XCircle size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Decline</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => setShowApproveModal(true)}
          disabled={processing}
        >
          <CheckCircle size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Approve</Text>
        </Pressable>
      </View>

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Product?</Text>
            <Text style={styles.modalText}>
              {approval.child_name} will be able to use {approval.product_name}.
            </Text>

            <Pressable 
              style={styles.modalOption}
              onPress={() => setAddToRoutine(!addToRoutine)}
            >
              <View style={[styles.checkbox, addToRoutine && styles.checkboxChecked]}>
                {addToRoutine && <CheckCircle size={16} color={colors.white} />}
              </View>
              <Text style={styles.modalOptionText}>Add to {approval.child_name}'s routine</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowApproveModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowApproveModal(false);
                  handleApprove();
                }}
              >
                <Text style={styles.modalButtonText}>Approve</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Decline Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Product?</Text>
            <Text style={styles.modalText}>
              {approval.child_name} will be notified that {approval.product_name} is not approved.
            </Text>
            {parentNotes.trim() === '' && (
              <View style={styles.warningBox}>
                <AlertTriangle size={16} color={colors.orange} />
                <Text style={styles.warningText}>
                  Consider adding a note to explain why
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowDeclineModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => {
                  setShowDeclineModal(false);
                  handleDecline();
                }}
              >
                <Text style={styles.modalButtonText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  productSection: {
    backgroundColor: colors.white,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: radii.lg,
    marginBottom: spacing[4],
  },
  productImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  productImagePlaceholderText: {
    fontSize: 64,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  productBrand: {
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
    width: '100%',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.white,
  },
  childLabel: {
    fontSize: 12,
    color: colors.charcoal,
    marginBottom: 2,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  notesBox: {
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginTop: spacing[4],
    width: '100%',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  notesText: {
    fontSize: 14,
    color: colors.black,
    fontStyle: 'italic',
  },
  section: {
    padding: spacing[6],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  flagCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderLeftWidth: 4,
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  severityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  flagTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
  },
  flagDescription: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  flagIngredient: {
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  flagIngredientName: {
    fontWeight: '700',
    color: colors.black,
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: colors.purple + '10',
    padding: spacing[3],
    borderRadius: radii.md,
    gap: spacing[2],
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: colors.purple,
    lineHeight: 18,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    fontSize: 15,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.mist,
    minHeight: 100,
  },
  actionBar: {
    flexDirection: 'row',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  approveButton: {
    backgroundColor: colors.mint,
  },
  declineButton: {
    backgroundColor: colors.red,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing[6],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  modalText: {
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: spacing[3],
    borderRadius: radii.md,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.orange,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.mint,
  },
  modalButtonDanger: {
    backgroundColor: colors.red,
  },
  modalButtonSecondary: {
    backgroundColor: colors.cream,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
});
