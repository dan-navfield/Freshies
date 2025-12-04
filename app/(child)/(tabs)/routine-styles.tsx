import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../../src/theme/tokens';

export const routineStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Segment Selector
  segmentSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    gap: spacing[3],
    backgroundColor: colors.white,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  segmentButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  segmentTextActive: {
    color: colors.white,
  },

  // Progress Section
  progressSection: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.mint,
    borderRadius: radii.sm,
  },

  // Content
  scrollContent: {
    padding: spacing[6],
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[8],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  buildButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: radii.lg,
  },
  buildButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Steps List
  stepsList: {
    gap: spacing[3],
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: 'rgba(59, 218, 209, 0.15)', // Mint with 15% opacity
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: colors.mint,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  stepCardCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green with 15% opacity
    borderColor: colors.riskVeryLow,
  },
  stepCardExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red with 10% opacity
    borderColor: colors.riskHigh,
  },

  // Checkbox
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  checkboxDisabled: {
    backgroundColor: colors.mist,
    borderColor: colors.mist,
  },

  // Step Info
  stepInfo: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  stepIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  stepTitleCompleted: {
    color: colors.charcoal,
  },
  stepTitleExpired: {
    color: colors.red,
  },
  stepNotes: {
    fontSize: 13,
    color: colors.charcoal,
    marginTop: spacing[1],
  },

  // Warning Badges
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    marginTop: spacing[2],
    alignSelf: 'flex-start',
  },
  warningBadgeOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  warningBadgePurple: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.red,
  },
  warningTextOrange: {
    color: colors.orange,
  },
  warningTextPurple: {
    color: colors.purple,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.purple + '30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: 'rgba(129, 51, 246, 0.12)', // Purple with 12% opacity
    borderRadius: radii.xl,
    padding: spacing[5],
    marginTop: spacing[6],
    borderWidth: 2,
    borderColor: colors.purple,
  },
  streakIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#92400E',
  },

  // Freshie Styles
  freshieButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  freshieContainer: {
    marginTop: spacing[3],
    alignItems: 'flex-start',
  },
  freshiePhotoWrapper: {
    position: 'relative',
  },
  freshiePhoto: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.mist,
  },
  freshieDeleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  freshieLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
    marginTop: spacing[1],
  },
});
