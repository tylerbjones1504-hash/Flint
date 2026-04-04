import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "../types/database";

// Expo uses EXPO_PUBLIC_ prefix for client-visible env vars.
// These throw at startup if missing — fail fast rather than silent 401s.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: EXPO_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error(
    "Missing environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/** Validated project URL — safe to reuse in server-only helpers below. */
const supabaseUrlResolved: string = supabaseUrl;

/**
 * SecureStore adapter so Supabase auth sessions persist across app restarts.
 * SecureStore values are limited to 2048 bytes — Supabase sessions fit easily.
 *
 * Supabase `SupportedStorage` allows async `getItem` / `setItem` / `removeItem`
 * (PromisifyMethods); the auth client awaits these — do not return raw Promises
 * from sync-only APIs, but Promise-returning methods are correct here.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/**
 * Typed Supabase client for use in the React Native app.
 * Uses the anon key — all access is governed by RLS policies.
 */
export const supabase = createClient<Database>(
  supabaseUrlResolved,
  supabaseAnonKey,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // must be false in React Native
    },
  }
);

/**
 * Service-role Supabase client for **server-side only** (Edge Functions, scripts,
 * receipt validation, seeding). Never import this from app UI or bundle the
 * service role key into the mobile client.
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(supabaseUrlResolved, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
