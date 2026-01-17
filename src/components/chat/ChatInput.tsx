import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { Plus, Send } from 'lucide-react-native';

interface ChatInputProps {
    inputText: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    isLoading: boolean;
    onActionPress: () => void;
}

export function ChatInput({ inputText, onChangeText, onSend, isLoading, onActionPress }: ChatInputProps) {
    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
                {/* Plus Button */}
                <TouchableOpacity
                    style={styles.plusButton}
                    onPress={onActionPress}
                    disabled={isLoading}
                >
                    <Plus size={22} color="#666666" />
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={onChangeText}
                    placeholder="Message FreshiesAI"
                    placeholderTextColor="#999999"
                    multiline
                    maxLength={500}
                    editable={!isLoading}
                />

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                    onPress={onSend}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Send size={18} color={colors.white} fill={inputText.trim() && !isLoading ? colors.white : 'transparent'} />
                </TouchableOpacity>
            </View>
            <Text style={styles.disclaimer}>
                FreshiesAI provides general guidance. Always consult a healthcare professional for medical advice.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: spacing[6],
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[2],
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    plusButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        maxHeight: 100,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[1],
    },
    sendButton: {
        width: 32,
        height: 32,
        backgroundColor: colors.purple,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },
    disclaimer: {
        fontSize: 11,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 16,
    },
});
