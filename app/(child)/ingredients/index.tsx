import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Info, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react-native';
import PageHeader from '../../../src/components/PageHeader';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { getPopularIngredients, searchIngredients, IngredientDetail, getIngredientsByFilter } from '../../../src/services/ingredientsService';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'safe', label: 'Safe for me' },
    { id: 'caution', label: 'Use with caution' },
    { id: 'avoid', label: 'Avoid' },
    { id: 'hydration', label: 'Hydrating' },
];

export default function IngredientsHub() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState<{ title: string, data: IngredientDetail[] }[]>([]);
    const [searchResults, setSearchResults] = useState<IngredientDetail[]>([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            handleSearch(searchQuery);
        }
    }, [searchQuery]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const popular = await getPopularIngredients();
            const caution = await getIngredientsByFilter('caution');
            setSections([
                { title: 'Popular in Skincare', data: popular },
                { title: 'Good to Know', data: caution }, // Example group
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 1) {
            const results = await searchIngredients(text);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const NavigationCard = ({ item }: { item: IngredientDetail }) => {
        let BadgeIcon = ShieldCheck;
        let badgeColor = colors.mint;
        let badgeText = 'Safe';

        if (item.safetyStatus === 'caution') {
            BadgeIcon = AlertTriangle;
            badgeColor = colors.yellow;
            badgeText = 'Caution';
        } else if (item.safetyStatus === 'avoid') {
            BadgeIcon = ShieldAlert;
            badgeColor = colors.red; // Assuming red exists or using error color
            badgeText = 'Avoid';
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(child)/ingredients/${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <BadgeIcon size={12} color={colors.black} />
                        <Text style={styles.badgeText}>{badgeText}</Text>
                    </View>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.functionText}><Sparkles size={12} color={colors.purple} /> {item.function}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <PageHeader
                title="Ingredients"
                subtitle="Understand what's inside"
                showSearch={true}
                searchPlaceholder="Eg. Salicylic Acid, Retinol..."
                showAvatar={true}
                showBackButton={true}
                onBackPress={() => router.back()}
                searchValue={searchQuery}
                onSearchChange={handleSearch}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersContainer}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map(filter => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                activeFilter === filter.id && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(filter.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter.id && styles.activeFilterText
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading ? (
                    <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
                ) : searchQuery ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Search Results</Text>
                        {searchResults.map(item => (
                            <NavigationCard key={item.id} item={item} />
                        ))}
                    </View>
                ) : (
                    <>
                        <View style={styles.introBox}>
                            <Info size={20} color={colors.purple} />
                            <Text style={styles.introText}>
                                Ingredients are the building blocks of products. Tap any card to learn more.
                            </Text>
                        </View>

                        {sections.map((section, index) => (
                            <View key={index} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                {section.data.map(item => (
                                    <NavigationCard key={item.id} item={item} />
                                ))}
                            </View>
                        ))}
                    </>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9', // Light cream/white bg
    },
    content: {
        flex: 1,
    },
    filtersContainer: {
        maxHeight: 60,
        marginBottom: spacing[2],
    },
    filtersContent: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[2],
    },
    filterChip: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: radii.pill,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeFilterChip: {
        backgroundColor: colors.purple,
        borderColor: colors.purple,
    },
    filterText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#fff',
    },
    section: {
        paddingHorizontal: spacing[4],
        marginBottom: spacing[6],
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: spacing[3],
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: radii.lg,
        padding: spacing[4],
        marginBottom: spacing[3],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[2],
        paddingVertical: 4,
        borderRadius: radii.sm,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
    },
    cardDescription: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: spacing[3],
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    functionText: {
        fontSize: 12,
        color: colors.purple,
        fontWeight: '600',
    },
    introBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(129, 51, 246, 0.1)', // Light purple
        margin: spacing[4],
        padding: spacing[4],
        borderRadius: radii.md,
        alignItems: 'center',
        gap: spacing[3],
    },
    introText: {
        flex: 1,
        fontSize: 14,
        color: colors.purple,
        lineHeight: 20,
    },
});
