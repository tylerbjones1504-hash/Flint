/**
 * Flint — Supabase Database Type Definitions
 *
 * Auto-maintained manually to match the migration schema.
 * Run `supabase gen types typescript --local > src/types/database.ts`
 * to regenerate from a running local Supabase instance.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Gender =
  | "man"
  | "woman"
  | "non_binary"
  | "other"
  | "prefer_not_to_say";

export type SexualOrientation =
  | "straight"
  | "gay"
  | "lesbian"
  | "bisexual"
  | "pansexual"
  | "asexual"
  | "queer"
  | "other"
  | "prefer_not_to_say";

export type RelationshipGoal = "serious" | "casual" | "open" | "not_sure";

export type MonogamyPreference =
  | "strictly_monogamous"
  | "open_to_discussing"
  | "non_monogamous";

export type FaithTradition =
  | "not_religious"
  | "spiritual_not_religious"
  | "christian"
  | "jewish"
  | "muslim"
  | "hindu"
  | "buddhist"
  | "other";

export type PreferenceImportance = "dealbreaker" | "important" | "not_important";

export type PoliticsSpectrum =
  | "very_liberal"
  | "liberal"
  | "moderate"
  | "conservative"
  | "very_conservative"
  | "prefer_not_to_say";

/**
 * Flame tiers drive the visual treatment of compatibility scores.
 *   ash    →  0–30%   "Not your usual type"
 *   smoke  → 31–50%   "Some common ground"
 *   ember  → 51–68%   "Real overlap"
 *   blaze  → 69–84%   "Strongly aligned"
 *   strike → 85%+     "Rare kind of connection"  ← amber glow activated
 */
export type FlameTier = "ash" | "smoke" | "ember" | "blaze" | "strike";

export type MatchMode = "spark";

export type LikeType = "like" | "pass";

export type CreditTransactionType =
  | "purchase"
  | "spend_priority_message"
  | "spend_reopen_passed"
  | "spend_compat_deep_dive"
  | "refund"
  | "promo";

export type ReportReason =
  | "inappropriate_photos"
  | "harassment"
  | "spam"
  | "fake_profile"
  | "underage"
  | "other";

// ---------------------------------------------------------------------------
// Table row types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  birth_date: string; // ISO date string
  gender: Gender;
  sexual_orientation: SexualOrientation;
  relationship_goal: RelationshipGoal;
  faith: FaithTradition;
  faith_importance: PreferenceImportance;
  politics: PoliticsSpectrum;
  monogamy_preference: MonogamyPreference;
  school: string | null;
  job_title: string | null;
  company: string | null;
  bio: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  latitude: number | null;
  longitude: number | null;
  match_mode: MatchMode;
  relationship_mode_active: boolean;
  relationship_mode_with: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_active_at: string | null;
}

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  created_at: string;
  storage_path: string;
  display_order: number; // 0–7
  is_primary: boolean;
  width: number | null;
  height: number | null;
}

export interface PromptTemplate {
  id: string;
  created_at: string;
  prompt_text: string;
  is_flint_branded: boolean;
  is_active: boolean;
  display_order: number;
}

export interface ProfilePrompt {
  id: string;
  profile_id: string;
  template_id: string | null;
  prompt_text: string;
  answer_text: string;
  display_order: number; // 0–2
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  profile_id: string;
  updated_at: string;
  preferred_age_min: number;
  preferred_age_max: number;
  max_distance_km: number;
  preferred_genders: Gender[];
  dealbreaker_goals: RelationshipGoal[];
  dealbreaker_faith: FaithTradition[];
  dealbreaker_monogamy: MonogamyPreference[];
  dealbreaker_politics: PoliticsSpectrum[];
  weight_faith: number;
  weight_politics: number;
  weight_relationship_goal: number;
  weight_monogamy: number;
  weight_lifestyle: number;
}

export interface Like {
  id: string;
  created_at: string;
  actor_id: string;
  target_id: string;
  like_type: LikeType;
  liked_on: string | null;
}

export interface Match {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id_1: string;
  profile_id_2: string;
  compatibility_score: number;
  flame_tier: FlameTier;
  first_mover_id: string | null;
  is_active: boolean;
  unmatched_by: string | null;
  unmatched_at: string | null;
  relationship_mode_requested_by: string | null;
  relationship_mode_active: boolean;
  relationship_mode_activated_at: string | null;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  commons_prompt_id: string | null;
  commons_answered_1: boolean;
  commons_answered_2: boolean;
  commons_revealed: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  created_at: string;
  edited_at: string | null;
  body: string;
  is_deleted: boolean;
  is_priority: boolean;
}

export interface CommonsPrompt {
  id: string;
  created_at: string;
  prompt_template: string;
  is_active: boolean;
}

export interface CommonsAnswer {
  id: string;
  conversation_id: string;
  profile_id: string;
  answer_text: string;
  created_at: string;
}

export interface CompatibilityScore {
  id: string;
  profile_id_1: string;
  profile_id_2: string;
  score: number;
  flame_tier: FlameTier;
  computed_at: string;
  score_breakdown: Json | null;
}

