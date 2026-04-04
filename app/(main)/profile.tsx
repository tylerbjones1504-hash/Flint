/**
 * My Profile screen — shows the authenticated user's full profile data.
 * Useful for verifying that all onboarding fields were saved correctly.
 *
 * TODO: Add edit functionality
 * TODO: Add photo management
 */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Button, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Profile, UserPreferences, ProfilePrompt, FaithSubgroup } from '@/types/database';

type FullProfile = {
  profile: Profile;
  preferences: UserPreferences | null;
  prompts: ProfilePrompt[];
  faithSubgroup: FaithSubgroup | null;
};

export default function MyProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    if (!user) return;

    const [profileRes, prefsRes, promptsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
      supabase
        .from('profile_prompts')
        .select('*')
        .eq('profile_id', user.id)
        .order('display_order'),
    ]);

    if (profileRes.error) {
      setError(profileRes.error.message);
      return;
    }

    const profile = profileRes.data;

    // Fetch faith subgroup if set
    let faithSubgroup: FaithSubgroup | null = null;
    if (profile.faith_subgroup_id) {
      const { data: sg } = await supabase
        .from('faith_subgroups')
        .select('*')
        .eq('id', profile.faith_subgroup_id)
        .single();
      faithSubgroup = sg ?? null;
    }

    setData({
      profile,
      preferences: prefsRes.data ?? null,
      prompts: promptsRes.data ?? [],
      faithSubgroup,
    });
  }

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [user]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: 'red', marginBottom: 12 }}>{error ?? 'Profile not found'}</Text>
        <Button title="← Back" onPress={() => router.back()} />
      </View>
    );
  }

  const { profile, preferences, prompts, faithSubgroup } = data;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* ── Identity ── */}
      <Section title="Identity">
        <Field label="Display name" value={profile.display_name} />
        <Field label="Birth date" value={profile.birth_date} />
        <Field label="Gender" value={profile.gender} />
        <Field label="Sexual orientation" value={profile.sexual_orientation} />
        <Field label="ID (auth.uid)" value={profile.id} mono />
      </Section>

      {/* ── Core fields ── */}
      <Section title="Core">
        <Field label="Relationship goal" value={profile.relationship_goal} />
        <Field label="Faith" value={profile.faith} />
        <Field label="Faith importance" value={profile.faith_importance} />
        {faithSubgroup && <Field label="Faith subgroup" value={faithSubgroup.label} />}
        <Field label="Politics" value={profile.politics} />
      </Section>

      {/* ── Bio ── */}
      <Section title="Bio">
        <Text style={{ color: profile.bio ? '#111' : '#aaa' }}>{profile.bio ?? '(no bio)'}</Text>
      </Section>

      {/* ── Location ── */}
      <Section title="Location">
        <Field label="Country" value={profile.location_country} />
        <Field label="City" value={profile.location_city ?? '—'} />
        <Field label="State" value={profile.location_state ?? '—'} />
        <Field label="Lat/Lon" value={profile.latitude != null ? `${profile.latitude}, ${profile.longitude}` : '—'} />
      </Section>

      {/* ── Professional ── */}
      <Section title="Professional (optional)">
        <Field label="School" value={profile.school ?? '—'} />
        <Field label="Job title" value={profile.job_title ?? '—'} />
        <Field label="Company" value={profile.company ?? '—'} />
      </Section>

      {/* ── Status flags ── */}
      <Section title="Account flags">
        <Field label="is_active" value={String(profile.is_active)} />
        <Field label="is_verified" value={String(profile.is_verified)} />
        <Field label="match_mode" value={profile.match_mode} />
        <Field label="relationship_mode_active" value={String(profile.relationship_mode_active)} />
        <Field label="last_active_at" value={profile.last_active_at ?? '—'} />
        <Field label="created_at" value={profile.created_at} />
      </Section>

      {/* ── Prompts ── */}
      <Section title={`Prompts (${prompts.length}/3)`}>
        {prompts.length === 0 ? (
          <Text style={{ color: '#aaa' }}>(no prompts added)</Text>
        ) : (
          prompts.map((p) => (
            <View key={p.id} style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>{p.prompt_text}</Text>
              <Text style={{ marginTop: 4 }}>{p.answer_text}</Text>
              <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                display_order: {p.display_order}
              </Text>
            </View>
          ))
        )}
      </Section>

      {/* ── Preferences ── */}
      <Section title="Preferences">
        {preferences ? (
          <>
            <Field label="Age range" value={`${preferences.preferred_age_min}–${preferences.preferred_age_max}`} />
            <Field label="Max distance (km)" value={String(preferences.max_distance_km)} />
            <Field label="Preferred genders" value={preferences.preferred_genders.join(', ') || '(none)'} />
            <Field label="Dealbreaker goals" value={preferences.dealbreaker_goals.join(', ') || '(none)'} />
            <Field label="Dealbreaker faith" value={preferences.dealbreaker_faith.join(', ') || '(none)'} />
            <Field label="Dealbreaker politics" value={preferences.dealbreaker_politics.join(', ') || '(none)'} />
            <SectionSubhead title="Scoring weights" />
            <Field label="Relationship goal" value={String(preferences.weight_relationship_goal)} />
            <Field label="Faith" value={String(preferences.weight_faith)} />
            <Field label="Politics" value={String(preferences.weight_politics)} />
            <Field label="Lifestyle" value={String(preferences.weight_lifestyle)} />
            <Field label="Values" value={String(preferences.weight_values)} />
            <Field label="Distance" value={String(preferences.weight_distance)} />
          </>
        ) : (
          <Text style={{ color: '#c00' }}>No preferences row found — this is a bug.</Text>
        )}
      </Section>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 6, padding: 12 }}>
        {children}
      </View>
    </View>
  );
}

function SectionSubhead({ title }: { title: string }) {
  return (
    <Text style={{ fontWeight: '600', marginTop: 8, marginBottom: 4, color: '#555' }}>{title}</Text>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#f5f5f5' }}>
      <Text style={{ flex: 1, color: '#555', fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          flex: 2,
          fontFamily: mono ? 'monospace' : undefined,
          fontSize: mono ? 11 : 13,
          color: '#111',
        }}
        numberOfLines={mono ? 1 : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
