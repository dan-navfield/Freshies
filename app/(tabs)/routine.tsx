import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const sampleProducts = {
  AM: [
    { id: 1, name: 'CeraVe Cleanser', checked: true },
    { id: 2, name: 'Hydro Boost Moisturizer', checked: true },
    { id: 3, name: 'Sunscreen SPF 50', checked: false },
  ],
  PM: [
    { id: 4, name: 'CeraVe Cleanser', checked: false },
    { id: 5, name: 'Niacinamide Serum', checked: false },
    { id: 6, name: 'Night Moisturizer', checked: false },
  ],
};

export default function RoutineScreen() {
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [products, setProducts] = useState(sampleProducts);

  const toggleProduct = (id: number) => {
    setProducts((prev) => ({
      ...prev,
      [period]: prev[period].map((p) =>
        p.id === id ? { ...p, checked: !p.checked } : p
      ),
    }));
  };

  const completedCount = products[period].filter((p) => p.checked).length;
  const totalCount = products[period].length;

  return (
    <ScrollView className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-3xl font-bold text-black mb-2">My Routine</Text>
        <Text className="text-base text-charcoal">
          Track your skincare routine and build healthy habits
        </Text>
      </View>

      {/* Period selector */}
      <View className="px-6 mb-6">
        <View className="flex-row bg-white rounded-pill p-1">
          <Pressable
            onPress={() => setPeriod('AM')}
            className={`flex-1 py-3 rounded-pill items-center ${
              period === 'AM' ? 'bg-purple' : ''
            }`}
          >
            <Text
              className={`font-semibold ${
                period === 'AM' ? 'text-white' : 'text-charcoal'
              }`}
            >
              ☀️ Morning
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPeriod('PM')}
            className={`flex-1 py-3 rounded-pill items-center ${
              period === 'PM' ? 'bg-purple' : ''
            }`}
          >
            <Text
              className={`font-semibold ${
                period === 'PM' ? 'text-white' : 'text-charcoal'
              }`}
            >
              🌙 Evening
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Progress card */}
      <View className="px-6 mb-6">
        <Card variant="hero">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-white/80 mb-1">Today's progress</Text>
              <Text className="text-3xl font-bold text-white mb-2">
                {completedCount} of {totalCount} done
              </Text>
              <View className="h-2 bg-white/20 rounded-pill overflow-hidden">
                <View
                  className="h-full bg-mint rounded-pill"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </View>
            </View>
            <Text className="text-5xl ml-4">
              {completedCount === totalCount ? '🎉' : '✨'}
            </Text>
          </View>
        </Card>
      </View>

      {/* Routine items */}
      <View className="px-6 pb-8">
        <Text className="text-lg font-bold text-black mb-4">
          {period === 'AM' ? 'Morning' : 'Evening'} routine
        </Text>

        {products[period].map((product) => (
          <Pressable
            key={product.id}
            onPress={() => toggleProduct(product.id)}
            className="mb-3"
          >
            <Card variant="default" className="flex-row items-center">
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                  product.checked
                    ? 'bg-mint border-mint'
                    : 'border-charcoal/30'
                }`}
              >
                {product.checked && <Text className="text-sm">✓</Text>}
              </View>
              <Text
                className={`flex-1 font-medium ${
                  product.checked ? 'text-charcoal/50 line-through' : 'text-black'
                }`}
              >
                {product.name}
              </Text>
            </Card>
          </Pressable>
        ))}

        <Button
          variant="outline"
          size="md"
          onPress={() => {}}
          className="mt-4"
        >
          + Add product
        </Button>
      </View>
    </ScrollView>
  );
}
