/**
 * Onboarding Step 5: Bio
 * Optional — can be skipped.
 */
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/onboarding';

const MAX_BIO = 500;

export default function Step5() {
  const { data, update } = useOnboarding();

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 5 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>Bio</Text>
      <Text style={{ color: '#555', marginBottom: 24 }}>
        Optional. A short description of yourself. You can add or edit this later.
      </Text>

      <TextInput
        value={data.bio}
        onChangeText={(v) => update({ bio: v.slice(0, MAX_BIO) })}
        placeholder="Tell people a bit about yourself..."
        multiline
        numberOfLines={6}
        maxLength={MAX_BIO}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 4,
          minHeight: 120,
          textAlignVertical: 'top',
        }}
      />
      <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
        {data.bio.length}/{MAX_BIO}
      </Text>

      <View style={{ height: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="← Back" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Next →" onPress={() => router.push('/(onboarding)/step-6')} />
        </View>
      </View>
      <View style={{ height: 24 }} />
      <Button
        title="Skip"
        onPress={() => { update({ bio: '' }); router.push('/(onboarding)/step-6'); }}
      />
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
