/**
 * Review Submission Modal
 * Allows parents to share their experience with a product
 */

import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import type { ExperienceRating, CreateReviewRequest } from '../../types/reviews';
import type { ChildProfile } from '../../types/family';
import StarRating from './StarRating';

interface ReviewSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: CreateReviewRequest, rating?: number) => Promise<void>;
  productBarcode: string;
  productName: string;
  productBrand?: string;
  children: ChildProfile[];
}

export default function ReviewSubmissionModal({
  visible,
  onClose,
  onSubmit,
  productBarcode,
  productName,
  productBrand,
  children,
}: ReviewSubmissionModalProps) {
  const [experienceRating, setExperienceRating] = useState<ExperienceRating | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const charCount = reviewText.length;
  const maxChars = 280;

  const handleSubmit = async () => {
    if (!experienceRating) {
      Alert.alert('Required', 'Please select how this product worked for your child.');
      return;
    }

    setSubmitting(true);
    try {
      const review: CreateReviewRequest = {
        product_barcode: productBarcode,
        product_name: productName,
        product_brand: productBrand,
        experience_rating: experienceRating,
        review_text: reviewText.trim() || undefined,
        child_id: selectedChildId || undefined,
        child_age: selectedChild?.age,
        child_skin_type: (selectedChild as any)?.skin_type,
        child_allergies: (selectedChild as any)?.allergies,
      };

      await onSubmit(review, starRating > 0 ? starRating : undefined);
      
      // Reset form
      setExperienceRating(null);
      setStarRating(0);
      setReviewText('');
      setSelectedChildId(null);
      
      onClose();
      Alert.alert('Thank you!', 'Your review has been shared with other parents.');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const experienceOptions: { value: ExperienceRating; label: string; emoji: string }[] = [
    { value: 'worked_well', label: 'Worked well', emoji: '✅' },
    { value: 'somewhat', label: 'Somewhat', emoji: '😐' },
    { value: 'no_irritation', label: 'No / Irritation', emoji: '❌' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share your experience</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            {productBrand && <Text style={styles.productBrand}>{productBrand}</Text>}
          </View>

          {/* Star Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall rating</Text>
            <View style={styles.starRatingContainer}>
              <StarRating
                rating={starRating}
                onRatingChange={setStarRating}
                size={32}
              />
              {starRating > 0 && (
                <Text style={styles.starRatingText}>
                  {starRating === 1 ? '1 star' : `${starRating} stars`}
                </Text>
              )}
            </View>
          </View>

          {/* Experience Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Did this work for your child?</Text>
            <View style={styles.experienceOptions}>
              {experienceOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.experienceOption,
                    experienceRating === option.value && styles.experienceOptionSelected,
                  ]}
                  onPress={() => setExperienceRating(option.value)}
                >
                  <Text style={styles.experienceEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.experienceLabel,
                      experienceRating === option.value && styles.experienceLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Optional Comment */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Comment (optional)</Text>
              <Text style={styles.charCount}>{charCount}/{maxChars}</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Share more details about your experience..."
              placeholderTextColor={colors.charcoal + '60'}
              multiline
              numberOfLines={4}
              maxLength={maxChars}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />
          </View>

          {/* Child Selector */}
          {children.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Which child?</Text>
              <View style={styles.childOptions}>
                {children.map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childOption,
                      selectedChildId === child.id && styles.childOptionSelected,
                    ]}
                    onPress={() => setSelectedChildId(child.id)}
                  >
                    <Text
                      style={[
                        styles.childOptionText,
                        selectedChildId === child.id && styles.childOptionTextSelected,
                      ]}
                    >
                      {child.first_name}
                    </Text>
                    {selectedChildId === child.id && (
                      <Text style={styles.childOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Show child context */}
              {selectedChild && (
                <View style={styles.childContext}>
                  <Text style={styles.childContextTitle}>This will be shared:</Text>
                  <Text style={styles.childContextText}>
                    • Age {selectedChild.age}
                  </Text>
                  {(selectedChild as any).skin_type && (
                    <Text style={styles.childContextText}>
                      • {(selectedChild as any).skin_type} skin
                    </Text>
                  )}
                  {(selectedChild as any).allergies?.length > 0 && (
                    <Text style={styles.childContextText}>
                      • Allergies: {(selectedChild as any).allergies.join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              Your review will be shared anonymously. We'll show your child's age and skin type to help other parents, but never your name.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!experienceRating || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!experienceRating || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Share Experience'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
    padding: spacing[5],
  },
  productInfo: {
    marginBottom: spacing[6],
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[1],
  },
  productBrand: {
    fontSize: 15,
    color: colors.charcoal,
    opacity: 0.7,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[3],
  },
  charCount: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.6,
  },
  experienceOptions: {
    gap: spacing[3],
  },
  experienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.cream,
    backgroundColor: colors.white,
  },
  experienceOptionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '10',
  },
  experienceEmoji: {
    fontSize: 24,
    marginRight: spacing[3],
  },
  experienceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  experienceLabelSelected: {
    color: colors.purple,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    fontSize: 15,
    color: colors.charcoal,
    minHeight: 100,
  },
  childOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.cream,
    backgroundColor: colors.white,
  },
  childOptionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '10',
  },
  childOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },
  childOptionTextSelected: {
    color: colors.purple,
  },
  childOptionCheck: {
    fontSize: 16,
    color: colors.purple,
    marginLeft: spacing[2],
  },
  childContext: {
    marginTop: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.md,
  },
  childContextTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  childContextText: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.8,
    marginBottom: spacing[1],
  },
  privacyNote: {
    padding: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    marginBottom: spacing[4],
  },
  privacyText: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
    opacity: 0.8,
  },
  footer: {
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.cream,
  },
  submitButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.charcoal + '30',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  starRatingContainer: {
    alignItems: 'center',
    gap: spacing[2],
  },
  starRatingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.purple,
    marginTop: spacing[1],
  },
});
