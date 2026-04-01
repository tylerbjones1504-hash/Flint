-- ============================================================
-- Flint Dating App
-- Migration: 003 — Row Level Security (RLS) Policies
-- ============================================================

-- ============================================================
-- HELPER: get the calling user's profile id
-- ============================================================
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT id FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active, non-hidden profiles
CREATE POLICY "profiles: read active"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    AND relationship_mode_active = FALSE
    AND id != auth.uid()
    -- exclude users who have blocked the viewer or been blocked by the viewer
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = profiles.id)
         OR (blocker_id = profiles.id AND blocked_id = auth.uid())
    )
  );

-- Each user can always read their own profile (even if hidden)
CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can only insert their own profile row
CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- PROFILE PHOTOS
-- ============================================================
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos: read for visible profiles"
  ON profile_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_photos.profile_id
        AND (
          p.id = auth.uid()
          OR (
            p.is_active = TRUE
            AND p.relationship_mode_active = FALSE
            AND NOT EXISTS (
              SELECT 1 FROM blocks b
              WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
                 OR (b.blocker_id = p.id AND b.blocked_id = auth.uid())
            )
          )
        )
    )
  );

CREATE POLICY "photos: manage own"
  ON profile_photos FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- PROFILE PROMPTS
-- ============================================================
ALTER TABLE profile_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompts: read for visible profiles"
  ON profile_prompts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_prompts.profile_id
        AND (
          p.id = auth.uid()
          OR (
            p.is_active = TRUE
            AND p.relationship_mode_active = FALSE
            AND NOT EXISTS (
              SELECT 1 FROM blocks b
              WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
                 OR (b.blocker_id = p.id AND b.blocked_id = auth.uid())
            )
          )
        )
    )
  );

CREATE POLICY "prompts: manage own"
  ON profile_prompts FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- PROMPT TEMPLATES
-- ============================================================
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active prompt templates
CREATE POLICY "prompt templates: read active"
  ON prompt_templates FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences: manage own"
  ON user_preferences FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- LIKES
-- ============================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Users can insert their own likes/passes
CREATE POLICY "likes: insert own"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Users can read likes they sent or received (for match detection)
CREATE POLICY "likes: read own"
  ON likes FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid() OR target_id = auth.uid());

-- ============================================================
-- MATCHES
-- ============================================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can read their own matches
CREATE POLICY "matches: read own"
  ON matches FOR SELECT
  TO authenticated
  USING (
    (profile_id_1 = auth.uid() OR profile_id_2 = auth.uid())
    AND is_active = TRUE
  );

-- Only the system (service role) creates matches via create_match()
-- Authenticated users can update (unmatch, relationship mode) their own matches
CREATE POLICY "matches: update own"
  ON matches FOR UPDATE
  TO authenticated
  USING (profile_id_1 = auth.uid() OR profile_id_2 = auth.uid())
  WITH CHECK (profile_id_1 = auth.uid() OR profile_id_2 = auth.uid());

-- ============================================================
-- CONVERSATIONS
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: read own"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = conversations.match_id
        AND (m.profile_id_1 = auth.uid() OR m.profile_id_2 = auth.uid())
        AND m.is_active = TRUE
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: read in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
        AND (m.profile_id_1 = auth.uid() OR m.profile_id_2 = auth.uid())
        AND m.is_active = TRUE
    )
  );

-- Only senders can insert messages
CREATE POLICY "messages: insert own"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
        AND (m.profile_id_1 = auth.uid() OR m.profile_id_2 = auth.uid())
        AND m.is_active = TRUE
    )
  );

-- Senders can soft-delete their own messages
CREATE POLICY "messages: delete own"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- COMMONS ANSWERS
-- ============================================================
ALTER TABLE commons_answers ENABLE ROW LEVEL SECURITY;

-- Only your own answer before reveal; both answers after reveal
CREATE POLICY "commons answers: read"
  ON commons_answers FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = commons_answers.conversation_id
        AND c.commons_revealed = TRUE
        AND EXISTS (
          SELECT 1 FROM matches m
          WHERE m.id = c.match_id
            AND (m.profile_id_1 = auth.uid() OR m.profile_id_2 = auth.uid())
        )
    )
  );

CREATE POLICY "commons answers: insert own"
  ON commons_answers FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- COMMONS PROMPTS
-- ============================================================
ALTER TABLE commons_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commons prompts: read active"
  ON commons_prompts FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ============================================================
-- COMPATIBILITY SCORES
-- ============================================================
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;

-- Users can only see their own compatibility scores
CREATE POLICY "compat scores: read own"
  ON compatibility_scores FOR SELECT
  TO authenticated
  USING (profile_id_1 = auth.uid() OR profile_id_2 = auth.uid());

-- ============================================================
-- SPARK CREDITS
-- ============================================================
ALTER TABLE spark_credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits balance: read own"
  ON spark_credit_balances FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

ALTER TABLE spark_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit transactions: read own"
  ON spark_credit_transactions FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================
-- PREMIUM UNLOCKS
-- ============================================================
ALTER TABLE premium_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium: read own"
  ON premium_unlocks FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================
-- BLOCKS
-- ============================================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks: manage own"
  ON blocks FOR ALL
  TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

-- ============================================================
-- REPORTS
-- ============================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports: insert own"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports: read own"
  ON reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());
