import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, radii } from '../../src/theme/tokens';
import SubPageHeader from '../../src/components/SubPageHeader';
import { searchService, SearchGroup, SearchResult } from '../../src/services/searchService';
import { useAuth } from '../../src/contexts/AuthContext';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';

export default function SearchResultsScreen() {
    const { q } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { childProfile } = useChildProfile();

    const query = typeof q === 'string' ? q : '';
    const [results, setResults] = useState<SearchGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            loadResults(query);
        }
    }, [query]);

    const loadResults = async (text: string) => {
        setLoading(true);
        try {
            const data = await searchService.searchGlobal(text, user?.id || '', childProfile?.id);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleResultPress = (item: SearchResult) => {
        if (item.route) {
            router.push(item.route as any);
        }
    };

    return (
        <View style={styles.container}>
            <SubPageHeader
                title="Search Results"
                showSearch={true}
                searchPlaceholder="Refine search..."
                onSearchChange={(text) => {
                    // Optional: debounced update to 'query' or handle locally
                }}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.purple} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.queryHeader}>Results for "{query}"</Text>

                    {results.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No results found.</Text>
                        </View>
                    ) : (
                        results.map((group, idx) => (
                            <View key={idx} style={styles.group}>
                                <Text style={styles.groupTitle}>{group.title}</Text>
                                {group.items.map(item => (
                                    <TouchableOpacity key={item.id} style={styles.item} onPress={() => handleResultPress(item)}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: spacing[5],
    },
    queryHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.charcoal,
        marginBottom: spacing[6],
    },
    group: {
        marginBottom: spacing[6],
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.purple,
        marginBottom: spacing[3],
        textTransform: 'uppercase',
    },
    item: {
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.charcoal,
    },
    itemSubtitle: {
        fontSize: 14,
        color: colors.charcoal,
        opacity: 0.6,
        marginTop: 2,
    },
    empty: {
        alignItems: 'center',
        marginTop: spacing[10],
    },
    emptyText: {
        fontSize: 16,
        color: colors.charcoal,
        opacity: 0.5,
    },
});
