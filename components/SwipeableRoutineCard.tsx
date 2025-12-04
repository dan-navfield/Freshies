import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Clock, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';

interface SwipeableRoutineCardProps {
  children: React.ReactNode;
  onSnooze?: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export default function SwipeableRoutineCard({
  children,
  onSnooze,
  onSkip,
  disabled = false,
}: SwipeableRoutineCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const snoozeTranslate = dragX.interpolate({
      inputRange: [-160, -80, 0],
      outputRange: [0, -80, -160],
      extrapolate: 'clamp',
    });

    const skipTranslate = dragX.interpolate({
      inputRange: [-160, -80, 0],
      outputRange: [0, 0, -80],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionsContainer}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.snoozeButton,
            { transform: [{ translateX: snoozeTranslate }] },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonInner}
            onPress={() => {
              swipeableRef.current?.close();
              onSnooze?.();
            }}
          >
            <Clock size={20} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.actionText}>Snooze</Text>
            <Text style={styles.actionSubtext}>1 hour</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.actionButton,
            styles.skipButton,
            { transform: [{ translateX: skipTranslate }] },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonInner}
            onPress={() => {
              swipeableRef.current?.close();
              onSkip?.();
            }}
          >
            <X size={20} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.actionText}>Skip</Text>
            <Text style={styles.actionSubtext}>Today</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing[4],
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  snoozeButton: {
    backgroundColor: colors.orange,
    borderTopLeftRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
  },
  skipButton: {
    backgroundColor: colors.red,
    borderTopRightRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  actionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing[1],
  },
  actionSubtext: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
});
