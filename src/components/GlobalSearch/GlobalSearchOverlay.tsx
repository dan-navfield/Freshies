import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';

import { useRouter } from 'expo-router';
import { Search, Clock, ChevronRight, Package, BookOpen, Droplets } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import { searchService, SearchResult, SearchGroup } from '../../services/searchService';
import { useAuth } from '../../contexts/AuthContext';
import { useChildProfile } from '../../contexts/ChildProfileContext';

interface GlobalSearchOverlayProps {
    visible: boolean;
    query: string;
    onClose: () => void;
    onResultPress?: (result: SearchResult) => void;
}

export default function GlobalSearchOverlay({
    visible,
    query,
    onClose,
    onResultPress,
}: GlobalSearchOverlayProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { childProfile } = useChildProfile();

    const [results, setResults] = useState<SearchGroup[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && !query) {
            loadRecentSearches();
        }
    }, [visible, query]);

    useEffect(() => {
        if (visible && query.length >= 1) {
            // Debounce search
            const timer = setTimeout(() => {
                performSearch(query);
            }, 300);
            return () => clearTimeout(timer);
        } else if (!query && visible) {
            // Only load recents if query is explicitly empty (which shouldn't happen with current parent logic)
            loadRecentSearches();
        }
    }, [query, visible]);

    const loadRecentSearches = async () => {
        const recents = await searchService.getRecentSearches();
        setRecentSearches(recents);
    };

    const performSearch = async (text: string) => {
        setLoading(true);
        try {
            const data = await searchService.searchGlobal(text, user?.id || '', childProfile?.id);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultPress = (result: SearchResult) => {
        // If a route is defined, navigate to it
        if (result.route) {
            router.push(result.route as any);
        }
        if (onResultPress) {
            onResultPress(result);
        }
        onClose();
    };

    const handleRecentPress = (term: string) => {
        // Just a visual list in this mode, parent controls input
        // The parent component should update its query state based on this interaction
        // For now, we'll just close the overlay.
        // If the parent needs to update its query, it would need a prop like onRecentSearchPress(term)
        onClose();
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {/* Backdrop to close on tap outside */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.white} />
                    </View>
                ) : !query ? (
                    // Zero State: Recent Searches (Fallback/Safety)
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <Text style={styles.sectionTitle}>Recent Searches</Text>
                        {/* ... */}
                    </ScrollView>
                ) : (
                    // Results State (Always show if query exists)
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {results.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No results found for "{query}"</Text>
                            </View>
                        ) : (
                            results.map((group, groupIndex) => (
                                <View key={groupIndex} style={styles.group}>
                                    <Text style={styles.groupTitle}>{group.title}</Text>
                                    {group.items.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.resultItem}
                                            onPress={() => handleResultPress(item)}
                                        >
                                            <View style={styles.resultIcon}>
                                                {item.image_url ? (
                                                    <Image
                                                        source={{ uri: item.image_url }}
                                                        style={styles.resultImage}
                                                    />
                                                ) : (
                                                    <>
                                                        {item.type === 'shelf' && <Package size={20} color={colors.purple} />}
                                                        {item.type === 'product' && <Droplets size={20} color={colors.mint} />}
                                                        {item.type === 'learn' && <BookOpen size={20} color={colors.orange} />}
                                                    </>
                                                )}
                                            </View>
                                            <View style={styles.resultInfo}>
                                                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                                                {item.subtitle && (
                                                    <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                                )}
                                            </View>
                                            <ChevronRight size={16} color="rgba(255, 255, 255, 0.3)" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: -1000, // Cover screen below
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: colors.black, // Match header
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        maxHeight: 500,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    scrollContent: {
        padding: spacing[5],
        paddingBottom: spacing[8],
    },
    loadingContainer: {
        padding: spacing[8],
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        marginBottom: spacing[3],
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        gap: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    recentText: {
        fontSize: 16,
        color: colors.white,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        gap: spacing[3],
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    group: {
        marginBottom: spacing[5],
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.purple, // Keep brand color
        marginBottom: spacing[2],
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        gap: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    resultIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: radii.sm,
        overflow: 'hidden', // Ensure image clips to radius
    },
    resultImage: {
        width: 32,
        height: 32,
        borderRadius: radii.sm,
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    resultSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    emptyState: {
        padding: spacing[10],
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.5)',
    },
});
