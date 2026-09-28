import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { Trash2, Edit3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

export interface SwipeableTransactionRowProps {
  children: React.ReactNode;
  onSwipeLeftDelete: () => void;
  onSwipeRightEdit: () => void;
  onPress: () => void;
}

export const SwipeableTransactionRow: React.FC<SwipeableTransactionRowProps> = ({
  children,
  onSwipeLeftDelete,
  onSwipeRightEdit,
  onPress,
}) => {
  const { theme } = useTheme();
  const pan = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = 75;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal gestures with substantial dx compared to dy
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Clamp swipe between -120 and 120
        const clampedDx = Math.max(-120, Math.min(120, gestureState.dx));
        pan.setValue(clampedDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped left -> Delete
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {}
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
          onSwipeLeftDelete();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swiped right -> Edit
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
          onSwipeRightEdit();
        } else {
          // Snap back
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const leftOpacity = pan.interpolate({
    inputRange: [0, 8],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightOpacity = pan.interpolate({
    inputRange: [-8, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Background action strips */}
      <View style={[styles.backgroundContainer, { borderRadius: theme.radii.lg }]}>
        {/* Left background: Modify (revealed when swiping right) */}
        <Animated.View
          style={[
            styles.actionBackground,
            styles.leftAction,
            {
              backgroundColor: theme.colors.pillar.savings,
              borderRadius: theme.radii.lg,
              opacity: leftOpacity,
            },
          ]}
        >
          <Edit3 size={20} color="#FFFFFF" />
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Modifier</Text>
        </Animated.View>

        {/* Right background: Delete (revealed when swiping left) */}
        <Animated.View
          style={[
            styles.actionBackground,
            styles.rightAction,
            {
              backgroundColor: theme.colors.status.overrun,
              borderRadius: theme.radii.lg,
              opacity: rightOpacity,
            },
          ]}
        >
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Supprimer</Text>
          <Trash2 size={20} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Foreground Swipeable Item */}
      <Animated.View
        style={[{ transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={onPress}>
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 4,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  actionBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  leftAction: {
    justifyContent: 'flex-start',
  },
  rightAction: {
    justifyContent: 'flex-end',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
