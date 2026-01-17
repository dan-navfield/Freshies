import { View, Text, Pressable, StyleSheet, Image, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors, radii, spacing } from '../../theme/tokens';
import { ChildProfile } from '../types/family';
import { User, Activity, Settings, X } from 'lucide-react-native';

interface ChildSwitcherProps {
  children: ChildProfile[];
  selectedChildId?: string | null;
  onSelectChild?: (childId: string) => void;
  showAllOption?: boolean;
}

export default function ChildSwitcher({
  children,
  selectedChildId,
  onSelectChild,
  showAllOption = true,
}: ChildSwitcherProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMenuChild, setSelectedMenuChild] = useState<ChildProfile | null>(null);

  const handleChildPress = (child: ChildProfile) => {
    // Direct navigation to child profile
    router.push(`/family/child/${child.id}` as any);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedMenuChild(null);
  };

  const navigateToProfile = () => {
    if (selectedMenuChild) {
      closeMenu();
      router.push(`/family/child/${selectedMenuChild.id}` as any);
    }
  };

  const navigateToActivity = () => {
    if (selectedMenuChild) {
      closeMenu();
      router.push(`/family/child/${selectedMenuChild.id}/activity` as any);
    }
  };

  const navigateToSettings = () => {
    if (selectedMenuChild) {
      closeMenu();
      router.push(`/family/child/${selectedMenuChild.id}/permissions` as any);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.separator} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.childrenList}
        >
          {children.map((child) => (
            <Pressable
              key={child.id}
              style={styles.childCard}
              onPress={() => handleChildPress(child)}
            >
              <Image
                source={{
                  uri: child.avatar_url || `https://ui-avatars.com/api/?name=${child.first_name}&background=random&size=200`
                }}
                style={styles.childAvatar}
              />
              {child.needs_approval_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{child.needs_approval_count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Mini Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.menuContainer}>
            {selectedMenuChild && (
              <>
                <View style={styles.menuHeader}>
                  <Image
                    source={{
                      uri: selectedMenuChild.avatar_url || `https://ui-avatars.com/api/?name=${selectedMenuChild.first_name}&background=random&size=200`
                    }}
                    style={styles.menuAvatar}
                  />
                  <View style={styles.menuHeaderText}>
                    <Text style={styles.menuName}>{selectedMenuChild.display_name}</Text>
                    <Text style={styles.menuAge}>{selectedMenuChild.age} years old</Text>
                  </View>
                  <Pressable onPress={closeMenu} style={styles.closeButton}>
                    <X size={20} color={colors.charcoal} />
                  </Pressable>
                </View>

                <View style={styles.menuDivider} />

                <Pressable style={styles.menuItem} onPress={navigateToProfile}>
                  <User size={20} color={colors.purple} />
                  <Text style={styles.menuItemText}>View Profile</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={navigateToActivity}>
                  <Activity size={20} color={colors.mint} />
                  <Text style={styles.menuItemText}>View Activity</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={navigateToSettings}>
                  <Settings size={20} color={colors.orange} />
                  <Text style={styles.menuItemText}>Manage Settings</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    paddingVertical: spacing[2],
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing[2],
  },
  childrenList: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  childCard: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 10,
    marginRight: 4, // Add some margin to prevent right-edge clipping in scroll view
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.red,
    borderRadius: radii.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
    borderWidth: 2,
    borderColor: colors.black,
    zIndex: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[5],
    gap: spacing[3],
  },
  menuAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  menuAge: {
    fontSize: 14,
    color: colors.charcoal,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.mist,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[5],
    gap: spacing[3],
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
});
