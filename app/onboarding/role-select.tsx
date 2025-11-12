import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream px-6 justify-center">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-black text-center mb-3">
          Who's setting up?
        </Text>
        <Text className="text-base text-charcoal text-center">
          Choose your role to get started
        </Text>
      </View>

      <View className="space-y-4">
        {/* Parent card */}
        <Pressable onPress={() => router.push('/onboarding/parent-setup')}>
          <Card variant="hero" className="items-center py-8">
            <Text className="text-5xl mb-4">👨‍👩‍👧‍👦</Text>
            <Text className="text-2xl font-bold text-white mb-2">I'm a Parent</Text>
            <Text className="text-base text-white/80 text-center">
              Set up your family account and invite your child
            </Text>
          </Card>
        </Pressable>

        {/* Child card */}
        <Pressable onPress={() => router.push('/onboarding/child-setup')}>
          <Card variant="accent" className="items-center py-8">
            <Text className="text-5xl mb-4">🧒</Text>
            <Text className="text-2xl font-bold text-black mb-2">I'm Under 18</Text>
            <Text className="text-base text-charcoal text-center">
              Join your family's account with a code
            </Text>
          </Card>
        </Pressable>
      </View>

      <Pressable 
        onPress={() => router.back()}
        className="mt-8 items-center"
      >
        <Text className="text-base text-purple font-medium">← Back</Text>
      </Pressable>
    </View>
  );
}
