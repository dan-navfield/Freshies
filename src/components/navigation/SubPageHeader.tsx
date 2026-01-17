import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';
import GlobalSearchOverlay from './GlobalSearch/GlobalSearchOverlay';

interface SubPageHeaderProps {
  title: string;
  subtitle?: string;
  infoStripColor?: string;
  infoStripText?: string;
  onBack?: () => void;
  backRoute?: string;
  showSearch?: boolean; // New prop
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
}

/**
 * SubPageHeader Component
 * Standard black header with optional colored info strip for subpages
 * Includes back button navigation and optional global search
 */
export default function SubPageHeader({
  title,
  subtitle,
  infoStripColor,
  infoStripText,
  onBack,
  backRoute,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearchChange,
}: SubPageHeaderProps) {
  const router = useRouter();
  const [globalSearchVisible, setGlobalSearchVisible] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backRoute) {
      router.push(backRoute as any);
    } else {
      router.back();
    }
  };

  const handleSearchFocus = () => {
    // No-op for global search visibility, waits for text
    // We could potentially add an onSearchFocus prop if needed
  };

  const handleSearchChange = (text: string) => {
    setGlobalQuery(text);
    setGlobalSearchVisible(text.length > 0);
    if (onSearchChange) {
      onSearchChange(text);
    }
  };

  return (
    <View style={{ zIndex: 100 }}>
      {/* Black Header Content */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {/* Balance the back button spacing */}
          <View style={styles.backButton} />
        </View>

        {/* Optional Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={16} color="rgba(255, 255, 255, 0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={globalQuery}
                onChangeText={handleSearchChange}
                onFocus={handleSearchFocus}
              />
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Optional Info Strip */}
      {infoStripText && !globalSearchVisible && (
        <View style={[styles.infoStrip, infoStripColor && { backgroundColor: infoStripColor }]}>
          <Text style={styles.infoStripText}>{infoStripText}</Text>
        </View>
      )}

      {/* Global Search Overlay */}
      {globalSearchVisible && (
        <GlobalSearchOverlay
          visible={globalSearchVisible}
          query={globalQuery}
          onClose={() => {
            setGlobalSearchVisible(false);
            Keyboard.dismiss();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.black,
    zIndex: 101,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  infoStrip: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  infoStripText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  searchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing[4],
    height: 50,
    borderRadius: radii.md,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    padding: 0,
    textAlignVertical: 'center',
  },
});
