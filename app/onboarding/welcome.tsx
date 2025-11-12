import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream px-6 justify-center">
      {/* Hero illustration placeholder */}
      <View className="items-center mb-8">
        <View className="w-48 h-48 bg-lilac rounded-full items-center justify-center mb-6">
          <Text className="text-6xl">✨</Text>
        </View>
        
        <Text className="text-4xl font-bold text-black text-center mb-3">
          Welcome to Freshies
        </Text>
        
        <Text className="text-lg text-charcoal text-center">
          Clean skincare for growing skin
        </Text>
      </View>

      {/* Info cards */}
      <View className="mb-8 space-y-4">
        <Card variant="accent" className="flex-row items-center">
          <Text className="text-3xl mr-3">🔍</Text>
          <View className="flex-1">
            <Text className="font-semibold text-base text-black">Scan products</Text>
            <Text className="text-sm text-charcoal">Check if they're right for your age</Text>
          </View>
        </Card>

        <Card variant="default" className="flex-row items-center">
          <Text className="text-3xl mr-3">📚</Text>
          <View className="flex-1">
            <Text className="font-semibold text-base text-black">Learn together</Text>
            <Text className="text-sm text-charcoal">Parents and teens, side by side</Text>
          </View>
        </Card>

        <Card variant="default" className="flex-row items-center">
          <Text className="text-3xl mr-3">✅</Text>
          <View className="flex-1">
            <Text className="font-semibold text-base text-black">Build routines</Text>
            <Text className="text-sm text-charcoal">Track what works for you</Text>
          </View>
        </Card>
      </View>

      {/* CTA buttons */}
      <View className="space-y-3">
        <Button onPress={() => router.push('/onboarding/role-select')} size="lg">
          Get Started
        </Button>
        
        <Button 
          onPress={() => router.push('/auth/sign-in')} 
          variant="outline"
          size="lg"
        >
          I already have an account
        </Button>
      </View>
    </View>
  );
}
