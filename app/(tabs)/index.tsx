import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { testSupabaseConnection } from '../../src/lib/testConnection';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { globalStyles } from '../../src/theme/styles';

export default function HomeScreen() {
  const router = useRouter();
  
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  return (
    <ScrollView style={globalStyles.scrollContainer}>
      <View style={[globalStyles.px6, globalStyles.pt16, globalStyles.pb6]}>
        <View style={[globalStyles.rowBetween, globalStyles.mb6]}>
          <View style={globalStyles.rowCenter}>
            <View style={[styles.avatar, globalStyles.mr3]}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View>
              <Text style={[globalStyles.textSm, globalStyles.textCharcoal]}>Hi there!</Text>
              <Text style={[globalStyles.textXl, globalStyles.fontBold, globalStyles.textBlack]}>
                Ready to glow?
              </Text>
            </View>
          </View>
          <Pressable style={styles.iconButton}>
            <Text style={styles.icon}>🔔</Text>
          </Pressable>
        </View>

        <View style={[globalStyles.cardHero, globalStyles.mb6]}>
          <View style={globalStyles.rowBetween}>
            <View style={globalStyles.flex1}>
              <Text style={[globalStyles.textSm, styles.textWhiteOpacity]}>Your streak</Text>
              <Text style={[globalStyles.text4xl, globalStyles.fontBold, globalStyles.textWhite, globalStyles.mb3]}>
                3 days 🔥
              </Text>
              <Text style={[globalStyles.textSm, styles.textWhiteOpacity70]}>Keep it up!</Text>
            </View>
            <Text style={styles.heroEmoji}>✨</Text>
          </View>
        </View>
      </View>

      <View style={[globalStyles.px6, globalStyles.mb6]}>
        <Text style={[globalStyles.textLg, globalStyles.fontBold, globalStyles.textBlack, globalStyles.mb4]}>
          Quick actions
        </Text>
        <View style={globalStyles.row}>
          <Pressable 
            onPress={() => router.push('/(tabs)/scan')}
            style={[globalStyles.flex1, globalStyles.mr3]}
          >
            <View style={[globalStyles.cardAccent, globalStyles.itemsCenter]}>
              <Text style={styles.actionEmoji}>📸</Text>
              <Text style={[globalStyles.fontSemibold, globalStyles.textBlack]}>
                Scan
              </Text>
            </View>
          </Pressable>
          
          <Pressable 
            onPress={() => router.push('/(tabs)/routine')}
            style={[globalStyles.flex1, globalStyles.mr3]}
          >
            <View style={[globalStyles.card, globalStyles.itemsCenter]}>
              <Text style={styles.actionEmoji}>✅</Text>
              <Text style={[globalStyles.fontSemibold, globalStyles.textBlack]}>
                Routine
              </Text>
            </View>
          </Pressable>
          
          <Pressable 
            onPress={() => router.push('/(tabs)/learn')}
            style={globalStyles.flex1}
          >
            <View style={[globalStyles.card, globalStyles.itemsCenter]}>
              <Text style={styles.actionEmoji}>📚</Text>
              <Text style={[globalStyles.fontSemibold, globalStyles.textBlack]}>
                Learn
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={[globalStyles.px6, globalStyles.pb8]}>
        <Text style={[globalStyles.textLg, globalStyles.fontBold, globalStyles.textBlack, globalStyles.mb4]}>
          Welcome to Freshies! 🎉
        </Text>
        <View style={globalStyles.card}>
          <Text style={[globalStyles.textBase, globalStyles.textCharcoal]}>
            Your Supabase database is connected and ready. Check the console for connection test results.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.lilac,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textWhiteOpacity: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  textWhiteOpacity70: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  heroEmoji: {
    fontSize: 60,
  },
  actionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
});
