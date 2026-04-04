/**
 * Onboarding Step 4: Politics
 * Uses softer display labels from scoring.ts POLITICS_DISPLAY_LABELS
 */
import { useState } from 'react';
import { View, Text, Button, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/onboarding';
import type { PoliticsSpectrum } from '@/types/database';

const POLITICS: { value: PoliticsSpectrum; label: string }[] = [
  { value: 'very_liberal', label: 'Very liberal' },
  { value: 'liberal', label: 'Liberal' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'conservative', label: 'Conservative' },
  { value: 'very_conservative', label: 'Very conservative' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function Step4() {
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 4 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>Politics</Text>
      <Text style={{ color: '#555', marginBottom: 24 }}>
        Your political leaning. Used in compatibility scoring — not shown prominently on your profile.
      </Text>

      {POLITICS.map((p) => (
        <Pressable
          key={p.value}
          onPress={() => { update({ politics: p.value }); setError(null); }}
          style={{
            padding: 12,
            marginBottom: 6,
            borderRadius: 4,
            backgroundColor: data.politics === p.value ? '#111' : '#eee',
          }}
        >
          <Text style={{ color: data.politics === p.value ? '#fff' : '#111' }}>{p.label}</Text>
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
              if (!data.politics) { setError('Please select a political leaning'); return; }
              router.push('/(onboarding)/step-5');
            }}
          />
        </View>
      </View>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
