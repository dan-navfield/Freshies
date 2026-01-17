import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { globalStyles } from '../../../src/theme/styles';
import SubPageHeader from '../../../src/components/SubPageHeader';
import { colors, spacing } from '../../../src/theme/tokens';

export default function LearnArticleScreen() {
    const { id } = useLocalSearchParams();

    // In a real app, useQuery to fetch article by ID
    const article = {
        title: 'Understanding Your Skin',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        category: 'Skincare Basics'
    };

    return (
        <View style={globalStyles.container}>
            <SubPageHeader title="Learn" />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{article.category}</Text>
                </View>
                <Text style={styles.title}>{article.title} (ID: {id})</Text>
                <Text style={styles.body}>{article.content}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing[5],
    },
    badge: {
        backgroundColor: colors.mint + '20',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: spacing[1],
        marginBottom: spacing[3],
    },
    badgeText: {
        color: colors.mint,
        fontWeight: '600',
        fontSize: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.charcoal,
        marginBottom: spacing[4],
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.charcoal,
        opacity: 0.8,
    },
});
