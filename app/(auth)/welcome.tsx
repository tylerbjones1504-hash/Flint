import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer, Button } from '@/components';
import { useColors } from '@/theme/ThemeContext';
import { spacing } from '@/theme';
import { Text } from 'react-native';

export default function Welcome() {
  const colors = useColors();

  // Logo animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  // Text animation values
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  // Tagline animation values
  const taglineTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);

  // Buttons animation values
  const buttonsTranslateY = useSharedValue(24);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo entrance: opacity and scale
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1.0, { damping: 12, stiffness: 120 });

    // Text entrance: translate and fade (delayed 150ms)
    textOpacity.value = withDelay(150, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    textTranslateY.value = withDelay(150, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Tagline entrance: translate and fade (delayed 280ms)
    taglineOpacity.value = withDelay(280, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    taglineTranslateY.value = withDelay(280, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));

    // Buttons entrance: translate and fade (delayed 400ms)
    buttonsOpacity.value = withDelay(400, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    buttonsTranslateY.value = withDelay(400, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const buttonsAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={styles.content}>
        <View style={styles.brandArea}>
          {/* Logo diamond */}
          <Animated.Text
            style={[
              styles.logoMark,
              { color: colors.primary },
              logoAnimStyle,
            ]}
          >
            ◆
          </Animated.Text>

          {/* App name */}
          <Animated.Text
            style={[
              styles.logoText,
              { color: colors.textPrimary },
              textAnimStyle,
            ]}
          >
            FLINT
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              { color: colors.textSecondary },
              taglineAnimStyle,
            ]}
          >
            Strike something real.
          </Animated.Text>
        </View>

        {/* Action buttons */}
        <Animated.View
          style={[styles.actions, buttonsAnimStyle]}
        >
          <Button
            title="Create Account"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
          />
          <Button
            title="Sign In"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
  },
  brandArea: {
    alignItems: 'center',
  },
  logoMark: {
    fontSize: 48,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  logoText: {
    fontSize: 42,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 8,
    marginTop: 12,
  },
  tagline: {
    fontSize: 15,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginTop: 16,
  },
  actions: {
    gap: 12,
  },
});
