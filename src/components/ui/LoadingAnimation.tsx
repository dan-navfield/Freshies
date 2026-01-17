import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingAnimationProps {
    size?: number;
    style?: ViewStyle;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ size = 200, style }) => {
    const animation = useRef<LottieView>(null);

    useEffect(() => {
        // You can control the ref programmatically, rather than using autoPlay
        // animation.current?.play();
    }, []);

    return (
        <View style={[styles.container, style]}>
            <LottieView
                autoPlay
                ref={animation}
                style={{
                    width: size,
                    height: size,
                }}
                // Find more Lottie files at https://lottiefiles.com/featured
                source={require('../../../assets/animations/loading.json')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
