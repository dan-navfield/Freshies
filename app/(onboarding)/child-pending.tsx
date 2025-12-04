import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Clock, Mail, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildPendingScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color={colors.charcoal} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Hero */}
        <View style={styles.hero}>
        <View style={styles.iconContainer}>
          <Clock color="#FFD93D" size={64} />
        </View>
        <Text style={styles.title}>
          Waiting for your parent
        </Text>
        <Text style={styles.subtitle}>
          We've sent them a request. You'll get access as soon as they approve it.
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <Mail color="#B8E6D5" size={24} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                Request Sent
              </Text>
              <Text style={styles.statusSubtitle}>
                Check your parent's email
              </Text>
            </View>
          </View>
          <Text style={styles.statusText}>
            Your parent will receive an email with a link to approve your account. It usually only takes a few minutes!
          </Text>
        </View>
      </View>

      {/* What's Next */}
      <View style={styles.stepsSection}>
        <Text style={styles.stepsTitle}>
          What Happens Next?
        </Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1️⃣</Text>
            <Text style={styles.stepText}>
              Your parent clicks the approval link in their email
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2️⃣</Text>
            <Text style={styles.stepText}>
              They confirm it's okay for you to use Freshies
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3️⃣</Text>
            <Text style={styles.stepText}>
              You get a notification and can start using the app!
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/child-preview' as any)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Preview the App
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <RefreshCw color="#8B7AB8" size={20} />
          <Text style={styles.secondaryButtonText}>
            Check Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignOut} style={styles.textButton}>
          <Text style={styles.textButtonText}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing[6], paddingTop: spacing[4], paddingBottom: spacing[2] },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  hero: { paddingHorizontal: spacing[6], paddingTop: spacing[4], paddingBottom: spacing[8], alignItems: 'center' },
  iconContainer: { backgroundColor: 'rgba(255, 217, 61, 0.2)', borderRadius: radii.pill, padding: spacing[6], marginBottom: spacing[6] },
  title: { fontSize: 36, fontWeight: '700', color: colors.black, marginBottom: spacing[3], textAlign: 'center' },
  subtitle: { fontSize: 18, color: colors.charcoal, textAlign: 'center', lineHeight: 28 },
  statusSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  statusCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing[5] },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[4] },
  statusIcon: { backgroundColor: 'rgba(184, 230, 213, 0.2)', borderRadius: radii.md, padding: spacing[3], marginRight: spacing[4] },
  statusContent: { flex: 1 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: spacing[1] },
  statusSubtitle: { fontSize: 14, color: colors.charcoal },
  statusText: { fontSize: 14, color: colors.charcoal, lineHeight: 22 },
  stepsSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  stepsTitle: { fontSize: 20, fontWeight: '700', color: colors.black, marginBottom: spacing[4] },
  steps: { gap: spacing[3] },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[3] },
  stepNumber: { fontSize: 24, marginRight: spacing[3] },
  stepText: { flex: 1, fontSize: 16, color: colors.charcoal, lineHeight: 24 },
  actions: { paddingHorizontal: spacing[6], paddingBottom: spacing[12], gap: spacing[3] },
  primaryButton: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: spacing[4] },
  primaryButtonText: { color: colors.black, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  secondaryButton: { backgroundColor: colors.white, borderRadius: radii.pill, paddingVertical: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.purple, textAlign: 'center', fontSize: 16, fontWeight: '600', marginLeft: spacing[2] },
  textButton: { paddingVertical: spacing[3] },
  textButtonText: { color: colors.charcoal, textAlign: 'center', fontSize: 16 },
});
