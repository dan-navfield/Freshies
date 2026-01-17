/**
 * Floating AI Button
 * Quick access button to open FreshiesAI chat from anywhere
 */

import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Brain } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, radii } from '../theme/tokens';

interface FloatingAIButtonProps {
  onPress?: () => void;
  showLabel?: boolean;
}

export default function FloatingAIButton({ onPress, showLabel = false }: FloatingAIButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/freshies-chat');
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, showLabel && styles.containerWithLabel]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Brain size={24} color={colors.white} />
      </View>
      {showLabel && (
        <Text style={styles.label}>Ask AI</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    right: spacing[6],
    width: 56,
    height: 56,
    backgroundColor: colors.purple,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  containerWithLabel: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginLeft: spacing[2],
  },
});
