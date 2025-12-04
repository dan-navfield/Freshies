/**
 * Navigation Configuration
 * Defines page types and navigation rules for the app
 */

export type PageType = 'main' | 'detail' | 'modal' | 'onboarding' | 'auth';

export type NavigationConfig = {
  showBottomTabs: boolean;
  showBackButton: boolean;
  showAvatar: boolean;
  showSearch: boolean;
  headerStyle: 'default' | 'minimal' | 'transparent' | 'none';
};

/**
 * Page configurations by route pattern
 * More specific patterns should come first
 */
const pageConfigs: { pattern: RegExp; config: NavigationConfig }[] = [
  // Auth pages - no navigation
  {
    pattern: /^\/(auth)\//,
    config: {
      showBottomTabs: false,
      showBackButton: false,
      showAvatar: false,
      showSearch: false,
      headerStyle: 'none',
    },
  },
  
  // Onboarding pages - minimal header
  {
    pattern: /^\/(onboarding|child\/onboarding)\//,
    config: {
      showBottomTabs: false,
      showBackButton: true,
      showAvatar: false,
      showSearch: false,
      headerStyle: 'minimal',
    },
  },
  
  // Main tab pages (Home, Learn, Scan, Routines, History)
  {
    pattern: /^\/(tabs|child)\/(home|learn|scan|routine|routines|history)$/,
    config: {
      showBottomTabs: true,
      showBackButton: false,
      showAvatar: true,
      showSearch: true,
      headerStyle: 'default',
    },
  },
  
  // Account/Profile main pages
  {
    pattern: /^\/(child|parent)\/account$/,
    config: {
      showBottomTabs: true,
      showBackButton: false,
      showAvatar: false, // Avatar is shown in the page content
      showSearch: true,
      headerStyle: 'default',
    },
  },
  
  // Detail pages - no bottom tabs, must have back button
  {
    pattern: /^\/(child|parent)\/(skin-profile|avatar-selector|achievements|freshie-gallery|help|safety)/,
    config: {
      showBottomTabs: false,
      showBackButton: true,
      showAvatar: true,
      showSearch: false,
      headerStyle: 'default',
    },
  },
  
  // Routine builder and editor pages
  {
    pattern: /^\/(child)\/(routine-builder|routine-editor)/,
    config: {
      showBottomTabs: false,
      showBackButton: true,
      showAvatar: false,
      showSearch: false,
      headerStyle: 'minimal',
    },
  },
  
  // Product detail pages
  {
    pattern: /^\/(child|parent)\/product\//,
    config: {
      showBottomTabs: false,
      showBackButton: true,
      showAvatar: false,
      showSearch: false,
      headerStyle: 'default',
    },
  },
  
  // Modal-style pages (terms, privacy, etc)
  {
    pattern: /^\/(auth|child|parent)\/(terms|privacy|about)/,
    config: {
      showBottomTabs: false,
      showBackButton: true,
      showAvatar: false,
      showSearch: false,
      headerStyle: 'minimal',
    },
  },
  
  // Default for any unmatched routes
  {
    pattern: /.*/,
    config: {
      showBottomTabs: false,
      showBackButton: true,
      showAvatar: false,
      showSearch: false,
      headerStyle: 'default',
    },
  },
];

/**
 * Get navigation configuration for a given route
 */
export function getNavigationConfig(pathname: string): NavigationConfig {
  // Find the first matching pattern
  const matchedConfig = pageConfigs.find(({ pattern }) => pattern.test(pathname));
  
  // Return matched config or default
  return matchedConfig?.config || pageConfigs[pageConfigs.length - 1].config;
}

/**
 * Hook to use navigation config in components
 */
import { usePathname } from 'expo-router';
import { useMemo } from 'react';

export function useNavigationConfig(): NavigationConfig {
  const pathname = usePathname();
  
  return useMemo(() => {
    return getNavigationConfig(pathname);
  }, [pathname]);
}

/**
 * Validation rules
 */
export function validateNavigationConfig(config: NavigationConfig): string[] {
  const errors: string[] = [];
  
  // Rule 1: If no bottom tabs, must have back button (except auth/onboarding)
  if (!config.showBottomTabs && !config.showBackButton && config.headerStyle !== 'none') {
    errors.push('Pages without bottom tabs must have a back button');
  }
  
  // Rule 2: Search should only show on main pages
  if (config.showSearch && !config.showBottomTabs) {
    errors.push('Search should only be shown on main tab pages');
  }
  
  return errors;
}

/**
 * Helper to determine if a page is a detail/child page
 */
export function isDetailPage(pathname: string): boolean {
  const config = getNavigationConfig(pathname);
  return !config.showBottomTabs && config.showBackButton;
}

/**
 * Helper to determine if a page is a main tab page
 */
export function isMainTabPage(pathname: string): boolean {
  const config = getNavigationConfig(pathname);
  return config.showBottomTabs;
}
