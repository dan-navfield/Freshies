import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../src/theme/tokens';
import DetailPageHeader from '../../components/DetailPageHeader';
import { 
  Camera, 
  Sparkles, 
  Heart, 
  Search, 
  FolderHeart,
  Star,
  Smile,
  Award,
  HelpCircle
} from 'lucide-react-native';

export default function HelpScreen() {
  const router = useRouter();

  const HelpSection = ({ icon: Icon, title, description, iconColor }: any) => (
    <View style={styles.helpCard}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Icon size={28} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.helpContent}>
        <Text style={styles.helpTitle}>{title}</Text>
        <Text style={styles.helpDescription}>{description}</Text>
      </View>
    </View>
  );

  const TipCard = ({ emoji, tip }: { emoji: string; tip: string }) => (
    <View style={styles.tipCard}>
      <Text style={styles.tipEmoji}>{emoji}</Text>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="How to Use Freshies"
        subtitle="Your guide to getting started"
        showAvatar={false}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeEmoji}>✨</Text>
          <Text style={styles.welcomeTitle}>Welcome to Freshies!</Text>
          <Text style={styles.welcomeText}>
            Your personal skincare journey tracker. Here's everything you need to know to get started!
          </Text>
        </View>

        {/* Main Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Features</Text>

          <HelpSection
            icon={Camera}
            title="Take Freshies"
            description="Snap photos of your skin to track your progress. Add moods, notes, and fun stickers to make each photo special!"
            iconColor={colors.purple}
          />

          <HelpSection
            icon={Sparkles}
            title="Build Your Routine"
            description="Create your perfect skincare routine with morning and evening steps. We'll remind you when it's time!"
            iconColor={colors.mint}
          />

          <HelpSection
            icon={FolderHeart}
            title="Create Collections"
            description="Organize your Freshies into albums like 'Spa Nights' or 'Glowing Days'. Make your own memory museum!"
            iconColor={colors.peach}
          />

          <HelpSection
            icon={Search}
            title="Smart Search"
            description="Find any Freshie by mood, date, or tags. Try searching 'happy' or 'morning routine'!"
            iconColor={colors.lilac}
          />

          <HelpSection
            icon={Award}
            title="Earn Achievements"
            description="Complete routines, take Freshies, and build streaks to earn badges and level up!"
            iconColor={colors.yellow}
          />
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>

          <TipCard
            emoji="📸"
            tip="Take Freshies in good lighting - natural light works best!"
          />

          <TipCard
            emoji="😊"
            tip="Add moods to your Freshies to remember how you felt"
          />

          <TipCard
            emoji="⭐"
            tip="Mark your favorite Freshies with a star for easy access"
          />

          <TipCard
            emoji="🎨"
            tip="Decorate your Freshies with stickers and frames to make them fun!"
          />

          <TipCard
            emoji="📅"
            tip="Check your progress page to see your skincare journey over time"
          />

          <TipCard
            emoji="🔍"
            tip="Use search prefixes like 'mood:happy' or 'time:morning' for smart filtering"
          />
        </View>

        {/* Getting Started */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Set Up Your Profile</Text>
                <Text style={styles.stepDescription}>
                  Add your skin type and concerns so we can give you better tips
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Build Your Routine</Text>
                <Text style={styles.stepDescription}>
                  Create a simple morning and evening routine to get started
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Take Your First Freshie</Text>
                <Text style={styles.stepDescription}>
                  Snap a photo after your routine to start tracking your journey
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Explore & Have Fun!</Text>
                <Text style={styles.stepDescription}>
                  Try collections, earn badges, and make your skincare journey your own
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Need More Help */}
        <View style={styles.needHelpSection}>
          <HelpCircle size={32} color={colors.purple} />
          <Text style={styles.needHelpTitle}>Still Need Help?</Text>
          <Text style={styles.needHelpText}>
            Ask your parent or guardian if you have questions. They can help you get the most out of Freshies!
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
  welcomeSection: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
    marginBottom: spacing[4],
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: spacing[3],
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  welcomeText: {
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
  helpCard: {
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
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[1],
  },
  helpDescription: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  stepsContainer: {
    gap: spacing[3],
  },
  stepItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[1],
  },
  stepDescription: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  needHelpSection: {
    alignItems: 'center',
    padding: spacing[6],
    marginHorizontal: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing[4],
  },
  needHelpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepPurple,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  needHelpText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
