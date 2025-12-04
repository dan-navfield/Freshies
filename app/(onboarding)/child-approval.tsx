import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Mail, MessageCircle, Clock } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildApprovalScreen() {
  const handleRequestSent = () => {
    // In a real app, this would send an email/notification to parent
    router.replace('/(onboarding)/child-pending');
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Get Parent Approval
        </Text>
        <Text style={styles.subtitle}>
          We need to make sure a parent or guardian knows you're signing up. Choose how you'd like to get their approval:
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          onPress={handleRequestSent}
          style={[styles.option, styles.optionPurple]}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.iconContainer, styles.iconContainerPurple]}>
              <Mail color={colors.purple} size={24} />
            </View>
            <Text style={styles.optionTitle}>
              Send Email
            </Text>
          </View>
          <Text style={styles.optionText}>
            We'll email your parent with a link to approve your account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRequestSent}
          style={[styles.option, styles.optionMint]}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.iconContainer, styles.iconContainerMint]}>
              <MessageCircle color={colors.mint} size={24} />
            </View>
            <Text style={styles.optionTitle}>
              Share Link
            </Text>
          </View>
          <Text style={styles.optionText}>
            Get a special link to share with your parent directly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoBox}>
          <Clock color={colors.yellow} size={20} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            <Text style={styles.infoTextBold}>Usually takes just a few minutes!</Text> Once your parent approves, you'll be able to start using Freshies right away.
          </Text>
        </View>
      </View>

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: 64,
    paddingBottom: spacing[8],
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: 18,
    color: colors.charcoal,
    lineHeight: 28,
  },
  optionsContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
    gap: spacing[4],
  },
  option: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing[5],
    borderWidth: 2,
  },
  optionPurple: {
    borderColor: colors.purple,
  },
  optionMint: {
    borderColor: colors.mint,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconContainer: {
    borderRadius: radii.xl,
    padding: spacing[3],
    marginRight: spacing[4],
  },
  iconContainerPurple: {
    backgroundColor: `${colors.purple}1A`, // 10% opacity
  },
  iconContainerMint: {
    backgroundColor: `${colors.mint}33`, // 20% opacity
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  infoContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  infoBox: {
    backgroundColor: `${colors.yellow}33`, // 20% opacity
    borderRadius: radii.xxl,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: spacing[3],
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  infoTextBold: {
    fontWeight: '600',
  },
  backButtonContainer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  backButton: {
    paddingVertical: spacing[3],
  },
  backButtonText: {
    color: colors.charcoal,
    textAlign: 'center',
    fontSize: 16,
  },
});
