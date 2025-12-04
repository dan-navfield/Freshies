import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Lock, Home, User, BookOpen } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildPreviewScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Preview Mode
        </Text>
        <Text style={styles.subtitle}>
          Here's a sneak peek of what you'll be able to do once your parent approves your account!
        </Text>
      </View>

      {/* Locked Features */}
      <View style={styles.features}>
        {/* Home */}
        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View style={styles.featureTitle}>
              <View style={[styles.icon, styles.mintIcon]}>
                <Home color="#B8E6D5" size={24} />
              </View>
              <Text style={styles.featureName}>
                Your Dashboard
              </Text>
            </View>
            <Lock color="#9CA3AF" size={20} />
          </View>
          <Text style={styles.featureText}>
            See your routines, tasks, and progress all in one place
          </Text>
          <View style={styles.lockBanner}>
            <Text style={styles.lockText}>
              🔒 You'll be able to use this once your parent approves your account
            </Text>
          </View>
        </View>

        {/* Profile */}
        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View style={styles.featureTitle}>
              <View style={[styles.icon, styles.purpleIcon]}>
                <User color="#8B7AB8" size={24} />
              </View>
              <Text style={styles.featureName}>
                Your Profile
              </Text>
            </View>
            <Lock color="#9CA3AF" size={20} />
          </View>
          <Text style={styles.featureText}>
            Customize your avatar, track your achievements, and more
          </Text>
          <View style={styles.lockBanner}>
            <Text style={styles.lockText}>
              🔒 You'll be able to use this once your parent approves your account
            </Text>
          </View>
        </View>

        {/* Learn */}
        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View style={styles.featureTitle}>
              <View style={[styles.icon, styles.yellowIcon]}>
                <BookOpen color="#FFD93D" size={24} />
              </View>
              <Text style={styles.featureName}>
                Learning Center
              </Text>
            </View>
            <Lock color="#9CA3AF" size={20} />
          </View>
          <Text style={styles.featureText}>
            Discover fun facts about skincare and healthy habits
          </Text>
          <View style={styles.lockBanner}>
            <Text style={styles.lockText}>
              🔒 You'll be able to use this once your parent approves your account
            </Text>
          </View>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Almost There!
          </Text>
          <Text style={styles.infoText}>
            Your parent can help manage your settings and make sure everything is safe for you to use. Once they approve, all these features will unlock!
          </Text>
        </View>
      </View>

      {/* Back Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity onPress={handleBack} style={styles.button}>
          <Text style={styles.buttonText}>
            Back to Waiting Screen
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing[6], paddingTop: 64, paddingBottom: spacing[8] },
  title: { fontSize: 36, fontWeight: '700', color: colors.black, marginBottom: spacing[3] },
  subtitle: { fontSize: 16, color: colors.charcoal, lineHeight: 24 },
  features: { paddingHorizontal: spacing[6], marginBottom: spacing[8], gap: spacing[4] },
  featureCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing[5], opacity: 0.6, marginBottom: spacing[4] },
  featureHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  featureTitle: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { borderRadius: radii.md, padding: spacing[3], marginRight: spacing[4] },
  mintIcon: { backgroundColor: 'rgba(184, 230, 213, 0.2)' },
  purpleIcon: { backgroundColor: 'rgba(139, 122, 184, 0.1)' },
  yellowIcon: { backgroundColor: 'rgba(255, 217, 61, 0.2)' },
  featureName: { fontSize: 20, fontWeight: '700', color: colors.black },
  featureText: { fontSize: 14, color: colors.charcoal, lineHeight: 22 },
  lockBanner: { marginTop: spacing[3], backgroundColor: 'rgba(255, 217, 61, 0.2)', borderRadius: radii.md, padding: spacing[3] },
  lockText: { fontSize: 12, color: colors.charcoal },
  infoSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  infoBox: { backgroundColor: 'rgba(184, 230, 213, 0.3)', borderRadius: radii.lg, padding: spacing[4] },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.black, marginBottom: spacing[2] },
  infoText: { fontSize: 14, color: colors.charcoal, lineHeight: 22 },
  buttonSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
  button: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: spacing[4] },
  buttonText: { color: colors.black, textAlign: 'center', fontSize: 18, fontWeight: '600' },
});
