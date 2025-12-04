import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, Sparkles } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildApprovedScreen() {
  const handleContinue = () => {
    router.push('/(onboarding)/child-tour' as any);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Hero with gentle animation feel */}
      <View style={styles.hero}>
        <View style={styles.iconContainer}>
          <CheckCircle color="#B8E6D5" size={80} strokeWidth={2} />
        </View>
        
        <View style={styles.sparkles}>
          <Sparkles color="#FFD93D" size={32} />
        </View>

        <Text style={styles.title}>
          You're Approved! 🎉
        </Text>
        <Text style={styles.subtitle}>
          Your parent has approved your account!
        </Text>
      </View>

      {/* Success Message */}
      <View style={styles.messageSection}>
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>
            What This Means
          </Text>
          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <Text style={styles.emoji}>✨</Text>
              <Text style={styles.benefitText}>
                You can now use all of Freshies' features
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.emoji}>👨‍👩‍👧</Text>
              <Text style={styles.benefitText}>
                You're part of your family's community
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.emoji}>🛡️</Text>
              <Text style={styles.benefitText}>
                Your parent can help keep you safe
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity onPress={handleContinue} style={styles.button}>
          <Text style={styles.buttonText}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  hero: { paddingHorizontal: spacing[6], paddingTop: 80, paddingBottom: spacing[8], alignItems: 'center' },
  iconContainer: { backgroundColor: 'rgba(184, 230, 213, 0.3)', borderRadius: radii.pill, padding: spacing[8], marginBottom: spacing[6] },
  sparkles: { alignItems: 'center', marginBottom: spacing[6] },
  title: { fontSize: 48, fontWeight: '700', color: colors.black, marginBottom: spacing[4], textAlign: 'center' },
  subtitle: { fontSize: 20, color: colors.charcoal, textAlign: 'center', lineHeight: 30 },
  messageSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  messageCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing[6] },
  messageTitle: { fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: spacing[3] },
  benefits: { gap: spacing[3] },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[3] },
  emoji: { fontSize: 20, marginRight: spacing[3] },
  benefitText: { flex: 1, fontSize: 16, color: colors.charcoal, lineHeight: 24 },
  buttonSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
  button: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: spacing[4] },
  buttonText: { color: colors.black, textAlign: 'center', fontSize: 18, fontWeight: '600' },
});
