export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    keyPoints?: string[];
    suggestedActions?: string[];
    relatedTopics?: string[];
    followUpPrompts?: string[];
}
