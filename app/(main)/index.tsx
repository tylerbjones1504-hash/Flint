/**
 * Main home screen — shows a list of visible profiles.
 * During MVP / testing this is the primary way to browse test profiles.
 *
 * TODO: Replace with actual match queue once matching pipeline is built.
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Button,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Profile } from '@/types/database';

export default function Home() {
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
    } else {
      setProfiles(data ?? []);
    }
  }

  useEffect(() => {
    fetchProfiles().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  }

  function getAge(birthDate: string): number {
    const ms = Date.now() - new Date(birthDate).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderColor: '#eee',
        }}
      >
        <Text style={{ fontSize: 13, color: '#555' }}>Signed in as {user?.email}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="My Profile" onPress={() => router.push('/(main)/profile')} />
          <Button title="Sign Out" onPress={signOut} color="#c00" />
        </View>
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={profiles}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>
            No profiles found. Create test accounts to populate this list.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/profiles/${item.id}`)}
            style={{
              padding: 14,
              marginBottom: 10,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#ddd',
              backgroundColor: item.id === user?.id ? '#f0fff0' : '#fff',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>{item.display_name}</Text>
              <Text style={{ color: '#555' }}>{getAge(item.birth_date)} · {item.gender}</Text>
            </View>
            <Text style={{ color: '#555', marginTop: 2 }}>
              {item.relationship_goal.replace(/_/g, ' ')} · {item.faith.replace(/_/g, ' ')} · {item.politics.replace(/_/g, ' ')}
            </Text>
            {item.bio ? (
              <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                {item.bio}
              </Text>
            ) : null}
            {item.id === user?.id && (
              <Text style={{ color: 'green', fontSize: 12, marginTop: 4 }}>← you</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
