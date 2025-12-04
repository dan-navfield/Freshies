import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, ScanBarcode, BookOpen, Sparkles, History } from 'lucide-react-native';
import { colors } from '../src/theme/tokens';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const icons = {
    index: Home,
    home: Home,
    scan: ScanBarcode,
    learn: BookOpen,
    favorites: BookOpen,
    routine: Sparkles,
    history: History,
    'approved-products': History,
  };

  // Filter out hidden routes (routes with href: null)
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // @ts-ignore - href exists but not in type definition
    return options.href !== null;
  });

  const renderTab = (route: any, originalIndex: number) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel ?? options.title ?? route.name;
    const isFocused = state.index === originalIndex;
    const Icon = icons[route.name as keyof typeof icons];

    const onPress = () => {
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

  // Find scan route index in visible routes
  const scanRouteIndex = visibleRoutes.findIndex(r => r.name === 'scan');
  const scanRoute = visibleRoutes[scanRouteIndex];
  const ScanIcon = icons.scan;
  
  const onScanPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: scanRoute.key,
      canPreventDefault: true,
    });

    if (state.index !== 2 && !event.defaultPrevented) {
      navigation.navigate(scanRoute.name);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {/* Home */}
        {visibleRoutes[0] && renderTab(visibleRoutes[0], state.routes.indexOf(visibleRoutes[0]))}
        
        {/* Learn */}
        {visibleRoutes[1] && renderTab(visibleRoutes[1], state.routes.indexOf(visibleRoutes[1]))}
        
        {/* Spacer for middle button */}
        <View style={styles.middleSpace} />
        
        {/* Routine */}
        {visibleRoutes[3] && renderTab(visibleRoutes[3], state.routes.indexOf(visibleRoutes[3]))}
        
        {/* History */}
        {visibleRoutes[4] && renderTab(visibleRoutes[4], state.routes.indexOf(visibleRoutes[4]))}
      </View>
      
      {/* Elevated Scan Button */}
      <TouchableOpacity
        onPress={onScanPress}
        style={styles.middleButton}
      >
        <View style={styles.middleButtonInner}>
          <ScanIcon color="#FFFFFF" size={28} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
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
    zIndex: 10,
  },
  middleButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple, // Brand purple: #8133F6
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
});
