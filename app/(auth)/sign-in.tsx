import { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Auth state change in AuthProvider will trigger re-render at app/index.tsx
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Sign In</Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 16, borderRadius: 4 }}
      />

      <Text>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 24, borderRadius: 4 }}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Sign In" onPress={handleSignIn} />
      )}

      <View style={{ height: 16 }} />
      <Button
        title="No account? Sign Up"
        onPress={() => router.replace('/(auth)/sign-up')}
      />
    </View>
  );
}
