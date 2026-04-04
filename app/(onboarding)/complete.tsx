/**
 * Onboarding Complete
 * Writes profile, user_preferences, and profile_prompts to Supabase.
 * Runs once on mount — shows a spinner while working, error state on failure.
 */
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useOnboarding } from '@/context/onboarding';

export default function OnboardingComplete() {
  const { user } = useAuth();
  const { data, reset } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    createProfile();
  }, [user]);

  async function createProfile() {
    if (!user) return;
    setError(null);

    // ── 1. Insert profile ──────────────────────────────────────────────────────
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: data.display_name.trim(),
      birth_date: data.birth_date,
      gender: data.gender!,
      sexual_orientation: data.sexual_orientation!,
      relationship_goal: data.relationship_goal!,
      faith: data.faith!,
      faith_importance: data.faith_importance!,
      faith_subgroup_id: data.faith_subgroup_id ?? null,
      politics: data.politics!,
      bio: data.bio.trim() || null,
      location_country: 'US', // TODO: detect / ask during onboarding
      match_mode: 'spark',
      relationship_mode_active: false,
      is_active: true,
      is_verified: false,
    });

    if (profileError) {
      setError('Failed to create profile');
      setDetail(profileError.message);
      return;
    }

    // ── 2. Insert user_preferences ─────────────────────────────────────────────
    const { error: prefError } = await supabase.from('user_preferences').insert({
      profile_id: user.id,
      preferred_age_min: data.preferred_age_min,
      preferred_age_max: data.preferred_age_max,
      max_distance_km: data.max_distance_km,
      preferred_genders: data.preferred_genders,
      dealbreaker_goals: [],
      dealbreaker_faith: [],
      dealbreaker_politics: [],
      weight_faith: 20,
      weight_politics: 20,
      weight_relationship_goal: 30,
      weight_lifestyle: 10,
    });

    if (prefError) {
      setError('Failed to save preferences');
      setDetail(prefError.message);
      return;
    }

    // ── 3. Insert prompts (if any) ─────────────────────────────────────────────
    const validPrompts = data.prompts.filter((p) => p.answer_text.trim().length > 0);
    if (validPrompts.length > 0) {
      const { error: promptError } = await supabase.from('profile_prompts').insert(
        validPrompts.map((p, i) => ({
          profile_id: user.id,
          template_id: p.template_id,
          prompt_text: p.prompt_text,
          answer_text: p.answer_text.trim(),
          display_order: i,
        }))
      );

      if (promptError) {
        setError('Failed to save prompts');
        setDetail(promptError.message);
        return;
      }
    }

    reset();
    router.replace('/(main)/');
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ marginBottom: 8 }}>{error}</Text>
        {detail ? (
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 24 }}>{detail}</Text>
        ) : null}
        <Button title="Try Again" onPress={createProfile} />
        <View style={{ height: 12 }} />
        <Button title="← Back to Preferences" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16, fontSize: 16 }}>Creating your profile...</Text>
    </View>
  );
}
