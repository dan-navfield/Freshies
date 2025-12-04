import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../src/theme/tokens';

export const templateStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[8],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Intro
  intro: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[4],
  },
  introEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing[4],
  },

  // Section
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },

  // Template Card
  templateCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.mist,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  templateCardSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  templateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  templateInfo: {
    flex: 1,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  templateName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  templateNameSelected: {
    color: colors.white,
  },
  recommendedBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.black,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  templateDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  templateSteps: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple,
  },
  templateStepsSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[3],
  },

  // Segment Group
  segmentGroup: {
    marginBottom: spacing[5],
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },

  // Step Preview
  stepPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  stepPreviewInfo: {
    flex: 1,
  },
  stepPreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[1],
  },
  stepPreviewDescription: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },

  // Buttons
  createButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    marginTop: spacing[4],
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[3],
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
});
