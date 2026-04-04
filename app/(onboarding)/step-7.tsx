/**
 * Onboarding Step 7: Preferences
 * Collects preferred_age_min/max, max_distance_km, preferred_genders.
 * TODO: Replace number inputs with sliders
 */
import { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/onboarding';
import type { Gender } from '@/types/database';

const GENDERS: Gender[] = ['man', 'woman', 'non_binary', 'other', 'prefer_not_to_say'];

export default function Step7() {
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  function toggleGender(g: Gender) {
    const current = data.preferred_genders;
    if (current.includes(g)) {
      update({ preferred_genders: current.filter((x) => x !== g) });
    } else {
      update({ preferred_genders: [...current, g] });
    }
  }

  function validate(): boolean {
    const min = Number(data.preferred_age_min);
    const max = Number(data.preferred_age_max);
    const dist = Number(data.max_distance_km);

    if (isNaN(min) || min < 18) { setError('Min age must be ≥ 18'); return false; }
    if (isNaN(max) || max > 100) { setError('Max age must be ≤ 100'); return false; }
    if (min > max) { setError('Min age must be ≤ max age'); return false; }
    if (isNaN(dist) || dist < 1 || dist > 500) { setError('Distance must be 1–500 km'); return false; }
    if (data.preferred_genders.length === 0) { setError('Select at least one gender preference'); return false; }

    setError(null);
    return true;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 7 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 24 }}>Preferences</Text>

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Age Range</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ marginBottom: 4 }}>Min age</Text>
          <TextInput
            value={String(data.preferred_age_min)}
            onChangeText={(v) => update({ preferred_age_min: parseInt(v) || 18 })}
            keyboardType="number-pad"
            maxLength={3}
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4 }}
          />
        </View>
        <Text style={{ marginTop: 20 }}>–</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ marginBottom: 4 }}>Max age</Text>
          <TextInput
            value={String(data.preferred_age_max)}
            onChangeText={(v) => update({ preferred_age_max: parseInt(v) || 35 })}
            keyboardType="number-pad"
            maxLength={3}
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4 }}
          />
        </View>
      </View>

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Max Distance (km)</Text>
      <TextInput
        value={String(data.max_distance_km)}
        onChangeText={(v) => update({ max_distance_km: parseInt(v) || 50 })}
        keyboardType="number-pad"
        maxLength={3}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4, marginBottom: 16 }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>I'm interested in</Text>
      <Text style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Select all that apply</Text>
      {GENDERS.map((g) => {
        const selected = data.preferred_genders.includes(g);
        return (
          <Pressable
            key={g}
            onPress={() => toggleGender(g)}
            style={{
              padding: 12,
              marginBottom: 6,
              borderRadius: 4,
              backgroundColor: selected ? '#111' : '#eee',
            }}
          >
            <Text style={{ color: selected ? '#fff' : '#111' }}>
              {selected ? '✓ ' : ''}{g.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        );
      })}

      {error ? <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text> : null}

      <View style={{ height: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="← Back" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Create Profile →"
            onPress={() => { if (validate()) router.push('/(onboarding)/complete'); }}
          />
        </View>
      </View>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
