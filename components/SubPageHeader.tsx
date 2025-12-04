import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing } from '../src/theme/tokens';

interface SubPageHeaderProps {
  title: string;
  subtitle?: string;
  infoStripColor?: string;
  infoStripText?: string;
  onBack?: () => void;
  backRoute?: string; // Optional specific route to navigate back to
}

/**
 * SubPageHeader Component
 * Standard black header with optional colored info strip for subpages
 * Includes back button navigation
 */
export default function SubPageHeader({
  title,
  subtitle,
  infoStripColor,
  infoStripText,
  onBack,
  backRoute,
}: SubPageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backRoute) {
      router.push(backRoute as any);
    } else {
      router.back();
    }
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Black Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.backButton} />
        </View>
      </SafeAreaView>

      {/* Optional Info Strip */}
      {infoStripText && (
        <View style={[styles.infoStrip, infoStripColor && { backgroundColor: infoStripColor }]}>
          <Text style={styles.infoStripText}>{infoStripText}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.black,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  infoStrip: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  infoStripText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
});
