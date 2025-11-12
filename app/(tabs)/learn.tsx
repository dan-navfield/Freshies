import { View, Text, ScrollView, Pressable } from 'react-native';
import { Card } from '../../components/ui/Card';

const glowCards = [
  {
    id: 1,
    emoji: '☀️',
    title: 'What is SPF?',
    description: "Learn why sunscreen is your skin's best friend",
    tags: ['Basics', 'Sunscreen'],
    readTime: '2 min',
  },
  {
    id: 2,
    emoji: '💧',
    title: 'Why Hydration Matters',
    description: "Even oily skin needs moisture. Here's why.",
    tags: ['Hydration', 'Ingredients'],
    readTime: '3 min',
  },
  {
    id: 3,
    emoji: '🧼',
    title: 'Gentle Cleansing 101',
    description: 'How to clean your skin without stripping it',
    tags: ['Cleansing', 'Basics'],
    readTime: '2 min',
  },
  {
    id: 4,
    emoji: '🌟',
    title: 'Understanding Ingredients',
    description: 'What those long names actually mean',
    tags: ['Ingredients', 'Science'],
    readTime: '4 min',
  },
];

export default function LearnScreen() {
  return (
    <ScrollView className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-3xl font-bold text-black mb-2">Learn</Text>
        <Text className="text-base text-charcoal">
          Build your skincare knowledge, one Glow Card at a time
        </Text>
      </View>

      {/* Progress */}
      <View className="px-6 mb-6">
        <Card variant="hero">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-white/80 mb-1">Your progress</Text>
              <Text className="text-2xl font-bold text-white mb-2">3 of 12 completed</Text>
              <View className="h-2 bg-white/20 rounded-pill overflow-hidden">
                <View className="h-full bg-yellow rounded-pill" style={{ width: '25%' }} />
              </View>
            </View>
            <Text className="text-5xl ml-4">📚</Text>
          </View>
        </Card>
      </View>

      {/* Glow Cards */}
      <View className="px-6 pb-8">
        <Text className="text-lg font-bold text-black mb-4">Glow Cards</Text>
        
        {glowCards.map((card, index) => (
          <Pressable key={card.id} className="mb-4">
            <Card variant={index === 0 ? 'accent' : 'default'}>
              <View className="flex-row items-start">
                <Text className="text-4xl mr-4">{card.emoji}</Text>
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    {card.tags.map((tag) => (
                      <View 
                        key={tag} 
                        className="bg-lilac px-2 py-1 rounded-pill mr-2"
                      >
                        <Text className="text-xs text-black">{tag}</Text>
                      </View>
                    ))}
                    <Text className="text-xs text-charcoal ml-auto">{card.readTime}</Text>
                  </View>
                  <Text className="text-lg font-bold text-black mb-1">{card.title}</Text>
                  <Text className="text-sm text-charcoal">{card.description}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Achievements */}
      <View className="px-6 pb-8">
        <Text className="text-lg font-bold text-black mb-4">Your badges</Text>
        <View className="flex-row flex-wrap">
          <View className="w-20 h-20 bg-mint rounded-2xl items-center justify-center mr-3 mb-3">
            <Text className="text-3xl">⭐</Text>
          </View>
          <View className="w-20 h-20 bg-yellow rounded-2xl items-center justify-center mr-3 mb-3">
            <Text className="text-3xl">🔥</Text>
          </View>
          <View className="w-20 h-20 bg-lavender rounded-2xl items-center justify-center mr-3 mb-3">
            <Text className="text-3xl">📖</Text>
          </View>
          <View className="w-20 h-20 bg-white border-2 border-dashed border-charcoal/20 rounded-2xl items-center justify-center">
            <Text className="text-2xl">🔒</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
