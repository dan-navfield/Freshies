import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../../src/theme/tokens';

export const childHomeStyles = StyleSheet.create({
  // Sections
  section: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitleLight: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },

  // 1. Routine Card
  routineCard: {
    backgroundColor: colors.purple,
    borderRadius: radii.xl,
    padding: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  routineTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  routineTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  routineProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  progressRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  routineProgressText: {
    flex: 1,
  },
  routineProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  routineProgressSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // 2. Skin Profile Card
  skinProfileCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  skinProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  skinProfileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  skinProfileContent: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  skinProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skinProfileLabel: {
    fontSize: 14,
    color: colors.charcoal,
  },
  skinProfileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  skinProfileInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    padding: spacing[3],
    borderRadius: radii.md,
  },
  skinProfileInsightText: {
    flex: 1,
    fontSize: 13,
    color: colors.purple,
    fontWeight: '500',
  },

  // 3. Product Carousel
  productCarousel: {
    marginHorizontal: -spacing[6],
    paddingHorizontal: spacing[6],
  },
  productCard: {
    width: 180,
    backgroundColor: colors.black,
    borderRadius: radii.lg,
    marginRight: spacing[4],
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.white,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  freshBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderTopLeftRadius: radii.md,
  },
  freshScore: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  productInfo: {
    padding: spacing[3],
  },
  productBrand: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mint,
    marginBottom: spacing[1],
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing[2],
    minHeight: 36,
  },

  // 4. Recently Scanned
  recentlyScannedRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  recentItem: {
    position: 'relative',
  },
  recentItemImage: {
    width: 70,
    height: 70,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.mist,
  },
  recentImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cream,
  },
  recentItemScore: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.mint,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  recentScoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },

  // 5. Alerts & Reminders
  alertsContainer: {
    gap: spacing[3],
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: colors.charcoal,
  },

  // 6. Learning Card
  learningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    padding: spacing[5],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 122, 184, 0.2)',
  },
  learningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learningContent: {
    flex: 1,
  },
  learningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  learningSubtitle: {
    fontSize: 13,
    color: colors.charcoal,
  },

  // Progress Card (existing)
  progressCard: {
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  progressText: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
  },

  // Stats Card (existing)
  statsCard: {
    backgroundColor: colors.white,
    padding: spacing[5],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
  },

  // AI Card (existing)
  aiCard: {
    backgroundColor: colors.purple,
    padding: spacing[5],
    borderRadius: radii.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  aiIcon: {
    fontSize: 24,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  aiSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  aiSuggestions: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing[4],
    borderRadius: radii.md,
    marginBottom: spacing[4],
  },
  aiSuggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing[2],
  },
  aiSuggestion: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing[1],
  },
  aiButton: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.purple,
  },
});
