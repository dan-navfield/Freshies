import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { Search, Camera, ChevronRight, Check, Calendar as CalendarIcon, X, Info } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { shelfService } from '../../src/services/shelfService';
import * as wishlistService from '../../src/services/wishlistService';
import DateTimePicker from '@react-native-community/datetimepicker';

// This would ideally be in a separate file, reusing the ProfileOption from shelf.tsx if possible
interface ProfileOption {
    id: string; // 'parent' or childUUID
    name: string;
    avatar_url?: string;
    type: 'parent' | 'child';
}


// ...
export default function AddShelfItemScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const { profileId, mode, productName, productBrand, productImage, productCategory, productBarcode, fromWishlist, wishlistItemId } = params;

    // Step 1: Identify
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]); // Mock type
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    // Step 3: Details
    const [step, setStep] = useState<number>(1);
    const [isSaving, setIsSaving] = useState(false);

    // Details state
    const [openedDate, setOpenedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pao, setPao] = useState<number | null>(12); // Default 12M

    // Step 2: Assign
    const [profiles, setProfiles] = useState<ProfileOption[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('parent');

    // Pre-populate from params (from product page or wishlist)
    useEffect(() => {
        if (productName) {
            const prePopulatedProduct = {
                name: productName as string,
                brand: productBrand as string || 'Unknown Brand',
                imageUrl: productImage as string || '',
                category: productCategory as string || 'skincare',
                barcode: productBarcode as string || '',
            };
            setSelectedProduct(prePopulatedProduct);

            // Skip to details step (step 3) - bypass search and profile selection for speed
            if (mode === 'child') {
                setStep(3);
            } else {
                setStep(2); // Go to profile selection, then to details
            }
        }
    }, [productName, productBrand, productImage, productCategory, mode]);

    useEffect(() => {
        if (profileId) {
            setSelectedProfileId(profileId as string);
        }
    }, [profileId]);

    useEffect(() => {
        loadProfiles();
    }, [user]);

    // ... existing loadProfiles ...

    const handleNext = () => {
        if (step === 1) {
            if (mode === 'child') {
                // Skip profile selection for child
                setStep(3);
                return;
            }
        }
        setStep(step + 1);
    };

    // ... existing handleSearch, handleSave ...

    const loadProfiles = async () => {
        if (!user?.id) {
            console.log('loadProfiles: No user ID');
            return;
        }

        try {
            // 1. Fetch Parent (Self)
            const { data: parentData } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            const parentProfile: ProfileOption = {
                id: 'parent',
                name: parentData?.first_name || 'My Shelf',
                type: 'parent'
            };

            // 2. Fetch Children from managed_children
            const { data: children, error } = await supabase
                .from('managed_children')
                .select('id, first_name, avatar_url')
                .eq('parent_id', user.id)
                .eq('status', 'active');

            if (error) {
                console.error('loadProfiles: Error fetching children', error);
                throw error;
            }

            const childProfiles: ProfileOption[] = (children || []).map(c => ({
                id: c.id,
                name: c.first_name,
                avatar_url: c.avatar_url,
                type: 'child' as const
            }));

            setProfiles([parentProfile, ...childProfiles]);
        } catch (e) {
            console.error('loadProfiles: Exception', e);
            // Fallback
            setProfiles([{ id: 'parent', name: 'My Shelf', type: 'parent' }]);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 2) {
            // Mock Data
            const MOCK_DB = [
                { name: 'CeraVe Hydrating Cleanser', brand: 'CeraVe', category: 'Cleanser', image: 'https://images.unsplash.com/photo-1556228720-1987556a8d29?auto=format&fit=crop&w=150&q=80' },
                { name: 'Neutrogena Hydro Boost', brand: 'Neutrogena', category: 'Moisturizer', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=150&q=80' },
                { name: 'La Roche-Posay Anthelios', brand: 'La Roche-Posay', category: 'Sunscreen', image: 'https://images.unsplash.com/photo-1556228578-8c85e6a5d134?auto=format&fit=crop&w=150&q=80' },
                { name: 'The Ordinary Niacinamide', brand: 'The Ordinary', category: 'Serums', image: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=150&q=80' },
                { name: 'Cetaphil Gentle Cleanser', brand: 'Cetaphil', category: 'Cleanser', image: 'https://images.unsplash.com/photo-1556228841-a3c529ce12bf?auto=format&fit=crop&w=150&q=80' },
            ];

            const results = MOCK_DB.filter(item =>
                item.name.toLowerCase().includes(text.toLowerCase()) ||
                item.brand.toLowerCase().includes(text.toLowerCase())
            );

            setSearchResults(results.length > 0 ? results : MOCK_DB.slice(0, 2)); // Fallback for demo
        } else {
            setSearchResults([]);
        }
    };

    const handleSave = async () => {
        if (!user?.id || !selectedProduct) return;
        setIsSaving(true);
        try {
            const newItem = await shelfService.addShelfItem({
                user_id: user.id,
                profile_id: selectedProfileId === 'parent' ? undefined : selectedProfileId, // undefined = parent/self
                product_name: selectedProduct.name,
                product_brand: selectedProduct.brand || '', // Ensure not null
                product_image_url: selectedProduct.image || selectedProduct.imageUrl,
                product_category: selectedProduct.category,
                quantity: 1,
                opened_at: openedDate ? openedDate.toISOString() : undefined,
                pao_months: pao || undefined,
                is_approved: true // Auto-approve for now or based on parental logic
            });

            // If coming from wishlist, mark as moved to shelf
            if (fromWishlist === 'true' && wishlistItemId) {
                await wishlistService.moveToShelf(wishlistItemId as string, newItem.id);
            }

            // Navigate to Shelf tab instead of going back
            router.replace('/(child)/(tabs)/shelf');
        } catch (e) {
            console.error(e);
            alert('Failed to add product');
        } finally {
            setIsSaving(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || openedDate;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (currentDate) {
            setOpenedDate(currentDate);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>Cancel</Text>
                </Pressable>
                <Text style={styles.headerTitle}>
                    {step === 1 ? 'Find Product' : step === 2 ? 'Assign' : 'Details'}
                </Text>
                <Pressable
                    disabled={(step === 1 && !selectedProduct) || isSaving}
                    onPress={step === 3 ? handleSave : handleNext}
                    style={[styles.nextButton, (step === 1 && !selectedProduct) && { opacity: 0.5 }]}
                >
                    {isSaving ? <ActivityIndicator color={colors.purple} size="small" /> : (
                        <Text style={styles.nextText}>{step === 3 ? 'Done' : 'Next'}</Text>
                    )}
                </Pressable>
            </View>

            <ScrollView style={styles.content}>

                {/* Step 1: Search */}
                {step === 1 && (
                    <View>
                        <View style={styles.searchBar}>
                            <Search size={20} color={colors.charcoal} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name, brand..."
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoFocus
                            />
                            <Camera size={20} color={colors.purple} />
                        </View>

                        <View style={styles.results}>
                            {searchResults.map((item, idx) => (
                                <Pressable
                                    key={idx}
                                    style={[styles.resultItem, selectedProduct === item && styles.selectedResult]}
                                    onPress={() => { setSelectedProduct(item); setStep(2); }}
                                >
                                    <Image source={{ uri: item.image }} style={styles.resultImage} />
                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultBrand}>{item.brand}</Text>
                                        <Text style={styles.resultName}>{item.name}</Text>
                                    </View>
                                    {selectedProduct === item && <Check size={20} color={colors.purple} />}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Step 2: Assign */}
                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepLabel}>Who is this for?</Text>
                        {profiles.map(p => (
                            <Pressable
                                key={p.id}
                                style={[styles.profileOption, selectedProfileId === p.id && styles.selectedProfile]}
                                onPress={() => setSelectedProfileId(p.id)}
                            >
                                <Text style={[styles.profileOptionName, selectedProfileId === p.id && styles.selectedProfileText]}>
                                    {p.name}
                                </Text>
                                {selectedProfileId === p.id && <Check size={20} color={colors.purple} />}
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.summaryCard}>
                            <Image source={{ uri: selectedProduct?.image }} style={styles.summaryImage} />
                            <View>
                                <Text style={styles.summaryBrand}>{selectedProduct?.brand}</Text>
                                <Text style={styles.summaryName}>{selectedProduct?.name}</Text>
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Date Opened</Text>
                            <View style={styles.dateRow}>
                                <Pressable
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <CalendarIcon size={20} color={openedDate ? colors.purple : colors.charcoal} />
                                    <Text style={[styles.dateText, openedDate && styles.dateTextActive]}>
                                        {openedDate ? openedDate.toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Opened yet'}
                                    </Text>
                                </Pressable>

                                {openedDate && (
                                    <Pressable onPress={() => setOpenedDate(null)} style={styles.clearDate}>
                                        <X size={20} color={colors.charcoal} style={{ opacity: 0.5 }} />
                                    </Pressable>
                                )}
                            </View>

                            {(showDatePicker || (Platform.OS === 'ios' && showDatePicker)) && (
                                <View style={Platform.OS === 'ios' ? { backgroundColor: 'white', borderRadius: radii.md, marginTop: 8 } : {}}>
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={openedDate || new Date()}
                                        mode="date"
                                        is24Hour={true}
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <Pressable
                                            style={{ padding: 12, alignItems: 'center', borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
                                            onPress={() => setShowDatePicker(false)}
                                        >
                                            <Text style={{ color: colors.purple, fontWeight: '600' }}>Done</Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>

                        {openedDate && (
                            <View style={styles.field}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Text style={styles.label}>Period After Opening (PAO)</Text>
                                    <Info size={14} color={colors.charcoal} style={{ opacity: 0.5 }} />
                                </View>
                                <Text style={styles.helperText}>
                                    Find the open jar symbol on your product (e.g. 12M).
                                </Text>

                                <View style={styles.paoGrid}>
                                    {[6, 12, 18, 24].map(m => (
                                        <Pressable
                                            key={m}
                                            style={[styles.paoOption, pao === m && styles.paoActive]}
                                            onPress={() => setPao(m)}
                                        >
                                            <Text style={[styles.paoText, pao === m && styles.paoTextActive]}>{m}M</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    backButton: { padding: 8 },
    backText: { color: colors.charcoal, fontSize: 16 },
    nextButton: { padding: 8 },
    nextText: { color: colors.purple, fontWeight: '700', fontSize: 16 },

    content: { flex: 1 },
    stepContainer: { padding: spacing[6], gap: spacing[6] },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: spacing[4],
        padding: spacing[3],
        borderRadius: radii.full,
        gap: spacing[2],
    },
    searchInput: { flex: 1, fontSize: 16 },
    results: { paddingHorizontal: spacing[4] },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: spacing[3],
        borderRadius: radii.lg,
        marginBottom: spacing[2],
        gap: spacing[3]
    },
    selectedResult: { borderWidth: 1, borderColor: colors.purple },
    resultImage: { width: 40, height: 40, borderRadius: 4, backgroundColor: '#eee' },
    resultInfo: { flex: 1 },
    resultBrand: { fontSize: 12, color: colors.charcoal, opacity: 0.7 },
    resultName: { fontSize: 14, fontWeight: '600' },

    // Profile
    stepLabel: { fontSize: 18, fontWeight: '700', marginBottom: spacing[2] },
    profileOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing[4],
        backgroundColor: 'white',
        borderRadius: radii.lg,
        marginBottom: spacing[2]
    },
    selectedProfile: { borderWidth: 1, borderColor: colors.purple },
    profileOptionName: { fontSize: 16, fontWeight: '600' },
    selectedProfileText: { color: colors.purple },

    // Details
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: spacing[4],
        borderRadius: radii.lg,
        gap: spacing[4]
    },
    summaryImage: { width: 60, height: 60, borderRadius: 8 },
    summaryBrand: { fontSize: 12, opacity: 0.7 },
    summaryName: { fontSize: 16, fontWeight: '700' },

    field: { gap: spacing[2] },
    label: { fontSize: 14, fontWeight: '600', color: colors.charcoal },

    // Date Styles
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: spacing[3],
        borderRadius: radii.md, // Match input radius
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        gap: spacing[2]
    },
    dateText: { fontSize: 16, color: colors.charcoal, opacity: 0.6 },
    dateTextActive: { color: colors.purple, opacity: 1, fontWeight: '600' },
    clearDate: { padding: 4 },

    // Helper
    helperText: { fontSize: 13, color: colors.charcoal, opacity: 0.6, fontStyle: 'italic', marginBottom: 4 },

    paoGrid: { flexDirection: 'row', gap: spacing[2] },
    paoOption: {
        flex: 1,
        paddingVertical: spacing[3],
        backgroundColor: 'white',
        alignItems: 'center',
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    paoActive: { borderColor: colors.purple, backgroundColor: colors.purple + '10' },
    paoText: { fontWeight: '600' },
    paoTextActive: { color: colors.purple },
});
