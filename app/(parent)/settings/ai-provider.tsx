import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { ChevronLeft, Check } from 'lucide-react-native';
import { usePreferencesStore } from '../../../src/stores';
import { AIProvider } from '../../../src/services/ai/types';

const AI_PROVIDERS: Array<{
  value: AIProvider;
  label: string;
  description: string;
  recommended?: boolean;
}> = [
  {
    value: 'auto',
    label: 'Auto (Recommended)',
    description: 'Automatically selects the best available provider',
    recommended: true,
  },
  {
    value: 'openai',
    label: 'OpenAI GPT-4',
    description: 'Fast, reliable responses with GPT-4 Turbo',
  },
  {
    value: 'claude',
    label: 'Anthropic Claude',
    description: 'Thoughtful, detailed responses with Claude 3.5',
  },
];

export default function AIProviderSettingsScreen() {
  const { preferredAIProvider, setPreferredAIProvider, adminAIProvider } = usePreferencesStore();
  
  // If admin has locked a provider, show that
  const isLocked = !!adminAIProvider;
  const effectiveProvider = adminAIProvider || preferredAIProvider;

  const handleSelectProvider = (provider: AIProvider) => {
    if (!isLocked) {
      setPreferredAIProvider(provider);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Provider</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Choose AI Provider</Text>
        <Text style={styles.sectionDescription}>
          Select which AI model powers FreshiesAI responses. Different providers may have varying response styles and speeds.
        </Text>

        {isLocked && (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>
              ⚠️ Provider locked by administrator
            </Text>
          </View>
        )}

        {AI_PROVIDERS.map((provider) => (
          <TouchableOpacity
            key={provider.value}
            style={[
              styles.providerCard,
              effectiveProvider === provider.value && styles.providerCardSelected,
              isLocked && styles.providerCardDisabled,
            ]}
            onPress={() => handleSelectProvider(provider.value)}
            disabled={isLocked}
          >
            <View style={styles.providerContent}>
              <View style={styles.providerHeader}>
                <Text style={styles.providerLabel}>{provider.label}</Text>
                {provider.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.providerDescription}>{provider.description}</Text>
            </View>
            {effectiveProvider === provider.value && (
              <View style={styles.checkIcon}>
                <Check size={20} color={colors.purple} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About AI Providers</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>Auto</Text> mode intelligently selects the best available provider based on availability and performance.
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>OpenAI GPT-4</Text> provides fast, consistent responses and is our default recommendation.
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>Claude 3.5</Text> offers more detailed, nuanced responses and may be better for complex questions.
          </Text>
          <Text style={styles.infoText}>
            {'\n'}All providers follow the same safety guidelines and provide evidence-based guidance.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: spacing[6],
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing[2],
  },
  sectionDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  lockedBanner: {
    backgroundColor: '#FFF3CD',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  lockedText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  providerCardSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '08',
  },
  providerCardDisabled: {
    opacity: 0.6,
  },
  providerContent: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  providerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: spacing[2],
  },
  recommendedBadge: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  providerDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  checkIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple + '15',
    borderRadius: 16,
  },
  infoSection: {
    marginTop: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing[3],
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: spacing[2],
  },
  infoBold: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
