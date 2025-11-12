import { View } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'hero' | 'accent';
  className?: string;
}

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  const variantClasses = {
    default: 'bg-white rounded-2xl p-4 shadow-sm',
    hero: 'bg-black rounded-3xl p-6 shadow-lg',
    accent: 'bg-yellow rounded-2xl p-4 shadow-sm',
  };
  
  return (
    <View className={`${variantClasses[variant]} ${className}`}>
      {children}
    </View>
  );
}
