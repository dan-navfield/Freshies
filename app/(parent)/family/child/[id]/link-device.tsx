import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../../../src/theme/tokens';
import { ChevronLeft, Link as LinkIcon, Copy, Share2, RefreshCw, Smartphone, CheckCircle } from 'lucide-react-native';
import { getChildById, generateChildInvitation } from '../../../../../src/services/familyService';
import { ChildProfile } from '../../../../../src/types/family';
import { Clipboard } from 'react-native';

export default function LinkDeviceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadChild();
  }, [id]);

  async function loadChild() {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    const data = await getChildById(id);
    setChild(data);
    setLoading(false);
  }

  async function handleGenerateCode() {
    if (!child) return;
    
    setGenerating(true);
    const invitation = await generateChildInvitation(child.parent_id);
    if (invitation) {
      setInvitationCode(invitation.invitation_code);
    } else {
      Alert.alert('Error', 'Failed to generate invitation code');
    }
    setGenerating(false);
  }

  async function handleCopyCode() {
    if (!invitationCode) return;
    
    Clipboard.setString(invitationCode);
    Alert.alert('Copied!', 'Invitation code copied to clipboard');
  }

  async function handleShareCode() {
    if (!invitationCode || !child) return;
    
    try {
      await Share.share({
        message: `Join Freshies! Use this code to link your device:\n\n${invitationCode}\n\nChild: ${child.display_name}`,
        title: 'Freshies Device Link',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  if (loading || !child) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Link Device</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LinkIcon size={32} color={colors.purple} />
          </View>
          <Text style={styles.heroTitle}>Connect {child.display_name}'s Device</Text>
          <Text style={styles.heroSubtitle}>
            Generate a secure code to link their phone or tablet
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Generate Code</Text>
              <Text style={styles.stepDescription}>
                Create a unique invitation code below
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share with Child</Text>
              <Text style={styles.stepDescription}>
                Send the code to {child.display_name} via text or email
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enter Code</Text>
              <Text style={styles.stepDescription}>
                They'll enter the code in the Freshies app on their device
              </Text>
            </View>
          </View>
        </View>

        {/* Code Generation */}
        {!invitationCode ? (
          <View style={styles.section}>
            <Pressable
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={handleGenerateCode}
              disabled={generating}
            >
              <LinkIcon size={20} color={colors.white} />
              <Text style={styles.generateButtonText}>
                {generating ? 'Generating...' : 'Generate Code'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            {/* Code Display */}
            <View style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <CheckCircle size={20} color={colors.mint} />
                <Text style={styles.codeHeaderText}>Code Generated!</Text>
              </View>
              
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{invitationCode}</Text>
              </View>

              <Text style={styles.codeExpiry}>Expires in 24 hours</Text>

              {/* Actions */}
              <View style={styles.codeActions}>
                <Pressable style={styles.codeActionButton} onPress={handleCopyCode}>
                  <Copy size={18} color={colors.purple} />
                  <Text style={styles.codeActionText}>Copy</Text>
                </Pressable>

                <Pressable style={styles.codeActionButton} onPress={handleShareCode}>
                  <Share2 size={18} color={colors.purple} />
                  <Text style={styles.codeActionText}>Share</Text>
                </Pressable>

                <Pressable style={styles.codeActionButton} onPress={handleGenerateCode}>
                  <RefreshCw size={18} color={colors.purple} />
                  <Text style={styles.codeActionText}>New Code</Text>
                </Pressable>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Smartphone size={20} color={colors.charcoal} />
              <Text style={styles.infoText}>
                Once {child.display_name} enters this code, you'll be able to monitor their activity and approve products remotely.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
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
  scrollView: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.cream,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  section: {
    padding: spacing[6],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  step: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.purple,
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  codeCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  codeHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  codeDisplay: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.purple + '40',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.purple,
    letterSpacing: 4,
  },
  codeExpiry: {
    fontSize: 13,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.md,
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.purple + '10',
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
});
