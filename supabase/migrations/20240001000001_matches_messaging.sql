-- ============================================================
-- Flint Dating App
-- Migration: 002 — Matches, likes, messaging, commons, credits
-- ============================================================

-- ============================================================
-- LIKES / PASSES
-- ============================================================

CREATE TYPE like_type AS ENUM (
  'like',     -- standard like (on a photo or prompt)
  'pass'      -- explicit pass
);

CREATE TABLE likes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  like_type     like_type NOT NULL,
  liked_on      TEXT,   -- what they liked: 'photo:<photo_id>' or 'prompt:<prompt_id>'

  UNIQUE (actor_id, target_id)
);

CREATE INDEX likes_actor ON likes (actor_id, created_at DESC);
CREATE INDEX likes_target ON likes (target_id, created_at DESC);

-- ============================================================
-- MATCHES
-- ============================================================

CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- profile_id_1 is always the lower UUID (canonical ordering)
  profile_id_1    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id_2    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Compatibility score at time of match (0–100)
  compatibility_score SMALLINT NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
  flame_tier          flame_tier NOT NULL,

  -- Who can message first: 'profile_1', 'profile_2', or 'either'
  -- In het (man/woman) matches: man_id is set; in same-sex: first_liker_id drives nudge
  first_mover_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Messaging state
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  unmatched_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unmatched_at    TIMESTAMPTZ,

  -- Relationship mode
  relationship_mode_requested_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  relationship_mode_active        BOOLEAN NOT NULL DEFAULT FALSE,
  relationship_mode_activated_at  TIMESTAMPTZ,

  UNIQUE (profile_id_1, profile_id_2),

  CONSTRAINT ordered_profiles CHECK (profile_id_1 < profile_id_2),
  CONSTRAINT unmatch_integrity CHECK (
    (unmatched_by IS NULL AND unmatched_at IS NULL) OR
    (unmatched_by IS NOT NULL AND unmatched_at IS NOT NULL)
  )
);

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX matches_profile_1 ON matches (profile_id_1, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX matches_profile_2 ON matches (profile_id_2, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX matches_flame_tier ON matches (flame_tier) WHERE is_active = TRUE;

-- Helper: create a match ensuring canonical (lower-UUID-first) ordering
CREATE OR REPLACE FUNCTION create_match(
  p_a UUID,
  p_b UUID,
  p_score SMALLINT,
  p_first_mover UUID DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id1       UUID;
  v_id2       UUID;
  v_tier      flame_tier;
  v_match_id  UUID;
BEGIN
  -- Canonical ordering
  IF p_a < p_b THEN
    v_id1 := p_a; v_id2 := p_b;
  ELSE
    v_id1 := p_b; v_id2 := p_a;
  END IF;

  -- Assign flame tier
  v_tier := CASE
    WHEN p_score >= 85 THEN 'strike'::flame_tier
    WHEN p_score >= 69 THEN 'blaze'::flame_tier
    WHEN p_score >= 51 THEN 'ember'::flame_tier
    WHEN p_score >= 31 THEN 'smoke'::flame_tier
    ELSE 'ash'::flame_tier
  END;

  INSERT INTO matches (profile_id_1, profile_id_2, compatibility_score, flame_tier, first_mover_id)
  VALUES (v_id1, v_id2, p_score, v_tier, p_first_mover)
  RETURNING id INTO v_match_id;

  RETURN v_match_id;
END;
$$;

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  -- Commons icebreaker state
  commons_prompt_id   UUID,   -- FK added after commons_prompts table exists
  commons_answered_1  BOOLEAN NOT NULL DEFAULT FALSE,  -- profile_id_1 answered
  commons_answered_2  BOOLEAN NOT NULL DEFAULT FALSE,  -- profile_id_2 answered
  commons_revealed    BOOLEAN NOT NULL DEFAULT FALSE   -- both answered → reveal
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at       TIMESTAMPTZ,
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  is_priority     BOOLEAN NOT NULL DEFAULT FALSE  -- "priority message" feature (costs a Spark Credit)
);

CREATE INDEX messages_conversation ON messages (conversation_id, created_at ASC);
CREATE INDEX messages_sender ON messages (sender_id, created_at DESC);

-- ============================================================
-- COMMONS (shared icebreaker feature)
-- ============================================================

CREATE TABLE commons_prompts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Template with {shared_value} placeholder — filled dynamically from match overlap
  prompt_template TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE commons_answers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_text         TEXT NOT NULL CHECK (char_length(answer_text) BETWEEN 1 AND 300),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (conversation_id, profile_id)
);

-- Add FK now that commons_prompts exists
ALTER TABLE conversations
  ADD CONSTRAINT conversations_commons_prompt_fk
  FOREIGN KEY (commons_prompt_id)
  REFERENCES commons_prompts(id)
  ON DELETE SET NULL;

-- Trigger: auto-reveal commons when both have answered
CREATE OR REPLACE FUNCTION maybe_reveal_commons()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_conv conversations%ROWTYPE;
  v_match matches%ROWTYPE;
  v_answered_1 BOOLEAN;
  v_answered_2 BOOLEAN;
BEGIN
  SELECT * INTO v_conv FROM conversations WHERE id = NEW.conversation_id;
  SELECT * INTO v_match FROM matches WHERE id = v_conv.match_id;

  -- Check if this answer is from profile_1 or profile_2
  IF NEW.profile_id = v_match.profile_id_1 THEN
    v_answered_1 := TRUE;
    v_answered_2 := v_conv.commons_answered_2;
  ELSE
    v_answered_1 := v_conv.commons_answered_1;
    v_answered_2 := TRUE;
  END IF;

  UPDATE conversations SET
    commons_answered_1 = v_answered_1,
    commons_answered_2 = v_answered_2,
    commons_revealed   = (v_answered_1 AND v_answered_2)
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER commons_auto_reveal
  AFTER INSERT ON commons_answers
  FOR EACH ROW EXECUTE FUNCTION maybe_reveal_commons();

-- ============================================================
-- COMPATIBILITY SCORES (cached, recomputed periodically)
-- ============================================================

CREATE TABLE compatibility_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id_1    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id_2    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  flame_tier      flame_tier NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score_breakdown JSONB,   -- natural-language breakdown stored as JSON for the app

  UNIQUE (profile_id_1, profile_id_2),
  CONSTRAINT ordered_score_profiles CHECK (profile_id_1 < profile_id_2)
);

