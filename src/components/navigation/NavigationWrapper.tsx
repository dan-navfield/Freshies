import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationConfig } from '../../config/navigationConfig';
import CustomTabBar from './CustomTabBar';
import { usePathname, useSegments } from 'expo-router';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that conditionally shows/hides navigation elements
 * based on the current route configuration
 */
export default function NavigationWrapper({ children }: NavigationWrapperProps) {
  const config = useNavigationConfig();
  const pathname = usePathname();
  const segments = useSegments();
  
  // Don't show tab bar on auth screens or if config says not to
  const shouldShowTabBar = config.showBottomTabs && !pathname.includes('/auth/');
  
  return (
    <View style={styles.container}>
      <View style={[styles.content, !shouldShowTabBar && styles.contentFullHeight]}>
        {children}
      </View>
      
      {shouldShowTabBar && (
        <View style={styles.tabBarContainer}>
          <CustomTabBar />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentFullHeight: {
    // When no tab bar, content takes full height
    paddingBottom: 0,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
