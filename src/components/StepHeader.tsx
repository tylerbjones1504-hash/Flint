import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Caption, DisplaySmall, BodySmall } from './Typography';
import { useColors } from '@/theme/ThemeContext';
import { spacing } from '@/theme';

interface StepHeaderProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
}

export function StepHeader({ step, totalSteps = 7, title, subtitle }: StepHeaderProps) {
  const colors = useColors();
  const progress = step / totalSteps;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [step, progressWidth]);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary },
            progressAnimStyle,
          ]}
        />
      </View>
      <Caption style={{ marginTop: spacing.md }}>
        Step {step} of {totalSteps}
      </Caption>
      <DisplaySmall style={{ marginTop: spacing.xs }}>{title}</DisplaySmall>
      {subtitle ? (
        <BodySmall color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          {subtitle}
        </BodySmall>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
