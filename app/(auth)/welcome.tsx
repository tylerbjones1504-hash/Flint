import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';

export default function Welcome() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>Flint</Text>
      <Text style={{ fontSize: 16, marginBottom: 48, color: '#555' }}>
        Strike something real.
      </Text>
      <Button title="Create Account" onPress={() => router.push('/(auth)/sign-up')} />
      <View style={{ height: 12 }} />
      <Button title="Sign In" onPress={() => router.push('/(auth)/sign-in')} />
    </View>
  );
}
