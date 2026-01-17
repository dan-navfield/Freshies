/**
 * WishlistStatusBadge Component
 * Displays status badge with icon and color for wishlist items
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle, XCircle, Heart, Package } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import type { WishlistStatus } from '../../types/wishlist';

interface WishlistStatusBadgeProps {
    status: WishlistStatus;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

const STATUS_CONFIG: Record<WishlistStatus, {
    label: string;
    color: string;
    bgColor: string;
    Icon: typeof Heart;
}> = {
    saved: {
        label: 'Saved',
        color: colors.purple,
        bgColor: colors.purple + '20',
        Icon: Heart,
    },
    awaiting_approval: {
        label: 'Awaiting',
        color: colors.orange,
        bgColor: colors.orange + '20',
        Icon: Clock,
    },
    approved: {
        label: 'Approved',
        color: colors.mint,
        bgColor: colors.mint + '20',
        Icon: CheckCircle,
    },
    not_approved: {
        label: 'Not Approved',
        color: colors.red,
        bgColor: colors.red + '20',
        Icon: XCircle,
    },
    on_shelf: {
        label: 'On Shelf',
        color: colors.charcoal,
        bgColor: colors.charcoal + '15',
        Icon: Package,
    },
};

export default function WishlistStatusBadge({
    status,
    size = 'medium',
    showLabel = true,
}: WishlistStatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const { Icon } = config;

    const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
    const badgeStyle = [
        styles.badge,
        size === 'small' && styles.badgeSmall,
        size === 'large' && styles.badgeLarge,
        { backgroundColor: config.bgColor },
    ];

    return (
        <View style={badgeStyle}>
            <Icon size={iconSize} color={config.color} />
            {showLabel && (
                <Text
                    style={[
                        styles.label,
                        size === 'small' && styles.labelSmall,
                        size === 'large' && styles.labelLarge,
                        { color: config.color },
                    ]}
                >
                    {config.label}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: radii.full,
        gap: 4,
    },
    badgeSmall: {
        paddingHorizontal: spacing[1],
        paddingVertical: 2,
    },
    badgeLarge: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
    },
    labelSmall: {
        fontSize: 10,
    },
    labelLarge: {
        fontSize: 14,
    },
});
