import { Pressable, Text, ActivityIndicator } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const baseClasses = 'rounded-pill items-center justify-center flex-row';
  
  const variantClasses = {
    primary: 'bg-purple',
    secondary: 'bg-yellow',
    outline: 'bg-transparent border-2 border-purple',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };
  
  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-black',
    outline: 'text-purple',
  };
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FDFDFD' : '#000000'} />
      ) : (
        <Text className={`font-semibold ${textVariantClasses[variant]} ${textSizeClasses[size]}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
