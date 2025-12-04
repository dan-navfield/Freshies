/**
 * Review Statistics Component
 * Displays aggregate review data: average rating, total reviews, rating distribution
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../theme/tokens';
import StarRating from './StarRating';
import type { ProductReviewSummary } from '../types/reviews';

interface ReviewStatisticsProps {
  summary: ProductReviewSummary;
}

export default function ReviewStatistics({ summary }: ReviewStatisticsProps) {
  const { total_reviews, average_rating, rating_distribution } = summary;

  // Don't show if no reviews
  if (total_reviews === 0) {
    return null;
  }

  const avgRating = average_rating || 0;
  const maxCount = rating_distribution 
    ? Math.max(...Object.values(rating_distribution))
    : 0;

  return (
    <View style={styles.container}>
      {/* Average Rating */}
      <View style={styles.averageSection}>
        <Text style={styles.averageNumber}>{avgRating.toFixed(1)}</Text>
        <StarRating rating={avgRating} readonly size={20} />
        <Text style={styles.totalReviews}>
          {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
        </Text>
      </View>

      {/* Rating Distribution */}
      {rating_distribution && (
        <View style={styles.distributionSection}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = rating_distribution[stars as keyof typeof rating_distribution] || 0;
            const percentage = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <View key={stars} style={styles.distributionRow}>
                <Text style={styles.starLabel}>{stars}</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${barWidth}%`,
                        backgroundColor: stars >= 4 ? colors.mint : 
                                       stars >= 3 ? '#F59E0B' : 
                                       colors.red 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.countLabel}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Experience Breakdown */}
      {summary.experience_breakdown && (
        <View style={styles.experienceSection}>
          <Text style={styles.experienceTitle}>Parent experiences:</Text>
          <View style={styles.experienceTags}>
            {summary.experience_breakdown.worked_well > 0 && (
              <View style={styles.experienceTag}>
                <Text style={styles.experienceTagText}>
                  ✅ {summary.experience_breakdown.worked_well} worked well
                </Text>
              </View>
            )}
            {summary.experience_breakdown.somewhat > 0 && (
              <View style={styles.experienceTag}>
                <Text style={styles.experienceTagText}>
                  😐 {summary.experience_breakdown.somewhat} somewhat
                </Text>
              </View>
            )}
            {summary.experience_breakdown.no_irritation > 0 && (
              <View style={styles.experienceTag}>
                <Text style={styles.experienceTagText}>
                  ❌ {summary.experience_breakdown.no_irritation} no/irritation
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.cream,
  },
  averageSection: {
    alignItems: 'center',
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  averageNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  totalReviews: {
    fontSize: 13,
    color: colors.charcoal,
    marginTop: spacing[1],
    opacity: 0.7,
  },
  distributionSection: {
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
    gap: spacing[1],
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  starLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    width: 12,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    width: 30,
    textAlign: 'right',
  },
  experienceSection: {
    paddingTop: spacing[3],
  },
  experienceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  experienceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  experienceTag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
  },
  experienceTagText: {
    fontSize: 13,
    color: colors.charcoal,
  },
});
