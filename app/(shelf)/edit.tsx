import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { shelfService } from '../../../src/modules/product-library';
import { ShelfItem } from '../../src/types/shelf';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Info, Calendar as CalendarIcon, X } from 'lucide-react-native';

export default function EditShelfItemScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [productName, setProductName] = useState('');
    const [productBrand, setProductBrand] = useState('');
    const [category, setCategory] = useState('');

    // Opened Date State
    const [openedDate, setOpenedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [pao, setPao] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (id) loadItem();
    }, [id]);

    const loadItem = async () => {
        try {
            const { data, error } = await supabase
                .from('shelf_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setProductName(data.product_name);
            setProductBrand(data.product_brand || '');
            setCategory(data.product_category || '');
            setOpenedDate(data.opened_at ? new Date(data.opened_at) : null);
            setPao(data.pao_months || null);
            setNotes(data.notes || '');
            setImageUrl(data.product_image_url);

        } catch (e) {
            console.error('Error loading item:', e);
            Alert.alert('Error', 'Could not load product details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await shelfService.updateShelfItem(id as string, {
                pao_months: pao || undefined,
                opened_at: openedDate ? openedDate.toISOString() : null,
                notes: notes
            });

            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update product');
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.purple} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>Cancel</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Edit Product</Text>
                <Pressable
                    disabled={isSaving}
                    onPress={handleSave}
                    style={styles.saveButton}
                >
                    {isSaving ? <ActivityIndicator color={colors.purple} size="small" /> : (
                        <Text style={styles.saveText}>Save</Text>
                    )}
                </Pressable>
            </View>

            <ScrollView style={styles.content}>

                {/* Image & Static Details */}
                <View style={styles.headerSection}>
                    <Image source={{ uri: imageUrl || 'https://via.placeholder.com/150' }} style={styles.image} />
                    <View style={styles.staticInfo}>
                        <Text style={styles.staticBrand}>{productBrand}</Text>
                        <Text style={styles.staticName}>{productName}</Text>
                        <View style={styles.staticCategory}>
                            <Text style={styles.staticCategoryText}>{category || 'Uncategorized'}</Text>
                        </View>
                    </View>
                </View>

                {/* Editable User Fields */}
                <View style={styles.form}>

                    {/* Opened Date */}
                    <View style={styles.section}>
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

                    {/* PAO */}
                    {openedDate && (
                        <View style={styles.section}>
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

                    {/* Notes */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes (e.g. Purchase Date, Batch Code)</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add notes..."
                            multiline
                        />
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    saveButton: { padding: 8 },
    saveText: { color: colors.purple, fontWeight: '700', fontSize: 16 },

    content: { flex: 1 },
    headerSection: {
        flexDirection: 'row',
        padding: spacing[6],
        alignItems: 'center',
        gap: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    image: { width: 80, height: 80, borderRadius: radii.md, backgroundColor: '#eee' },
    staticInfo: { flex: 1 },
    staticBrand: { fontSize: 13, color: colors.purple, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    staticName: { fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: 8 },
    staticCategory: {
        alignSelf: 'flex-start',
        backgroundColor: colors.cream,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    staticCategoryText: { fontSize: 12, color: colors.charcoal, fontWeight: '600' },

    form: { padding: spacing[6], gap: spacing[6] },
    inputGroup: { gap: spacing[2] },
    label: { fontSize: 14, fontWeight: '600', color: colors.charcoal },
    input: {
        backgroundColor: 'white',
        padding: spacing[3],
        borderRadius: radii.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },

    categoryScroll: { flexDirection: 'row', gap: spacing[2] },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        marginRight: 8
    },
    catChipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
    catText: { fontSize: 14, color: colors.charcoal },
    catTextActive: { color: 'white', fontWeight: '600' },

    section: { gap: spacing[2] },

    // Date styles
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

    // Helper Text
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