CREATE INDEX compat_scores_profile1 ON compatibility_scores (profile_id_1, score DESC);
CREATE INDEX compat_scores_profile2 ON compatibility_scores (profile_id_2, score DESC);

-- ============================================================
-- SPARK CREDITS
-- ============================================================

CREATE TYPE credit_transaction_type AS ENUM (
  'purchase',
  'spend_priority_message',
  'spend_reopen_passed',
  'spend_compat_deep_dive',
  'refund',
  'promo'
);

CREATE TABLE spark_credit_balances (
  profile_id  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance     INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spark_credit_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_type credit_transaction_type NOT NULL,
  amount          INTEGER NOT NULL,   -- positive = credit, negative = debit
  description     TEXT,
  reference_id    UUID   -- e.g. message_id, match_id, etc.
);

CREATE INDEX credit_tx_profile ON spark_credit_transactions (profile_id, created_at DESC);

-- Trigger: keep balance in sync
CREATE OR REPLACE FUNCTION sync_spark_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  INSERT INTO spark_credit_balances (profile_id, balance)
  VALUES (NEW.profile_id, 0)
  ON CONFLICT (profile_id) DO NOTHING;

  UPDATE spark_credit_balances
  SET balance    = balance + NEW.amount,
      updated_at = NOW()
  WHERE profile_id = NEW.profile_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient Spark Credits';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_spark_credit_balance
  AFTER INSERT ON spark_credit_transactions
  FOR EACH ROW EXECUTE FUNCTION sync_spark_balance();

-- ============================================================
-- PREMIUM UNLOCK (one-time device-locked purchase)
-- ============================================================

CREATE TABLE premium_unlocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  receipt_data    TEXT,   -- platform receipt for server-side validation
  is_valid        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX premium_unlocks_profile ON premium_unlocks (profile_id) WHERE is_valid = TRUE;

-- ============================================================
-- SAFETY: BLOCKS & REPORTS
-- ============================================================

CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

CREATE INDEX blocks_blocker ON blocks (blocker_id);
CREATE INDEX blocks_blocked ON blocks (blocked_id);

CREATE TYPE report_reason AS ENUM (
  'inappropriate_photos',
  'harassment',
  'spam',
  'fake_profile',
  'underage',
  'other'
);

CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason          report_reason NOT NULL,
  details         TEXT CHECK (char_length(details) <= 500),
  reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at     TIMESTAMPTZ,

  CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

CREATE INDEX reports_reviewed ON reports (reviewed, created_at DESC) WHERE reviewed = FALSE;
