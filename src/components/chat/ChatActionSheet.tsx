import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import { Camera, Image as ImageIcon, FileText } from 'lucide-react-native';

interface ChatActionSheetProps {
    visible: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onUploadImage: () => void;
    onUploadDocument: () => void;
}

export function ChatActionSheet({ visible, onClose, onTakePhoto, onUploadImage, onUploadDocument }: ChatActionSheetProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.modalOverlay}
                onPress={onClose}
            >
                <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
                    {/* Handle Bar */}
                    <View style={styles.handleBar} />

                    {/* Title */}
                    <Text style={styles.actionSheetTitle}>FreshiesAI</Text>

                    {/* Options */}
                    <TouchableOpacity style={styles.actionOption} onPress={onTakePhoto}>
                        <View style={styles.actionIconContainer}>
                            <Camera size={24} color="#666666" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Take Photo</Text>
                            <Text style={styles.actionSubtitle}>Scan a product label</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionOption} onPress={onUploadImage}>
                        <View style={styles.actionIconContainer}>
                            <ImageIcon size={24} color="#666666" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Upload Image</Text>
                            <Text style={styles.actionSubtitle}>Choose from your photos</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionOption} onPress={onUploadDocument}>
                        <View style={styles.actionIconContainer}>
                            <FileText size={24} color="#666666" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Upload Document</Text>
                            <Text style={styles.actionSubtitle}>Share ingredient lists or reports</Text>
                        </View>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: spacing[3],
        paddingBottom: spacing[8],
        paddingHorizontal: spacing[6],
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: '#E8E8E8',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing[4],
    },
    actionSheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: spacing[4],
    },
    actionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 13,
        color: '#666666',
    },
});
