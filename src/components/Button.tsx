import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
  StyleSheet,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColors } from '@/theme/ThemeContext';
import { typography, radii, MIN_TOUCH_TARGET, hitSlop } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizeMap: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colors = useColors();
  const sizeStyle = sizeMap[size];
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    const base: ViewStyle = {
      minHeight: MIN_TOUCH_TARGET,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: isDisabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'primary':
        base.backgroundColor = pressed ? colors.primaryDark : colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = pressed ? colors.primaryDark : colors.primary;
        break;
      case 'ghost':
        base.backgroundColor = pressed ? colors.surfaceElevated : 'transparent';
        break;
      case 'danger':
        base.backgroundColor = pressed ? '#A93226' : colors.error;
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      ...typography.button,
      fontSize: sizeStyle.fontSize,
    };

    switch (variant) {
      case 'primary':
        base.color = '#FFFFFF';
        break;
      case 'secondary':
        base.color = colors.primary;
        break;
      case 'ghost':
        base.color = colors.primary;
        break;
      case 'danger':
        base.color = '#FFFFFF';
        break;
    }

    return base;
  };

  const textStyle = getTextStyle();

  return (
    <Animated.View
      style={[
        animStyle,
        fullWidth && { width: '100%' },
      ]}
    >
      <Pressable
        {...props}
        disabled={isDisabled}
        hitSlop={hitSlop}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
        }}
        style={({ pressed }) => getContainerStyle(pressed)}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'secondary' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
            size="small"
            style={styles.loader}
          />
        ) : null}
        <Text style={[textStyle, loading && styles.hiddenText]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
  },
  hiddenText: {
    opacity: 0,
  },
});
