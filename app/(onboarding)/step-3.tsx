/**
 * Onboarding Step 3: Faith
 * Collects faith tradition, importance, and optional faith subgroup.
 * Subgroup options are fetched from Supabase faith_subgroups table.
 */
import { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/onboarding';
import { supabase } from '@/lib/supabase';
import type { FaithTradition, PreferenceImportance, FaithSubgroup } from '@/types/database';

const FAITHS: { value: FaithTradition; label: string }[] = [
  { value: 'not_religious', label: 'Not religious' },
  { value: 'spiritual', label: 'Spiritual (not religious)' },
  { value: 'christian', label: 'Christian' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddhist', label: 'Buddhist' },
];

const IMPORTANCES: { value: PreferenceImportance; label: string }[] = [
  { value: 'dealbreaker', label: "Dealbreaker — must share my faith" },
  { value: 'important', label: 'Important — prefer someone with similar faith' },
  { value: 'not_important', label: "Not important — open to anyone" },
];

// Faiths that have no subgroups seeded
const NO_SUBGROUP_FAITHS: FaithTradition[] = ['not_religious'];

export default function Step3() {
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [subgroupError, setSubgroupError] = useState<string | null>(null);
  const [subgroups, setSubgroups] = useState<FaithSubgroup[]>([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);
  const [subgroupFetchKey, setSubgroupFetchKey] = useState(0);

  // Fetch subgroups whenever faith changes
  useEffect(() => {
    if (!data.faith || NO_SUBGROUP_FAITHS.includes(data.faith)) {
      setSubgroups([]);
      update({ faith_subgroup_id: null });
      return;
    }

    const parentFaith = data.faith;
    let cancelled = false;
    setLoadingSubgroups(true);
    setSubgroupError(null);

    void (async () => {
      try {
        const { data: rows, error: qError } = await supabase
          .from('faith_subgroups')
          .select('*')
          .eq('parent_faith', parentFaith)
          .eq('is_active', true)
          .order('sort_order');
        if (cancelled) return;
        if (qError) {
          setSubgroups([]);
          setSubgroupError('Could not load faith subgroups. Check your connection and try again.');
        } else {
          setSubgroups(rows ?? []);
        }
      } catch {
        if (cancelled) return;
        setSubgroups([]);
        setSubgroupError('Could not load faith subgroups. Check your connection and try again.');
      } finally {
        if (!cancelled) {
          setLoadingSubgroups(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.faith, subgroupFetchKey]);

  function handleFaithSelect(faith: FaithTradition) {
    // Reset subgroup when faith changes
    update({ faith, faith_subgroup_id: null });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 3 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 24 }}>Faith</Text>

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Your faith tradition</Text>
      {FAITHS.map((f) => (
        <Pressable
          key={f.value}
          onPress={() => handleFaithSelect(f.value)}
          style={{
            padding: 12,
            marginBottom: 6,
            borderRadius: 4,
            backgroundColor: data.faith === f.value ? '#111' : '#eee',
          }}
        >
          <Text style={{ color: data.faith === f.value ? '#fff' : '#111' }}>{f.label}</Text>
        </Pressable>
      ))}

      {/* Subgroup picker (shown when faith has subgroups) */}
      {data.faith && !NO_SUBGROUP_FAITHS.includes(data.faith) && (
        <>
          <Text style={{ fontWeight: '600', marginTop: 20, marginBottom: 8 }}>
            Subgroup (optional)
          </Text>
          {subgroupError && subgroups.length === 0 && !loadingSubgroups ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#c00', marginBottom: 8 }}>{subgroupError}</Text>
              <Button title="Retry" onPress={() => setSubgroupFetchKey((k) => k + 1)} />
            </View>
          ) : null}
          {loadingSubgroups ? (
            <ActivityIndicator />
          ) : (
            subgroups.map((sg) => (
              <Pressable
                key={sg.id}
                onPress={() =>
                  update({ faith_subgroup_id: data.faith_subgroup_id === sg.id ? null : sg.id })
                }
                style={{
                  padding: 12,
                  marginBottom: 6,
                  borderRadius: 4,
                  backgroundColor: data.faith_subgroup_id === sg.id ? '#555' : '#eee',
                }}
              >
                <Text style={{ color: data.faith_subgroup_id === sg.id ? '#fff' : '#111' }}>
                  {sg.label}
                </Text>
              </Pressable>
            ))
          )}
        </>
      )}

      <Text style={{ fontWeight: '600', marginTop: 20, marginBottom: 8 }}>
        How important is shared faith to you?
      </Text>
      {IMPORTANCES.map((i) => (
        <Pressable
          key={i.value}
          onPress={() => update({ faith_importance: i.value })}
          style={{
            padding: 12,
            marginBottom: 6,
            borderRadius: 4,
            backgroundColor: data.faith_importance === i.value ? '#111' : '#eee',
          }}
        >
          <Text style={{ color: data.faith_importance === i.value ? '#fff' : '#111' }}>
            {i.label}
          </Text>
        </Pressable>
      ))}

      {error ? <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text> : null}

      <View style={{ height: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="← Back" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Next →"
            onPress={() => {
              if (!data.faith) { setError('Please select a faith tradition'); return; }
              if (!data.faith_importance) { setError('Please select how important faith is to you'); return; }
              router.push('/(onboarding)/step-4');
            }}
          />
        </View>
      </View>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
