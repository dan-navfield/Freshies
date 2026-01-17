import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface ExpiryRingProps {
    paoMonths: number;
    daysOpen: number;
    size?: number;
    strokeWidth?: number;
}

export default function ExpiryRing({ paoMonths, daysOpen, size = 48, strokeWidth = 4 }: ExpiryRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const daysTotal = paoMonths * 30;
    const daysLeft = Math.max(0, daysTotal - daysOpen);
    const monthsLeft = Math.max(0, Math.round(paoMonths - daysOpen / 30));

    // Calculate progress: 1.0 is full (fresh), 0.0 is empty (expired)
    // Actually, usually ring depletes as time goes on.
    // So progress starts at 1 and goes to 0?
    // Let's say: Full circle at start. Empty circle at expiry.
    const progress = Math.min(1, Math.max(0, daysLeft / daysTotal));

    // Color logic
    let color = colors.mint;
    const isExpired = daysLeft <= 0;
    const isLow = !isExpired && daysLeft < 30; // Less than a month

    if (isExpired) color = colors.red;
    else if (isLow) color = colors.orange;

    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.charcoal + '10'} // Faint grey background
                        strokeWidth={strokeWidth}
                        fill="white"
                    />
                    {/* Progress Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            <View style={styles.textContainer}>
                <Text style={[styles.number, { fontSize: size * 0.25, color }]}>
                    {isExpired ? '!' : monthsLeft}
                </Text>
                <Text style={[styles.unit, { fontSize: size * 0.2, color }]}>
                    {isExpired ? 'Exp' : 'mo'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    number: {
        fontWeight: '800',
        lineHeight: 14,
    },
    unit: {
        fontWeight: '600',
        opacity: 0.8,
        marginTop: -1,
    }
});
