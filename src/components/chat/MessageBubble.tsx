import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import { Sparkles } from 'lucide-react-native';
import { Message } from './types';

interface MessageBubbleProps {
    message: Message;
    isLastAssistantMessage?: boolean;
    onSend?: (text: string) => void;
    isLoading?: boolean;
}

export function MessageBubble({ message, isLastAssistantMessage, onSend, isLoading }: MessageBubbleProps) {
    if (message.role === 'user') {
        return (
            <View style={styles.messageWrapper}>
                <View style={styles.userBubble}>
                    <Text style={styles.userText}>{message.content}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.messageWrapper}>
            <View style={styles.assistantMessageContainer}>
                <View style={styles.assistantAvatar}>
                    <Sparkles size={16} color={colors.purple} />
                </View>
                <View style={styles.assistantBubble}>
                    <Text style={styles.assistantText}>{message.content}</Text>

                    {message.keyPoints && message.keyPoints.length > 0 && (
                        <View style={styles.keyPointsContainer}>
                            <Text style={styles.keyPointsTitle}>Key Points:</Text>
                            {message.keyPoints.map((point, index) => (
                                <Text key={index} style={styles.keyPoint}>• {point}</Text>
                            ))}
                        </View>
                    )}

                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <View style={styles.actionsContainer}>
                            <Text style={styles.actionsTitle}>Suggested Actions:</Text>
                            {message.suggestedActions.map((action, index) => (
                                <View key={index} style={styles.actionChip}>
                                    <Text style={styles.actionText}>{action}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {message.relatedTopics && message.relatedTopics.length > 0 && (
                        <View style={styles.relatedContainer}>
                            <Text style={styles.relatedTitle}>Related Topics:</Text>
                            <View style={styles.relatedChips}>
                                {message.relatedTopics.map((topic, index) => (
                                    <TouchableOpacity key={index} style={styles.relatedChip}>
                                        <Text style={styles.relatedText}>{topic}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Follow-up Prompts (only show for last assistant message) */}
            {isLastAssistantMessage &&
                message.followUpPrompts &&
                message.followUpPrompts.length > 0 && (
                    <View style={styles.followUpContainer}>
                        <Text style={styles.followUpTitle}>You might also ask:</Text>
                        <View style={styles.followUpChips}>
                            {message.followUpPrompts.map((prompt, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.followUpChip}
                                    onPress={() => onSend?.(prompt)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.followUpText}>{prompt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
        </View>
    );
}

const styles = StyleSheet.create({
    messageWrapper: {
        marginBottom: spacing[4],
    },
    assistantMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
    },
    assistantAvatar: {
        width: 32,
        height: 32,
        backgroundColor: '#E8E8E8', // Light grey avatar background
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing[1],
    },
    assistantBubble: {
        flex: 1,
        backgroundColor: colors.white,
        padding: spacing[4],
        borderRadius: radii.lg,
        borderTopLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    assistantText: {
        fontSize: 15,
        color: '#1A1A1A', // Dark grey text
        lineHeight: 22,
    },
    keyPointsContainer: {
        marginTop: spacing[3],
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    keyPointsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666666', // Medium grey
        marginBottom: spacing[2],
    },
    keyPoint: {
        fontSize: 14,
        color: '#4A4A4A', // Dark grey
        lineHeight: 20,
        marginBottom: spacing[1],
    },
    actionsContainer: {
        marginTop: spacing[3],
    },
    actionsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666666',
        marginBottom: spacing[2],
    },
    actionChip: {
        backgroundColor: '#F5F5F5', // Light grey background
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radii.sm,
        marginBottom: spacing[2],
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    actionText: {
        fontSize: 13,
        color: '#1A1A1A',
    },
    relatedContainer: {
        marginTop: spacing[3],
    },
    relatedTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666666',
        marginBottom: spacing[2],
    },
    relatedChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
    },
    relatedChip: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.purple,
    },
    relatedText: {
        fontSize: 12,
        color: colors.purple,
        fontWeight: '600',
    },
    followUpContainer: {
        marginTop: spacing[3],
        marginLeft: 40, // Align with assistant messages (avatar width + gap)
    },
    followUpTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666666',
        marginBottom: spacing[2],
    },
    followUpChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
    },
    followUpChip: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.purple + '40',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    followUpText: {
        fontSize: 13,
        color: colors.purple,
        fontWeight: '500',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: colors.purple, // Purple accent for user messages
        padding: spacing[4],
        borderRadius: radii.lg,
        borderTopRightRadius: 4,
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userText: {
        fontSize: 15,
        color: colors.white,
        lineHeight: 22,
    },
});