export interface SparkCreditBalance {
  profile_id: string;
  balance: number;
  updated_at: string;
}

export interface SparkCreditTransaction {
  id: string;
  profile_id: string;
  created_at: string;
  transaction_type: CreditTransactionType;
  amount: number;
  description: string | null;
  reference_id: string | null;
}

export interface PremiumUnlock {
  id: string;
  profile_id: string;
  purchased_at: string;
  platform: "ios" | "android" | "web";
  receipt_data: string | null;
  is_valid: boolean;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  created_at: string;
  reason: ReportReason;
  details: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
}

// ---------------------------------------------------------------------------
// Supabase Database schema type (for createClient<Database>)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> &
          Partial<Pick<Profile, "created_at" | "updated_at">>;
        Update: Partial<Omit<Profile, "id">>;
      };
      profile_photos: {
        Row: ProfilePhoto;
        Insert: Omit<ProfilePhoto, "id" | "created_at"> &
          Partial<Pick<ProfilePhoto, "id" | "created_at">>;
        Update: Partial<Omit<ProfilePhoto, "id" | "profile_id">>;
      };
      prompt_templates: {
        Row: PromptTemplate;
        Insert: Omit<PromptTemplate, "id" | "created_at"> &
          Partial<Pick<PromptTemplate, "id" | "created_at">>;
        Update: Partial<Omit<PromptTemplate, "id">>;
      };
      profile_prompts: {
        Row: ProfilePrompt;
        Insert: Omit<ProfilePrompt, "id" | "created_at" | "updated_at"> &
          Partial<Pick<ProfilePrompt, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<ProfilePrompt, "id" | "profile_id">>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, "id" | "updated_at"> &
          Partial<Pick<UserPreferences, "id" | "updated_at">>;
        Update: Partial<Omit<UserPreferences, "id" | "profile_id">>;
      };
      likes: {
        Row: Like;
        Insert: Omit<Like, "id" | "created_at"> &
          Partial<Pick<Like, "id" | "created_at">>;
        Update: never;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, "id" | "created_at" | "updated_at"> &
          Partial<Pick<Match, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Match, "id" | "profile_id_1" | "profile_id_2">>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, "id" | "created_at" | "updated_at"> &
          Partial<Pick<Conversation, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Conversation, "id" | "match_id">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at"> &
          Partial<Pick<Message, "id" | "created_at">>;
        Update: Partial<Pick<Message, "body" | "edited_at" | "is_deleted">>;
      };
      commons_prompts: {
        Row: CommonsPrompt;
        Insert: Omit<CommonsPrompt, "id" | "created_at"> &
          Partial<Pick<CommonsPrompt, "id" | "created_at">>;
        Update: Partial<Omit<CommonsPrompt, "id">>;
      };
      commons_answers: {
        Row: CommonsAnswer;
        Insert: Omit<CommonsAnswer, "id" | "created_at"> &
          Partial<Pick<CommonsAnswer, "id" | "created_at">>;
        Update: never;
      };
      compatibility_scores: {
        Row: CompatibilityScore;
        Insert: Omit<CompatibilityScore, "id" | "computed_at"> &
          Partial<Pick<CompatibilityScore, "id" | "computed_at">>;
        Update: Partial<
          Omit<CompatibilityScore, "id" | "profile_id_1" | "profile_id_2">
        >;
      };
      spark_credit_balances: {
        Row: SparkCreditBalance;
        Insert: Partial<SparkCreditBalance>;
        Update: Partial<Omit<SparkCreditBalance, "profile_id">>;
      };
      spark_credit_transactions: {
        Row: SparkCreditTransaction;
        Insert: Omit<SparkCreditTransaction, "id" | "created_at"> &
          Partial<Pick<SparkCreditTransaction, "id" | "created_at">>;
        Update: never;
      };
      premium_unlocks: {
        Row: PremiumUnlock;
        Insert: Omit<PremiumUnlock, "id" | "purchased_at"> &
          Partial<Pick<PremiumUnlock, "id" | "purchased_at">>;
        Update: Partial<Pick<PremiumUnlock, "is_valid">>;
      };
      blocks: {
        Row: Block;
        Insert: Omit<Block, "id" | "created_at"> &
          Partial<Pick<Block, "id" | "created_at">>;
        Update: never;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at"> &
          Partial<Pick<Report, "id" | "created_at">>;
        Update: Partial<Pick<Report, "reviewed" | "reviewed_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_match: {
        Args: {
          p_a: string;
          p_b: string;
          p_score: number;
          p_first_mover?: string | null;
        };
        Returns: string;
      };
      auth_profile_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      gender: Gender;
      sexual_orientation: SexualOrientation;
      relationship_goal: RelationshipGoal;
      monogamy_preference: MonogamyPreference;
      faith_tradition: FaithTradition;
      preference_importance: PreferenceImportance;
      politics_spectrum: PoliticsSpectrum;
      flame_tier: FlameTier;
      match_mode: MatchMode;
      like_type: LikeType;
      credit_transaction_type: CreditTransactionType;
      report_reason: ReportReason;
    };
  };
}
