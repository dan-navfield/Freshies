import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors, spacing, radii } from '../../src/theme/tokens';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'hero' | 'accent';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const cardStyles = [
    styles.base,
    styles[`variant_${variant}`],
    style,
  ];
  
  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  variant_default: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing[4],
  },
  variant_hero: {
    backgroundColor: colors.black,
    borderRadius: 48, // 3xl
    padding: spacing[6],
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  variant_accent: {
    backgroundColor: colors.yellow,
    borderRadius: radii.xxl,
    padding: spacing[4],
  },
});
