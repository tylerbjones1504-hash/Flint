/**
 * Profile detail view — shows any visible profile by ID.
 * Primarily used for inspecting test profiles during development.
 * Respects RLS — only shows profiles visible to the authenticated user.
 *
 * Navigate to this screen from the home list, or directly via:
 *   router.push(`/profiles/${someProfileId}`)
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Button,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Profile, ProfilePrompt, FaithSubgroup } from '@/types/database';

type ProfileData = {
  profile: Profile;
  prompts: ProfilePrompt[];
  faithSubgroup: FaithSubgroup | null;
  photoCount: number;
};

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    if (!id) return;

    const [profileRes, promptsRes, photosRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('profile_prompts').select('*').eq('profile_id', id).order('display_order'),
      supabase.from('profile_photos').select('id').eq('profile_id', id),
    ]);

    if (profileRes.error) {
      setError(profileRes.error.code === 'PGRST116' ? 'Profile not found or not visible to you' : profileRes.error.message);
      return;
    }

    const profile = profileRes.data;

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
      prompts: promptsRes.data ?? [],
      faithSubgroup,
      photoCount: photosRes.data?.length ?? 0,
    });
  }

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [id]);

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
        <Text style={{ color: 'red', marginBottom: 12 }}>{error ?? 'Unknown error'}</Text>
        <Button title="← Back" onPress={() => router.back()} />
      </View>
    );
  }

  const { profile, prompts, faithSubgroup, photoCount } = data;

  function getAge(birthDate: string): number {
    const ms = Date.now() - new Date(birthDate).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* ── Header ── */}
      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>{profile.display_name}</Text>
      <Text style={{ color: '#555', fontSize: 15, marginTop: 2, marginBottom: 20 }}>
        {getAge(profile.birth_date)} · {profile.gender.replace(/_/g, ' ')} · {profile.sexual_orientation.replace(/_/g, ' ')}
      </Text>

      {/* ── Compatibility fields ── */}
      <Row label="Relationship goal" value={profile.relationship_goal.replace(/_/g, ' ')} />
      <Row label="Faith" value={profile.faith.replace(/_/g, ' ')} />
      {faithSubgroup && <Row label="Faith subgroup" value={faithSubgroup.label} />}
      <Row label="Faith importance" value={profile.faith_importance.replace(/_/g, ' ')} />
      <Row label="Politics" value={profile.politics.replace(/_/g, ' ')} />

      {/* ── Bio ── */}
      {profile.bio ? (
        <>
          <Text style={{ fontWeight: '600', marginTop: 20, marginBottom: 6 }}>Bio</Text>
          <Text style={{ color: '#333' }}>{profile.bio}</Text>
        </>
      ) : null}

      {/* ── Prompts ── */}
      {prompts.length > 0 && (
        <>
          <Text style={{ fontWeight: '600', marginTop: 20, marginBottom: 8 }}>Prompts</Text>
          {prompts.map((p) => (
            <View key={p.id} style={{ marginBottom: 14 }}>
              <Text style={{ color: '#555', fontStyle: 'italic' }}>{p.prompt_text}</Text>
              <Text style={{ marginTop: 4 }}>{p.answer_text}</Text>
            </View>
          ))}
        </>
      )}

      {/* ── Location ── */}
      {(profile.location_city || profile.location_state) ? (
        <Row
          label="Location"
          value={[profile.location_city, profile.location_state, profile.location_country]
            .filter(Boolean)
            .join(', ')}
        />
      ) : null}

      {/* ── Optional ── */}
      {profile.job_title && <Row label="Job title" value={profile.job_title} />}
      {profile.company && <Row label="Company" value={profile.company} />}
      {profile.school && <Row label="School" value={profile.school} />}

      {/* ── Debug metadata ── */}
      <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: '#eee', paddingTop: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Debug
        </Text>
        <Row label="ID" value={profile.id} mono />
        <Row label="Photos in storage" value={String(photoCount)} />
        <Row label="is_active" value={String(profile.is_active)} />
        <Row label="is_verified" value={String(profile.is_verified)} />
        <Row label="match_mode" value={profile.match_mode} />
        <Row label="created_at" value={profile.created_at} />
      </View>

      <View style={{ height: 24 }} />
      <Button title="← Back" onPress={() => router.back()} />
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderColor: '#f5f5f5' }}>
      <Text style={{ width: 140, color: '#888', fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          flex: 1,
          fontSize: mono ? 11 : 13,
          fontFamily: mono ? 'monospace' : undefined,
          color: '#111',
        }}
        numberOfLines={mono ? 1 : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
