/**
 * Discover screen — card-based profile browsing with swipe gestures.
 */
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Profile, UserPreferences } from '@/types/database';
import { computeCompatibilityScore, scoresToTier, FLAME_TIER_LABELS } from '@/lib/scoring';
import { formatGoal, formatFaith, formatPolitics, formatGender } from '@/lib/format';
import {
  ScreenContainer, Heading, BodySmall, Caption, FlameIcon,
} from '@/components';
import { useColors } from '@/theme/ThemeContext';
import { spacing, radii, type FlameTier } from '@/theme';
import { Text } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');
const CARD_HEIGHT = screenHeight * 0.72;

export default function Discover() {
  const colors = useColors();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [myPrefs, setMyPrefs] = useState<UserPreferences | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadCandidates = useCallback(async () => {
    if (!user) return;

    const [profileRes, prefsRes, likesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
      supabase.from('likes').select('target_id').eq('actor_id', user.id),
    ]);

    if (profileRes.error || !profileRes.data) return;
    setMyProfile(profileRes.data);
    setMyPrefs(prefsRes.data ?? null);

    const alreadySeen = new Set((likesRes.data ?? []).map((l) => l.target_id));
    alreadySeen.add(user.id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    setCandidates((profiles ?? []).filter((p) => !alreadySeen.has(p.id)));
    setCurrentIndex(0);
  }, [user]);

  useEffect(() => {
    loadCandidates().finally(() => setLoading(false));
  }, [loadCandidates]);

  async function handleAction(type: 'like' | 'pass') {
    if (!user || !currentCandidate) return;
    setActing(true);

    await supabase.from('likes').insert({
      actor_id: user.id,
      target_id: currentCandidate.id,
      like_type: type,
    });

    if (type === 'like') {
      const { data: reciprocal } = await supabase
        .from('likes').select('id')
        .eq('actor_id', currentCandidate.id)
        .eq('target_id', user.id)
        .eq('like_type', 'like')
        .maybeSingle();

      if (reciprocal && myProfile && myPrefs) {
        const score = computeCompatibilityScore({ viewer: myProfile, candidate: currentCandidate, viewerPrefs: myPrefs });
        if (score != null) {
          await supabase.rpc('create_match', {
            p_a: user.id,
            p_b: currentCandidate.id,
            p_score: Math.round(score) as unknown as number,
            p_nudged_profile: null,
          });
        }
      }
    }

    setCurrentIndex((i) => i + 1);
    setActing(false);
  }

  const currentCandidate = candidates[currentIndex] ?? null;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!currentCandidate) {
    return (
      <ScreenContainer scroll={false} padded>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Heading style={{ marginBottom: spacing.sm, textAlign: 'center' }}>You're all caught up</Heading>
          <BodySmall color={colors.textSecondary} style={{ textAlign: 'center', maxWidth: 260 }}>
            Check back later for new people in your area.
          </BodySmall>
        </View>
      </ScreenContainer>
    );
  }

  const score = myProfile && myPrefs
    ? computeCompatibilityScore({ viewer: myProfile, candidate: currentCandidate, viewerPrefs: myPrefs })
    : null;
  const tier = score != null ? scoresToTier(score) : null;

  return (
    <ScreenContainer scroll={false} padded>
      <CardView
        candidate={currentCandidate}
        tier={tier}
        colors={colors}
        acting={acting}
        onAction={handleAction}
      />

      {/* Remaining count */}
      <Caption color={colors.textMuted} style={{ textAlign: 'center', marginTop: spacing.xl }}>
        {candidates.length - currentIndex - 1} left
      </Caption>

      <View style={{ height: spacing['3xl'] }} />
    </ScreenContainer>
  );
}

function CardView({
  candidate,
  tier,
  colors,
  acting,
  onAction,
}: {
  candidate: Profile;
  tier: FlameTier | null;
  colors: ReturnType<typeof useColors>;
  acting: boolean;
  onAction: (type: 'like' | 'pass') => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const enterScale = useSharedValue(0.95);
  const enterOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    enterOpacity.value = withTiming(1, { duration: 350 });
    enterScale.value = withSpring(1, { damping: 14, stiffness: 100 });
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.2;
    })
    .onEnd(() => {
      if (translateX.value > 100) {
        // Like
        translateX.value = withTiming(500, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
        runOnJS(onAction)('like');
      } else if (translateX.value < -100) {
        // Pass
        translateX.value = withTiming(-500, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
        runOnJS(onAction)('pass');
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 14, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-150, 0, 150],
      [-12, 0, 12],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, 200],
      [enterOpacity.value, Math.max(0.6, enterOpacity.value * 0.5)],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
        { scale: enterScale.value },
      ],
      opacity,
    };
  });

  function getAge(birthDate: string): number {
    return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View>
        <Animated.View style={[styles.cardContainer, cardAnimStyle]}>
          {/* Photo area (placeholder) */}
          <View style={[styles.photoArea, { backgroundColor: '#1A1A1C' }]} />

          {/* Bottom overlay with gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientOverlay}
          />

          {/* Profile info on overlay */}
          <View style={styles.profileInfo}>
            <Text style={[styles.nameAge, { color: '#FFFFFF' }]}>
              {candidate.display_name}, {getAge(candidate.birth_date)}
            </Text>

            {candidate.location_city && (
              <Text style={[styles.city, { color: 'rgba(255,255,255,0.65)' }]}>
                {candidate.location_city}
              </Text>
            )}

            {tier && (
              <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <FlameIcon tier={tier} size={14} />
                <Caption style={{ marginLeft: 6, color: '#FFFFFF' }}>
                  {FLAME_TIER_LABELS[tier]}
                </Caption>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.passButton,
              { backgroundColor: '#1C1C1E', borderColor: '#3A3A3C' },
              pressed && { opacity: 0.7 },
            ]}
            disabled={acting}
            onPress={() => onAction('pass')}
          >
            <Text style={styles.passIcon}>✕</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.likeButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
            disabled={acting}
            onPress={() => onAction('like')}
          >
            <Text style={styles.likeIcon}>♥</Text>
          </Pressable>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  photoArea: {
    flex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  profileInfo: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  nameAge: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  city: {
    fontSize: 15,
    marginTop: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
  },
  passButton: {
    width: 64,
    height: 64,
    borderWidth: 1.5,
  },
  likeButton: {
    width: 72,
    height: 72,
  },
  passIcon: {
    fontSize: 24,
    color: '#636366',
    fontWeight: '600',
  },
  likeIcon: {
    fontSize: 26,
    color: '#FFFFFF',
  },
});
