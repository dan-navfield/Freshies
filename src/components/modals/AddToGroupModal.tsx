/**
 * AddToGroupModal Component
 * Modal to add a wishlist item to one or more groups
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { X, Check, FolderPlus, Plus } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import {
    getWishlistGroups,
    createWishlistGroup,
    addItemToGroup,
    removeItemFromGroup,
} from '../../services/wishlistService';
import { WishlistGroup, WishlistItem, CreateWishlistGroupDTO } from '../../types/wishlist';

interface AddToGroupModalProps {
    visible: boolean;
    item: WishlistItem | null;
    userId: string;
    profileId: string;
    onClose: () => void;
    onUpdated?: () => void;
}

const EMOJI_OPTIONS = ['💖', '🌸', '✨', '🧴', '☀️', '🌙', '💄', '💅'];

export default function AddToGroupModal({
    visible,
    item,
    userId,
    profileId,
    onClose,
    onUpdated,
}: AddToGroupModalProps) {
    const [groups, setGroups] = useState<WishlistGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [showCreateNew, setShowCreateNew] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupEmoji, setNewGroupEmoji] = useState('💖');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible && profileId) {
            loadGroups();
        }
    }, [visible, profileId]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const data = await getWishlistGroups(profileId);
            setGroups(data);

            // Pre-select groups this item is already in
            if (item?.groups) {
                setSelectedGroupIds(new Set(item.groups.map(g => g.id)));
            } else {
                setSelectedGroupIds(new Set());
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        setSelectedGroupIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;

        try {
            const newGroup: CreateWishlistGroupDTO = {
                profile_id: profileId,
                user_id: userId,
                name: newGroupName.trim(),
                emoji: newGroupEmoji,
            };
            const created = await createWishlistGroup(newGroup);
            if (created) {
                setGroups(prev => [...prev, created]);
                setSelectedGroupIds(prev => new Set([...prev, created.id]));
                setNewGroupName('');
                setShowCreateNew(false);
            }
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleSave = async () => {
        if (!item) return;

        setSaving(true);
        try {
            const currentGroupIds = new Set(item.groups?.map(g => g.id) || []);

            // Add to new groups
            for (const groupId of selectedGroupIds) {
                if (!currentGroupIds.has(groupId)) {
                    await addItemToGroup(item.id, groupId);
                }
            }

            // Remove from unselected groups
            for (const groupId of currentGroupIds) {
                if (!selectedGroupIds.has(groupId)) {
                    await removeItemFromGroup(item.id, groupId);
                }
            }

            onUpdated?.();
            onClose();
        } catch (error) {
            console.error('Error saving groups:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add to Collection</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.charcoal} />
                        </Pressable>
                    </View>

                    {/* Product Preview */}
                    {item && (
                        <View style={styles.productPreview}>
                            <Text style={styles.productName} numberOfLines={1}>
                                {item.product_name}
                            </Text>
                        </View>
                    )}

                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.purple} />
                        </View>
                    ) : (
                        <ScrollView style={styles.groupsList}>
                            {groups.map(group => (
                                <Pressable
                                    key={group.id}
                                    style={[
                                        styles.groupItem,
                                        selectedGroupIds.has(group.id) && styles.groupItemSelected,
                                    ]}
                                    onPress={() => toggleGroup(group.id)}
                                >
                                    <Text style={styles.groupEmoji}>{group.emoji || '📁'}</Text>
                                    <Text style={styles.groupName}>{group.name}</Text>
                                    {selectedGroupIds.has(group.id) && (
                                        <Check size={20} color={colors.purple} />
                                    )}
                                </Pressable>
                            ))}

                            {/* Create New Group Section */}
                            {showCreateNew ? (
                                <View style={styles.createSection}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Collection name..."
                                        value={newGroupName}
                                        onChangeText={setNewGroupName}
                                        placeholderTextColor={colors.charcoal + '80'}
                                        autoFocus
                                    />
                                    <View style={styles.emojiRow}>
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
                                    <View style={styles.createActions}>
                                        <Pressable
                                            style={styles.cancelCreateButton}
                                            onPress={() => setShowCreateNew(false)}
                                        >
                                            <Text style={styles.cancelCreateText}>Cancel</Text>
                                        </Pressable>
                                        <Pressable
                                            style={[
                                                styles.addGroupButton,
                                                !newGroupName.trim() && styles.addGroupButtonDisabled,
                                            ]}
                                            onPress={handleCreateGroup}
                                            disabled={!newGroupName.trim()}
                                        >
                                            <Text style={styles.addGroupText}>Add</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : (
                                <Pressable
                                    style={styles.createNewButton}
                                    onPress={() => setShowCreateNew(true)}
                                >
                                    <FolderPlus size={20} color={colors.purple} />
                                    <Text style={styles.createNewText}>Create New Collection</Text>
                                </Pressable>
                            )}
                        </ScrollView>
                    )}

                    {/* Save Button */}
                    <Pressable
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.saveButtonText}>Done</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        maxHeight: '70%',
        paddingBottom: 34, // Safe area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },
    closeButton: {
        padding: spacing[2],
    },
    productPreview: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.lavender + '20',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.purple,
    },
    center: {
        padding: spacing[8],
        alignItems: 'center',
    },
    groupsList: {
        padding: spacing[4],
        maxHeight: 300,
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
        borderRadius: radii.md,
        marginBottom: spacing[2],
        backgroundColor: colors.cream,
        gap: spacing[3],
    },
    groupItemSelected: {
        backgroundColor: colors.lavender + '30',
        borderWidth: 2,
        borderColor: colors.purple,
    },
    groupEmoji: {
        fontSize: 20,
    },
    groupName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: colors.black,
    },
    createSection: {
        marginTop: spacing[3],
        padding: spacing[3],
        backgroundColor: colors.cream,
        borderRadius: radii.md,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: radii.sm,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        fontSize: 15,
        marginBottom: spacing[3],
    },
    emojiRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    emojiOption: {
        width: 36,
        height: 36,
        borderRadius: radii.sm,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiSelected: {
        backgroundColor: colors.lavender + '40',
        borderWidth: 2,
        borderColor: colors.purple,
    },
    emojiText: {
        fontSize: 18,
    },
    createActions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    cancelCreateButton: {
        flex: 1,
        paddingVertical: spacing[2],
        borderRadius: radii.sm,
        alignItems: 'center',
    },
    cancelCreateText: {
        fontSize: 14,
        color: colors.charcoal,
    },
    addGroupButton: {
        flex: 1,
        paddingVertical: spacing[2],
        borderRadius: radii.sm,
        backgroundColor: colors.purple,
        alignItems: 'center',
    },
    addGroupButtonDisabled: {
        opacity: 0.5,
    },
    addGroupText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[3],
        borderRadius: radii.md,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.lavender,
        marginTop: spacing[2],
        gap: spacing[2],
    },
    createNewText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.purple,
    },
    saveButton: {
        marginHorizontal: spacing[4],
        marginTop: spacing[4],
        backgroundColor: colors.purple,
        paddingVertical: spacing[4],
        borderRadius: radii.lg,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
});
