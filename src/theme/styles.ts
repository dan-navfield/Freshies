import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from './tokens';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  
  // Padding & Spacing
  px6: { paddingHorizontal: spacing[6] },
  py6: { paddingVertical: spacing[6] },
  pt16: { paddingTop: 64 },
  pb6: { paddingBottom: spacing[6] },
  pb8: { paddingBottom: spacing[8] },
  mb3: { marginBottom: spacing[3] },
  mb4: { marginBottom: spacing[4] },
  mb6: { marginBottom: spacing[6] },
  mb8: { marginBottom: spacing[8] },
  mr3: { marginRight: spacing[3] },
  
  // Flex
  row: { flexDirection: 'row' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  itemsCenter: { alignItems: 'center' },
  justifyCenter: { justifyContent: 'center' },
  
  // Text
  textBlack: { color: colors.black },
  textWhite: { color: colors.white },
  textCharcoal: { color: colors.charcoal },
  textPurple: { color: colors.purple },
  textCenter: { textAlign: 'center' },
  
  fontBold: { fontWeight: '700' },
  fontSemibold: { fontWeight: '600' },
  fontMedium: { fontWeight: '500' },
  
  textXs: { fontSize: 12 },
  textSm: { fontSize: 14 },
  textBase: { fontSize: 16 },
  textLg: { fontSize: 18 },
  textXl: { fontSize: 20 },
  text2xl: { fontSize: 24 },
  text3xl: { fontSize: 30 },
  text4xl: { fontSize: 36 },
  
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHero: {
    backgroundColor: colors.black,
    borderRadius: radii.xxl,
    padding: spacing[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardAccent: {
    backgroundColor: colors.yellow,
    borderRadius: radii.xl,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Buttons
  button: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.purple,
  },
  buttonSecondary: {
    backgroundColor: colors.yellow,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.purple,
  },
  
  // Rounded elements
  roundedFull: { borderRadius: 9999 },
  roundedXl: { borderRadius: radii.xl },
  rounded2xl: { borderRadius: radii.xxl },
  
  // Sizes
  w12: { width: 48 },
  h12: { height: 48 },
  w10: { width: 40 },
  h10: { height: 40 },
  wFull: { width: '100%' },
});
