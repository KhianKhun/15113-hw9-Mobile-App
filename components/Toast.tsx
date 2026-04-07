import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

type ToastType = 'info' | 'success' | 'error';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: ToastType;
  duration?: number; // ms, default 2000
}

const BORDER_COLOR: Record<ToastType, string> = {
  info: COLORS.accent,
  success: COLORS.success,
  error: COLORS.error,
};

export default function Toast({ message, visible, onHide, type = 'info', duration = 2000 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, borderColor: BORDER_COLOR[type] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    backgroundColor: 'rgba(30,40,55,0.95)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    zIndex: 999,
    maxWidth: 280,
  },
  text: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
