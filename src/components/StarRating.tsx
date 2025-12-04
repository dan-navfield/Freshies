/**
 * Star Rating Component
 * Interactive star rating widget for product reviews
 */

import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors, spacing } from '../theme/tokens';

interface StarRatingProps {
  rating: number; // 0-5
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  color?: string;
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 24,
  readonly = false,
  color = colors.purple,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handlePress = (starValue: number) => {
    if (!readonly && onRatingChange) {
      // If tapping the same star, set to 0 (clear rating)
      onRatingChange(rating === starValue ? 0 : starValue);
    }
  };

  return (
    <View style={styles.container}>
      {stars.map((starValue) => {
        const isFilled = starValue <= rating;
        const isHalfFilled = starValue - 0.5 === rating;

        if (readonly) {
          // Read-only display
          return (
            <View key={starValue} style={[styles.star, { width: size, height: size }]}>
              <Star
                size={size}
                color={isFilled || isHalfFilled ? color : colors.charcoal + '40'}
                fill={isFilled ? color : isHalfFilled ? color + '80' : 'none'}
              />
            </View>
          );
        }

        // Interactive
        return (
          <TouchableOpacity
            key={starValue}
            onPress={() => handlePress(starValue)}
            style={[styles.star, { width: size + 8, height: size + 8 }]}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <Star
              size={size}
              color={isFilled ? color : colors.charcoal + '40'}
              fill={isFilled ? color : 'none'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  star: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
