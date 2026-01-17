/**
 * WishlistCard Component
 * Product card for wishlist items with status badge and quick actions
 */

import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Heart, Trash2, FolderPlus, Package, Send } from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/tokens';
import type { WishlistItem } from '../types/wishlist';
import WishlistStatusBadge from './WishlistStatusBadge';

interface WishlistCardProps {
    item: WishlistItem;
    onPress: () => void;
    onRequestApproval?: () => void;
    onMoveToShelf?: () => void;
    onRemove?: () => void;
    onAddToGroup?: () => void;
    showActions?: boolean;
    isChildView?: boolean;
}

export default function WishlistCard({
    item,
    onPress,
    onRequestApproval,
    onMoveToShelf,
    onRemove,
    onAddToGroup,
    showActions = true,
    isChildView = false,
}: WishlistCardProps) {
    const canRequestApproval = isChildView && item.status === 'saved';
    const canMoveToShelf = item.status === 'approved' || (!isChildView);

    // Get safety badge color
    const getSafetyColor = () => {
        if (!item.safety_score) return null;
        if (item.safety_score <= 25) return colors.mint;
        if (item.safety_score <= 50) return colors.yellow;
        if (item.safety_score <= 75) return '#F59E0B';
        return colors.red;
    };

    const safetyColor = getSafetyColor();

    return (
        <Pressable style={styles.card} onPress={onPress}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
                {item.product_image_url ? (
                    <Image
                        source={{ uri: item.product_image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Heart size={32} color={colors.lavender} />
                    </View>
                )}

                {/* Safety Score Badge */}
                {safetyColor && (
                    <View style={[styles.safetyBadge, { backgroundColor: safetyColor }]}>
                        <Text style={styles.safetyText}>{item.safety_score}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Brand */}
                {item.product_brand && (
                    <Text style={styles.brand} numberOfLines={1}>
                        {item.product_brand}
                    </Text>
                )}

                {/* Name */}
                <Text style={styles.name} numberOfLines={2}>
                    {item.product_name}
                </Text>

                {/* Status Badge */}
                <View style={styles.badgeRow}>
                    <WishlistStatusBadge status={item.status} size="small" />

                    {/* Group Tags */}
                    {item.groups && item.groups.length > 0 && (
                        <View style={styles.groupChips}>
                            {item.groups.filter(g => !!g).slice(0, 2).map((group) => (
                                <View key={group.id} style={styles.groupChip}>
                                    <Text style={styles.groupChipText}>
                                        {group.emoji || '📁'} {group.name}
                                    </Text>
                                </View>
                            ))}
                            {item.groups.length > 2 && (
                                <Text style={styles.moreGroups}>+{item.groups.length - 2}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                {showActions && (
                    <View style={styles.actions}>
                        {canRequestApproval && onRequestApproval && (
                            <Pressable
                                style={[styles.actionButton, styles.primaryAction]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onRequestApproval();
                                }}
                            >
                                <Send size={14} color={colors.white} />
                                <Text style={styles.primaryActionText}>Ask</Text>
                            </Pressable>
                        )}

                        {canMoveToShelf && onMoveToShelf && (
                            <Pressable
                                style={[styles.actionButton, styles.primaryAction]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onMoveToShelf();
                                }}
                            >
                                <Package size={14} color={colors.white} />
                                <Text style={styles.primaryActionText}>Got it</Text>
                            </Pressable>
                        )}

                        {onAddToGroup && (
                            <Pressable
                                style={styles.actionButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onAddToGroup();
                                }}
                            >
                                <FolderPlus size={16} color={colors.charcoal} />
                            </Pressable>
                        )}

                        {onRemove && (
                            <Pressable
                                style={styles.actionButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                            >
                                <Trash2 size={16} color={colors.red} />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '47%',
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        overflow: 'hidden',
        marginBottom: spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 120,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.cream,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safetyBadge: {
        position: 'absolute',
        top: spacing[2],
        right: spacing[2],
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    safetyText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.white,
    },
    content: {
        padding: spacing[3],
    },
    brand: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.charcoal,
        opacity: 0.6,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.black,
        marginBottom: spacing[2],
        height: 40,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing[1],
        marginBottom: spacing[2],
    },
    groupChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    groupChip: {
        backgroundColor: colors.lavender + '30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    groupChipText: {
        fontSize: 10,
        color: colors.purple,
        fontWeight: '500',
    },
    moreGroups: {
        fontSize: 10,
        color: colors.charcoal,
        opacity: 0.6,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing[2],
        marginTop: spacing[1],
    },
    actionButton: {
        padding: spacing[2],
        borderRadius: radii.md,
        backgroundColor: colors.cream,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[3],
    },
    primaryActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.white,
    },
});
