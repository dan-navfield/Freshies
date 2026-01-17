import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../src/theme/tokens';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';
import { 
  Shield, 
  Lock, 
  Eye, 
  UserCheck,
  AlertCircle,
  Heart,
  CheckCircle
} from 'lucide-react-native';

export default function SafetyScreen() {
  const router = useRouter();

  const SafetyCard = ({ icon: Icon, title, description, iconColor }: any) => (
    <View style={styles.safetyCard}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Icon size={28} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.safetyContent}>
        <Text style={styles.safetyTitle}>{title}</Text>
        <Text style={styles.safetyDescription}>{description}</Text>
      </View>
    </View>
  );

  const RuleItem = ({ rule }: { rule: string }) => (
    <View style={styles.ruleItem}>
      <CheckCircle size={20} color={colors.mint} strokeWidth={2} />
      <Text style={styles.ruleText}>{rule}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Safety & Privacy"
        subtitle="How we keep you safe"
        showAvatar={false}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Shield size={64} color={colors.mint} strokeWidth={2} />
          <Text style={styles.heroTitle}>Your Safety Matters</Text>
          <Text style={styles.heroText}>
            Freshies is designed to be a safe, private space just for you and your parent or guardian.
          </Text>
        </View>

        {/* How We Protect You */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Protect You</Text>

          <SafetyCard
            icon={Lock}
            title="Private by Default"
            description="All your Freshies and information are private. Only you and your connected parent can see them."
            iconColor={colors.purple}
          />

          <SafetyCard
            icon={UserCheck}
            title="Parent Connection"
            description="Your parent or guardian can connect their account to help guide you and keep you safe."
            iconColor={colors.mint}
          />

          <SafetyCard
            icon={Eye}
            title="No Public Sharing"
            description="Your photos never go on the internet or social media. They stay safely on your device and our secure servers."
            iconColor={colors.peach}
          />

          <SafetyCard
            icon={Shield}
            title="Age-Appropriate Content"
            description="Everything in Freshies is designed specifically for kids and teens learning about skincare."
            iconColor={colors.lilac}
          />
        </View>

        {/* Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Collect</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>We Only Collect:</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>• Your name and age range</Text>
              <Text style={styles.infoItem}>• Your skincare photos (Freshies)</Text>
              <Text style={styles.infoItem}>• Your routines and progress</Text>
              <Text style={styles.infoItem}>• Your skin type and concerns</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>We Never:</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>• Share your photos with anyone</Text>
              <Text style={styles.infoItem}>• Sell your information</Text>
              <Text style={styles.infoItem}>• Show you ads based on your data</Text>
              <Text style={styles.infoItem}>• Let strangers contact you</Text>
            </View>
          </View>
        </View>

        {/* Safety Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Rules</Text>

          <RuleItem rule="Only take photos of your skin - never share personal information" />
          <RuleItem rule="Ask your parent before trying new skincare products" />
          <RuleItem rule="Tell your parent if something makes you uncomfortable" />
          <RuleItem rule="Keep your password safe and don't share it with friends" />
          <RuleItem rule="If you see something wrong, tell a trusted adult" />
        </View>

        {/* Parent Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent Controls</Text>
          
          <View style={styles.parentCard}>
            <Heart size={32} color={colors.peach} />
            <Text style={styles.parentTitle}>Your Parent Can:</Text>
            <View style={styles.parentList}>
              <Text style={styles.parentItem}>✓ View your progress and routines</Text>
              <Text style={styles.parentItem}>✓ Help you choose safe products</Text>
              <Text style={styles.parentItem}>✓ See your achievements</Text>
              <Text style={styles.parentItem}>✓ Manage your account settings</Text>
            </View>
            <Text style={styles.parentNote}>
              This helps them support your skincare journey and keep you safe!
            </Text>
          </View>
        </View>

        {/* Questions Section */}
        <View style={styles.questionsSection}>
          <AlertCircle size={32} color={colors.orange} />
          <Text style={styles.questionsTitle}>Have Questions?</Text>
          <Text style={styles.questionsText}>
            Talk to your parent or guardian about privacy and safety. They're here to help you!
          </Text>
          <Text style={styles.questionsSubtext}>
            For more details, ask your parent to read our full Privacy Policy.
          </Text>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustSection}>
          <Shield size={24} color={colors.mint} />
          <Text style={styles.trustText}>
            Freshies is made by Hide and Seek Digital, a company that cares about kids' safety and privacy.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
    marginBottom: spacing[4],
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.deepPurple,
    marginTop: spacing[3],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  heroText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
    marginLeft: spacing[2],
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[1],
  },
  safetyDescription: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[2],
  },
  infoList: {
    gap: spacing[2],
  },
  infoItem: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  parentCard: {
    backgroundColor: colors.white,
    padding: spacing[5],
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  parentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepPurple,
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  parentList: {
    width: '100%',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  parentItem: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  parentNote: {
    fontSize: 13,
    color: colors.charcoal,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  questionsSection: {
    alignItems: 'center',
    padding: spacing[6],
    marginHorizontal: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.orange + '40',
  },
  questionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepPurple,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  questionsText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  questionsSubtext: {
    fontSize: 12,
    color: colors.charcoal,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    marginHorizontal: spacing[4],
    backgroundColor: colors.mint + '20',
    borderRadius: radii.lg,
    marginBottom: spacing[4],
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    color: colors.charcoal,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
