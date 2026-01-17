/**
 * Wishlist Groups List Screen
 * Shows all wishlist collections/groups for a child profile
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, FolderHeart, Trash2, Edit2 } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import {
    getWishlistGroups,
    createWishlistGroup,
    deleteWishlistGroup,
} from '../../../src/modules/product-library';
import { WishlistGroup, CreateWishlistGroupDTO } from '../../../src/types/wishlist';

const EMOJI_OPTIONS = ['💖', '🌸', '✨', '🧴', '☀️', '🌙', '💄', '💅', '🧼', '💆'];

export default function WishlistGroupsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { childProfile } = useChildProfile();

    const [groups, setGroups] = useState<WishlistGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupEmoji, setNewGroupEmoji] = useState('💖');
    const [creating, setCreating] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [childProfile?.id])
    );

    const loadGroups = async () => {
        if (!childProfile?.id) return;

        setLoading(true);
        try {
            const data = await getWishlistGroups(childProfile.id);
            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !user?.id || !childProfile?.id) return;

        setCreating(true);
        try {
            const newGroup: CreateWishlistGroupDTO = {
                profile_id: childProfile.id,
                user_id: user.id,
                name: newGroupName.trim(),
                emoji: newGroupEmoji,
            };
            const created = await createWishlistGroup(newGroup);
            if (created) {
                setGroups(prev => [...prev, created]);
                setNewGroupName('');
                setNewGroupEmoji('💖');
                setShowCreateModal(false);
                Alert.alert('Created!', `${newGroupEmoji} ${newGroupName} created.`);
            }
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteGroup = (group: WishlistGroup) => {
        Alert.alert(
            'Delete Collection',
            `Delete "${group.name}"? This won't remove items from your wishlist.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteWishlistGroup(group.id);
                        if (success) {
                            setGroups(prev => prev.filter(g => g.id !== group.id));
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.black} />
                </Pressable>
                <Text style={styles.headerTitle}>My Collections</Text>
                <Pressable onPress={() => setShowCreateModal(true)} style={styles.addButton}>
                    <Plus size={24} color={colors.purple} />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.purple} />
                </View>
            ) : groups.length === 0 ? (
                <View style={styles.emptyState}>
                    <FolderHeart size={64} color={colors.lavender} />
                    <Text style={styles.emptyTitle}>No Collections Yet</Text>
                    <Text style={styles.emptyText}>
                        Create collections to organize your wishlist items!
                    </Text>
                    <Pressable
                        style={styles.createButton}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Plus size={20} color={colors.white} />
                        <Text style={styles.createButtonText}>Create Collection</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {groups.map(group => (
                        <Pressable
                            key={group.id}
                            style={styles.groupCard}
                            onPress={() => router.push(`/(child)/groups/${group.id}` as any)}
                        >
                            <View style={styles.groupIcon}>
                                <Text style={styles.groupEmoji}>{group.emoji || '📁'}</Text>
                            </View>
                            <View style={styles.groupInfo}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                <Text style={styles.groupCount}>
                                    {group.item_count || 0} items
                                </Text>
                            </View>
                            <Pressable
                                style={styles.deleteButton}
                                onPress={() => handleDeleteGroup(group)}
                            >
                                <Trash2 size={18} color={colors.red} />
                            </Pressable>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>New Collection</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Collection name..."
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                            placeholderTextColor={colors.charcoal + '80'}
                        />

                        <Text style={styles.emojiLabel}>Choose an icon</Text>
                        <View style={styles.emojiGrid}>
                            {EMOJI_OPTIONS.map(emoji => (
                                <Pressable
                                    key={emoji}
                                    style={[
                                        styles.emojiOption,
                                        newGroupEmoji === emoji && styles.emojiSelected,
                                    ]}
                                    onPress={() => setNewGroupEmoji(emoji)}
                                >
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.saveButton, !newGroupName.trim() && styles.saveButtonDisabled]}
                                onPress={handleCreateGroup}
                                disabled={!newGroupName.trim() || creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Create</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    backButton: {
        padding: spacing[2],
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },
    addButton: {
        padding: spacing[2],
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[8],
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
        marginTop: spacing[4],
    },
    emptyText: {
        fontSize: 14,
        color: colors.charcoal,
        textAlign: 'center',
        marginTop: spacing[2],
        marginBottom: spacing[6],
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        borderRadius: radii.full,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: spacing[4],
        gap: spacing[3],
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing[4],
        borderRadius: radii.lg,
        gap: spacing[3],
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: radii.md,
        backgroundColor: colors.lavender + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupEmoji: {
        fontSize: 24,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.black,
    },
    groupCount: {
        fontSize: 13,
        color: colors.charcoal,
        marginTop: 2,
    },
    deleteButton: {
        padding: spacing[2],
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },
    modal: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[6],
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    input: {
        backgroundColor: colors.cream,
        borderRadius: radii.md,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: 16,
        marginBottom: spacing[4],
    },
    emojiLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.charcoal,
        marginBottom: spacing[2],
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginBottom: spacing[5],
    },
    emojiOption: {
        width: 44,
        height: 44,
        borderRadius: radii.md,
        backgroundColor: colors.cream,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiSelected: {
        backgroundColor: colors.lavender + '40',
        borderWidth: 2,
        borderColor: colors.purple,
    },
    emojiText: {
        fontSize: 22,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing[3],
        borderRadius: radii.md,
        backgroundColor: colors.cream,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.charcoal,
    },
    saveButton: {
        flex: 1,
        paddingVertical: spacing[3],
        borderRadius: radii.md,
        backgroundColor: colors.purple,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
});
