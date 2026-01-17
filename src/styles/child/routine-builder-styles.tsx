import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

export const routineBuilderStyles = StyleSheet.create({
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing[4],
  },
  saveButton: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Step Card
  stepCard: {
    backgroundColor: '#E0F7F4',
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: '#B8EDE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dragHandle: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: spacing[3],
    paddingVertical: spacing[2],
  },
  stepContent: {
    flex: 1,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing[3],
  },

  // Step Type
  stepTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
    borderWidth: 2,
    borderColor: '#B8EDE7',
  },
  stepTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    flex: 1,
  },
  stepTypeButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  stepTypeButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  stepTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'capitalize',
  },
  stepTypeButtonTextActive: {
    color: colors.white,
  },

  // Product Selector
  productSelector: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  productPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  productPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.purple,
  },
  productBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },

  // Inputs
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 0,
  },

  // Add Step Button
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: colors.purple,
    borderStyle: 'dashed',
  },
  addStepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: '85%',
    paddingBottom: spacing[10],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    margin: spacing[6],
    marginBottom: spacing[4],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  productResult: {
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  resultBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: 12,
    color: colors.charcoal,
  },
  noResults: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[8],
  },
});
