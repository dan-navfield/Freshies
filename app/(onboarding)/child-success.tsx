import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PartyPopper, Sparkles } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildSuccessScreen() {
  const { user, refreshSession } = useAuth();
  const [completing, setCompleting] = useState(false);

  // Mark onboarding as complete
  useEffect(() => {
    const completeOnboarding = async () => {
      if (!user) return;
      
      try {
        console.log('✅ Marking child onboarding as complete');
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;

        await refreshSession();
      } catch (error) {
        console.error('Error completing onboarding:', error);
      }
    };

    completeOnboarding();
  }, [user]);

  const handleContinue = async () => {
    setCompleting(true);
    
    // Small delay for UX
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <PartyPopper color="#B8E6D5" size={64} />
        </View>

        {/* Headline */}
        <Text style={styles.title}>
          You're All Set! 🎉
        </Text>
        
        <Text style={styles.subtitle}>
          Have fun exploring!
        </Text>

        {/* Encouragement */}
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Sparkles color="#FFD93D" size={32} />
          </View>
          <Text style={styles.cardText}>
            Remember, your parent is here to help you stay safe and make the most of Freshies. Have fun learning about healthy habits!
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={completing}
          style={[styles.button, completing && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {completing ? 'Loading...' : 'Go to My Dashboard'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, paddingHorizontal: spacing[6], justifyContent: 'center', alignItems: 'center' },
  iconContainer: { backgroundColor: 'rgba(184, 230, 213, 0.3)', borderRadius: radii.pill, padding: spacing[8], marginBottom: spacing[6] },
  title: { fontSize: 36, fontWeight: '700', color: colors.black, textAlign: 'center', marginBottom: spacing[4] },
  subtitle: { fontSize: 20, color: colors.charcoal, textAlign: 'center', lineHeight: 30, marginBottom: spacing[2] },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing[6], marginTop: spacing[8], width: '100%' },
  cardIcon: { alignItems: 'center', marginBottom: spacing[4] },
  cardText: { fontSize: 16, color: colors.charcoal, textAlign: 'center', lineHeight: 24 },
  buttonContainer: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
  button: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: spacing[4] },
  buttonText: { color: colors.black, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});
