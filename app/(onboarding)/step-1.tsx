/**
 * Onboarding Step 1: Basic Info
 * Collects display_name, birth_date, gender, sexual_orientation
 * TODO: Replace birth_date TextInput with a native DateTimePicker
 */
import { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/onboarding';
import type { Gender, SexualOrientation } from '@/types/database';

const GENDERS: Gender[] = ['man', 'woman', 'non_binary', 'other', 'prefer_not_to_say'];
const ORIENTATIONS: SexualOrientation[] = [
  'straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'queer', 'other', 'prefer_not_to_say',
];

export default function Step1() {
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    if (!data.display_name.trim()) { setError('Display name is required'); return false; }
    if (data.display_name.trim().length > 50) { setError('Display name must be ≤ 50 characters'); return false; }
    if (!data.birth_date) { setError('Birth date is required (YYYY-MM-DD)'); return false; }

    const d = new Date(data.birth_date);
    if (isNaN(d.getTime())) { setError('Invalid date — use YYYY-MM-DD format'); return false; }

    const ageMs = Date.now() - d.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears < 18) { setError('You must be 18 or older to use Flint'); return false; }

    if (!data.gender) { setError('Please select a gender'); return false; }
    if (!data.sexual_orientation) { setError('Please select a sexual orientation'); return false; }

    setError(null);
    return true;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 1 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 24 }}>Basic Info</Text>

      <Text style={{ marginBottom: 4 }}>Display Name</Text>
      <TextInput
        value={data.display_name}
        onChangeText={(v) => update({ display_name: v })}
        maxLength={50}
        placeholder="How you'll appear to others"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 4, borderRadius: 4 }}
      />
      <Text style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
        {data.display_name.length}/50
      </Text>

      <Text style={{ marginBottom: 4 }}>Birth Date</Text>
      <TextInput
        value={data.birth_date}
        onChangeText={(v) => update({ birth_date: v })}
        placeholder="YYYY-MM-DD (e.g. 1995-06-15)"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 16, borderRadius: 4 }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Gender</Text>
      {GENDERS.map((g) => (
        <Pressable
          key={g}
          onPress={() => update({ gender: g })}
          style={{
            padding: 12,
            marginBottom: 6,
            borderRadius: 4,
            backgroundColor: data.gender === g ? '#111' : '#eee',
          }}
        >
          <Text style={{ color: data.gender === g ? '#fff' : '#111' }}>
            {g.replace(/_/g, ' ')}
          </Text>
        </Pressable>
      ))}

      <Text style={{ fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Sexual Orientation</Text>
      {ORIENTATIONS.map((o) => (
        <Pressable
          key={o}
          onPress={() => update({ sexual_orientation: o })}
          style={{
            padding: 12,
            marginBottom: 6,
            borderRadius: 4,
            backgroundColor: data.sexual_orientation === o ? '#111' : '#eee',
          }}
        >
          <Text style={{ color: data.sexual_orientation === o ? '#fff' : '#111' }}>
            {o.replace(/_/g, ' ')}
          </Text>
        </Pressable>
      ))}

      {error ? <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text> : null}

      <View style={{ height: 24 }} />
      <Button title="Next →" onPress={() => { if (validate()) router.push('/(onboarding)/step-2'); }} />
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
