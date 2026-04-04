/**
 * Onboarding Step 2: Relationship Goal
 */
import { useState } from 'react';
import { View, Text, Button, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/onboarding';
import type { RelationshipGoal } from '@/types/database';

const GOALS: { value: RelationshipGoal; label: string; description: string }[] = [
  { value: 'serious', label: 'Serious relationship', description: 'Looking for something committed and long-term' },
  { value: 'casual', label: 'Casual dating', description: 'Open to seeing where things go' },
  { value: 'open', label: 'Open relationship', description: 'Ethical non-monogamy or open to it' },
  { value: 'not_sure', label: 'Not sure yet', description: "Haven't figured it out" },
];

export default function Step2() {
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 2 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>Relationship Goal</Text>
      <Text style={{ color: '#555', marginBottom: 24 }}>
        This is used to match you with people who want the same thing.
      </Text>

      {GOALS.map((g) => (
        <Pressable
          key={g.value}
          onPress={() => { update({ relationship_goal: g.value }); setError(null); }}
          style={{
            padding: 16,
            marginBottom: 10,
            borderRadius: 6,
            backgroundColor: data.relationship_goal === g.value ? '#111' : '#eee',
          }}
        >
          <Text style={{ fontWeight: '600', color: data.relationship_goal === g.value ? '#fff' : '#111' }}>
            {g.label}
          </Text>
          <Text style={{ fontSize: 13, color: data.relationship_goal === g.value ? '#ddd' : '#555', marginTop: 2 }}>
            {g.description}
          </Text>
        </Pressable>
      ))}

      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}

      <View style={{ height: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="← Back" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Next →"
            onPress={() => {
              if (!data.relationship_goal) { setError('Please select a relationship goal'); return; }
              router.push('/(onboarding)/step-3');
            }}
          />
        </View>
      </View>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
