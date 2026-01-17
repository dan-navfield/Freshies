/**
 * ApprovalRequestModal Component
 * Child-friendly modal for requesting parent approval on wishlist items
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    ScrollView,
    Image,
} from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/tokens';
import { APPROVAL_REQUEST_REASONS } from '../types/wishlist';
import type { WishlistItem } from '../types/wishlist';

interface ApprovalRequestModalProps {
    visible: boolean;
    item: WishlistItem | null;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    loading?: boolean;
}

export default function ApprovalRequestModal({
    visible,
    item,
    onClose,
    onSubmit,
    loading = false,
}: ApprovalRequestModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [customReason, setCustomReason] = useState('');

    const handleSubmit = () => {
        if (selectedReason === 'other') {
            onSubmit(customReason || 'I would like this product');
        } else if (selectedReason) {
            const reason = APPROVAL_REQUEST_REASONS.find(r => r.id === selectedReason);
            onSubmit(reason?.label || 'I would like this product');
        } else {
            onSubmit('I would like this product');
        }

        // Reset state
        setSelectedReason(null);
        setCustomReason('');
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Ask for Approval</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.charcoal} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Product Preview */}
                        <View style={styles.productPreview}>
                            {item.product_image_url ? (
                                <Image
                                    source={{ uri: item.product_image_url }}
                                    style={styles.productImage}
                                />
                            ) : (
                                <View style={styles.productImagePlaceholder}>
                                    <Heart size={24} color={colors.lavender} />
                                </View>
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productBrand}>{item.product_brand}</Text>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {item.product_name}
                                </Text>
                            </View>
                        </View>

                        {/* Reason Selection */}
                        <Text style={styles.sectionTitle}>Why do you want this?</Text>
                        <Text style={styles.sectionSubtitle}>
                            Choose a reason to help your parent understand 💭
                        </Text>

                        <View style={styles.reasonsGrid}>
                            {APPROVAL_REQUEST_REASONS.map((reason) => (
                                <Pressable
                                    key={reason.id}
                                    style={[
                                        styles.reasonChip,
                                        selectedReason === reason.id && styles.reasonChipSelected,
                                    ]}
                                    onPress={() => setSelectedReason(reason.id)}
                                >
                                    <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                                    <Text
                                        style={[
                                            styles.reasonLabel,
                                            selectedReason === reason.id && styles.reasonLabelSelected,
                                        ]}
                                    >
                                        {reason.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Custom Reason Input */}
                        {selectedReason === 'other' && (
                            <View style={styles.customReasonContainer}>
                                <TextInput
                                    style={styles.customReasonInput}
                                    placeholder="Tell your parent why..."
                                    placeholderTextColor={colors.charcoal + '60'}
                                    value={customReason}
                                    onChangeText={setCustomReason}
                                    multiline
                                    maxLength={200}
                                />
                                <Text style={styles.characterCount}>
                                    {customReason.length}/200
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Submit Button */}
                    <View style={styles.footer}>
                        <Pressable
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Send size={18} color={colors.white} />
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Sending...' : 'Send Request'}
                            </Text>
                        </Pressable>
                        <Text style={styles.footerNote}>
                            Your parent will get a notification 🔔
                        </Text>
                    </View>
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
    container: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        maxHeight: '85%',
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
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
    },
    closeButton: {
        padding: spacing[1],
    },
    content: {
        padding: spacing[4],
        paddingBottom: 0,
    },
    productPreview: {
        flexDirection: 'row',
        backgroundColor: colors.cream,
        borderRadius: radii.lg,
        padding: spacing[3],
        marginBottom: spacing[5],
        gap: spacing[3],
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: radii.md,
        backgroundColor: colors.white,
    },
    productImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: radii.md,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productBrand: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.charcoal,
        opacity: 0.7,
        marginBottom: 2,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.black,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.black,
        marginBottom: spacing[1],
    },
    sectionSubtitle: {
        fontSize: 14,
        color: colors.charcoal,
        marginBottom: spacing[4],
    },
    reasonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    reasonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cream,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radii.full,
        gap: spacing[2],
        borderWidth: 2,
        borderColor: 'transparent',
    },
    reasonChipSelected: {
        backgroundColor: colors.purple + '15',
        borderColor: colors.purple,
    },
    reasonEmoji: {
        fontSize: 18,
    },
    reasonLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.charcoal,
    },
    reasonLabelSelected: {
        color: colors.purple,
        fontWeight: '600',
    },
    customReasonContainer: {
        backgroundColor: colors.cream,
        borderRadius: radii.lg,
        padding: spacing[3],
        marginBottom: spacing[4],
    },
    customReasonInput: {
        fontSize: 15,
        color: colors.black,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    characterCount: {
        fontSize: 12,
        color: colors.charcoal,
        opacity: 0.6,
        textAlign: 'right',
        marginTop: spacing[1],
    },
    footer: {
        padding: spacing[4],
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: colors.mist,
        alignItems: 'center',
        gap: spacing[2],
    },
    submitButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.purple,
        paddingVertical: spacing[4],
        borderRadius: radii.lg,
        gap: spacing[2],
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
    footerNote: {
        fontSize: 13,
        color: colors.charcoal,
        opacity: 0.7,
    },
});
