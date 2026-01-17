import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Easing, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, ScanBarcode, BookOpen, Sparkles, History, Package, ShoppingBag, Leaf, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const icons = {
    index: Home,
    home: Home,
    scan: ScanBarcode,
    learn: BookOpen,
    favorites: BookOpen,
    routine: Sparkles,
    history: History,
    'approved-products': History,
    shelf: Package,
  };

  // Filter out hidden routes (routes with href: null)
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // @ts-ignore - href exists but not in type definition
    return options.href !== null;
  });

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    setIsMenuOpen(!isMenuOpen);
  };

  const traverseTo = (route: string) => {
    toggleMenu();
    // Small delay to allow animation to start closing
    setTimeout(() => {
      if (route === 'scan') {
        navigation.navigate('scan');
      } else {
        router.push(route as any);
      }
    }, 100);
  };

  const renderTab = (route: any, originalIndex: number) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel ?? options.title ?? route.name;
    const isFocused = state.index === originalIndex;
    const Icon = icons[route.name as keyof typeof icons];

    const onPress = () => {
      if (isMenuOpen) toggleMenu();

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.tab}
      >
        <Icon
          color={isFocused ? '#FFFFFF' : '#6B7280'}
          size={24}
        />
        <Text
          style={[
            styles.label,
            { color: isFocused ? '#FFFFFF' : '#6B7280' },
          ]}
        >
          {label as string}
        </Text>
      </TouchableOpacity>
    );
  };

  // interpolated animations
  const fanRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const scanScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  // Fan Buttons positioning
  // Left: Ingredients (-70px x, -60px y)
  const ingredientsTransY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  const ingredientsTransX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });
  const ingredientsOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Right: Products (70px x, -60px y)
  const productsTransY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  const productsTransX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });
  const productsOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Center: Scan (0px x, -90px y)
  const centerTransY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -90],
  });
  const centerOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Dimming background
  const bgOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <>
      {/* Dimming Background Overlay */}
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[styles.dimOverlay, { opacity: bgOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container}>

        {/* Fan Menu Items (Rendered BEHIND main button initially, but animating out) */}

        {/* Left: Ingredients */}
        <Animated.View
          style={[
            styles.fanItemContainer,
            {
              opacity: ingredientsOpacity,
              transform: [{ translateX: ingredientsTransX }, { translateY: ingredientsTransY }]
            }
          ]}
        >
          <TouchableOpacity style={styles.fanButton} onPress={() => traverseTo('/(child)/ingredients')}>
            <View style={[styles.fanIconCircle, styles.mintBg]}>
              <Leaf color={colors.black} size={24} />
            </View>
            <Text style={styles.fanLabel}>Ingredients</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Center: Scan */}
        <Animated.View
          style={[
            styles.fanItemContainer,
            {
              opacity: centerOpacity,
              transform: [{ translateY: centerTransY }]
            }
          ]}
        >
          <TouchableOpacity style={styles.fanButton} onPress={() => traverseTo('scan')}>
            <View style={[styles.fanIconCircle, styles.purpleBg]}>
              <ScanBarcode color={colors.white} size={28} />
            </View>
            <Text style={styles.fanLabel}>Scan</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Right: Products */}
        <Animated.View
          style={[
            styles.fanItemContainer,
            {
              opacity: productsOpacity,
              transform: [{ translateX: productsTransX }, { translateY: productsTransY }]
            }
          ]}
        >
          <TouchableOpacity style={styles.fanButton} onPress={() => traverseTo('/(child)/products')}>
            <View style={[styles.fanIconCircle, styles.yellowBg]}>
              <ShoppingBag color={colors.black} size={24} />
            </View>
            <Text style={styles.fanLabel}>Products</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.tabBar}>
          {/* Home */}
          {visibleRoutes[0] && renderTab(visibleRoutes[0], state.routes.indexOf(visibleRoutes[0]))}

          {/* Learn (Favorites) */}
          {visibleRoutes[1] && renderTab(visibleRoutes[1], state.routes.indexOf(visibleRoutes[1]))}

          {/* Spacer for middle button */}
          <View style={styles.middleSpace} />

          {/* Routine */}
          {visibleRoutes[3] && renderTab(visibleRoutes[3], state.routes.indexOf(visibleRoutes[3]))}

          {/* History/Shelf */}
          {visibleRoutes[4] && renderTab(visibleRoutes[4], state.routes.indexOf(visibleRoutes[4]))}
        </View>

        {/* Main Trigger Button */}
        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.9}
          style={styles.middleButton}
        >
          <Animated.View
            style={[
              styles.middleButtonInner,
              {
                transform: [
                  { rotate: fanRotation },
                  { scale: scanScale }
                ]
              }
            ]}
          >
            {isMenuOpen ? (
              <X color="#FFFFFF" size={28} />
            ) : (
              <ScanBarcode color="#FFFFFF" size={28} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dimOverlay: {
    position: 'absolute',
    top: -height, // Cover entire screen
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 2,
    backgroundColor: '#000',
    zIndex: 5, // Below tabs but above content
  },
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 30,
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  middleSpace: {
    width: 80,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  middleButton: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 20, // Above everything
  },
  middleButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple, // Brand purple
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Fan Menu Styles
  fanItemContainer: {
    position: 'absolute',
    bottom: 20, // Start from button center/bottom
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  fanButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 4,
  },
  fanLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mintBg: { backgroundColor: colors.mint },
  purpleBg: { backgroundColor: colors.purple },
  yellowBg: { backgroundColor: colors.yellow },
});
