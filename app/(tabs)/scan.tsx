import { View, Text, Pressable } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ScanScreen() {
  return (
    <View className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-3xl font-bold text-black mb-2">Scan</Text>
        <Text className="text-base text-charcoal">
          Check if a product is right for your age
        </Text>
      </View>

      {/* Scan area */}
      <View className="flex-1 px-6 justify-center items-center">
        <Card variant="hero" className="w-full items-center py-12">
          <Text className="text-7xl mb-6">📸</Text>
          <Text className="text-2xl font-bold text-white mb-3">Ready to scan</Text>
          <Text className="text-base text-white/80 text-center mb-8">
            Point your camera at a product barcode or ingredient list
          </Text>
          <Button variant="secondary" size="lg" onPress={() => {}}>
            Open Camera
          </Button>
        </Card>

        {/* Or manually search */}
        <View className="mt-6 w-full">
          <Text className="text-sm text-charcoal text-center mb-3">or</Text>
          <Button variant="outline" size="md" onPress={() => {}}>
            Search by product name
          </Button>
        </View>
      </View>

      {/* Recent scans */}
      <View className="px-6 pb-8">
        <Text className="text-lg font-bold text-black mb-4">Recent scans</Text>
        
        <Pressable className="mb-3">
          <Card variant="default" className="flex-row items-center">
            <View className="w-12 h-12 bg-mint rounded-xl items-center justify-center mr-3">
              <Text className="text-2xl">✓</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-black">CeraVe Cleanser</Text>
              <Text className="text-sm text-charcoal">Safe for your age</Text>
            </View>
            <Text className="text-2xl">→</Text>
          </Card>
        </Pressable>

        <Pressable>
          <Card variant="default" className="flex-row items-center">
            <View className="w-12 h-12 bg-warning rounded-xl items-center justify-center mr-3">
              <Text className="text-2xl">⚠️</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-black">The Ordinary Retinol</Text>
              <Text className="text-sm text-charcoal">Use with care</Text>
            </View>
            <Text className="text-2xl">→</Text>
          </Card>
        </Pressable>
      </View>
    </View>
  );
}
