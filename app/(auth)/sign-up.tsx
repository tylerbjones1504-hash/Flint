import { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Email confirmation disabled → session is returned immediately
    if (data.session) {
      router.replace('/(onboarding)/step-1');
    } else {
      // Email confirmation enabled → user must confirm before proceeding
      setMessage('Check your email to confirm your account, then sign in.');
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Create Account</Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 16, borderRadius: 4 }}
      />

      <Text>Password (min 6 characters)</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password-new"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 24, borderRadius: 4 }}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}
      {message ? <Text style={{ color: 'green', marginBottom: 12 }}>{message}</Text> : null}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Create Account" onPress={handleSignUp} />
      )}

      <View style={{ height: 16 }} />
      <Button
        title="Already have an account? Sign In"
        onPress={() => router.replace('/(auth)/sign-in')}
      />
    </View>
  );
}
