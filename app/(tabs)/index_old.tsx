import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { testSupabaseConnection } from '../../src/lib/testConnection';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { globalStyles } from '../../src/theme/styles';

export default function HomeScreen() {
  const router = useRouter();
  
  // Test Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  return (
    <ScrollView className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-lilac rounded-full items-center justify-center mr-3">
              <Text className="text-xl">👤</Text>
            </View>
            <View>
              <Text className="text-sm text-charcoal">Hi there!</Text>
              <Text className="text-xl font-bold text-black">Ready to glow?</Text>
            </View>
          </View>
          <Pressable className="w-10 h-10 items-center justify-center">
            <Text className="text-2xl">🔔</Text>
          </Pressable>
        </View>

        {/* Hero card */}
        <Card variant="hero" className="mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-white/80 mb-1">Your streak</Text>
              <Text className="text-4xl font-bold text-white mb-2">3 days 🔥</Text>
              <Text className="text-sm text-white/70">Keep it up!</Text>
            </View>
            <Text className="text-6xl">✨</Text>
          </View>
        </Card>
      </View>

      {/* Quick actions */}
      <View className="px-6 mb-6">
        <Text className="text-lg font-bold text-black mb-4">Quick actions</Text>
        <View className="flex-row space-x-3">
          <Pressable 
            onPress={() => router.push('/(tabs)/scan')}
            className="flex-1"
          >
            <Card variant="accent" className="items-center py-6">
              <Text className="text-4xl mb-2">📸</Text>
              <Text className="font-semibold text-black">Scan</Text>
            </Card>
          </Pressable>
          
          <Pressable 
            onPress={() => router.push('/(tabs)/routine')}
            className="flex-1"
          >
            <Card variant="default" className="items-center py-6">
              <Text className="text-4xl mb-2">✅</Text>
              <Text className="font-semibold text-black">Routine</Text>
            </Card>
          </Pressable>
          
          <Pressable 
            onPress={() => router.push('/(tabs)/learn')}
            className="flex-1"
          >
            <Card variant="default" className="items-center py-6">
              <Text className="text-4xl mb-2">📚</Text>
              <Text className="font-semibold text-black">Learn</Text>
            </Card>
          </Pressable>
        </View>
      </View>

      {/* Recent scans */}
      <View className="px-6 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-black">Recent scans</Text>
          <Pressable>
            <Text className="text-sm text-purple font-medium">See all</Text>
          </Pressable>
        </View>
        
        <Card variant="default" className="flex-row items-center mb-3">
          <View className="w-12 h-12 bg-mint rounded-xl items-center justify-center mr-3">
            <Text className="text-2xl">✓</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-black">CeraVe Cleanser</Text>
            <Text className="text-sm text-charcoal">Safe for your age • 2 hours ago</Text>
          </View>
        </Card>

        <Card variant="default" className="flex-row items-center">
          <View className="w-12 h-12 bg-warning rounded-xl items-center justify-center mr-3">
            <Text className="text-2xl">⚠️</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-black">The Ordinary Retinol</Text>
            <Text className="text-sm text-charcoal">Use with care • Yesterday</Text>
          </View>
        </Card>
      </View>

      {/* Today's Glow Card */}
      <View className="px-6 pb-8">
        <Text className="text-lg font-bold text-black mb-4">Today's Glow Card</Text>
        <Pressable onPress={() => router.push('/(tabs)/learn')}>
          <Card variant="accent">
            <Text className="text-3xl mb-3">☀️</Text>
            <Text className="text-xl font-bold text-black mb-2">What is SPF?</Text>
            <Text className="text-sm text-charcoal mb-4">
              Learn why sunscreen is your skin's best friend
            </Text>
            <Button variant="primary" size="sm" onPress={() => router.push('/(tabs)/learn')}>
              Read now
            </Button>
          </Card>
        </Pressable>
      </View>
    </ScrollView>
  );
}
