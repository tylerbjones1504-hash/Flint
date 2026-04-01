-- ============================================================
-- Flint Dating App — Initial Schema
-- Migration: 001 — Core profiles, photos, preferences
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for future ML embeddings
CREATE EXTENSION IF NOT EXISTS "cube";          -- required by earthdistance
CREATE EXTENSION IF NOT EXISTS "earthdistance"; -- ll_to_earth() for geo distance queries

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE gender AS ENUM (
  'man',
  'woman',
  'non_binary',
  'other',
  'prefer_not_to_say'
);

CREATE TYPE sexual_orientation AS ENUM (
  'straight',
  'gay',
  'lesbian',
  'bisexual',
  'pansexual',
  'asexual',
  'queer',
  'other',
  'prefer_not_to_say'
);

CREATE TYPE relationship_goal AS ENUM (
  'serious',
  'casual',
  'open',
  'not_sure'
);

CREATE TYPE monogamy_preference AS ENUM (
  'strictly_monogamous',
  'open_to_discussing',
  'non_monogamous'
);

CREATE TYPE faith_tradition AS ENUM (
  'not_religious',
  'spiritual_not_religious',
  'christian',
  'jewish',
  'muslim',
  'hindu',
  'buddhist',
  'other'
);

CREATE TYPE preference_importance AS ENUM (
  'dealbreaker',
  'important',
  'not_important'
);

CREATE TYPE politics_spectrum AS ENUM (
  'very_liberal',
  'liberal',
  'moderate',
  'conservative',
  'very_conservative',
  'prefer_not_to_say'
);

CREATE TYPE flame_tier AS ENUM (
  'ash',     -- 0–30%
  'smoke',   -- 31–50%
  'ember',   -- 51–68%
  'blaze',   -- 69–84%
  'strike'   -- 85%+
);

CREATE TYPE match_mode AS ENUM (
  'spark'   -- primary launch mode; 'depth' and 'signal' reserved for future
);

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Basic info (required at onboarding)
  display_name          TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 50),
  birth_date            DATE NOT NULL,
  gender                gender NOT NULL,
  sexual_orientation    sexual_orientation NOT NULL,
  relationship_goal     relationship_goal NOT NULL,

  -- Faith
  faith                 faith_tradition NOT NULL DEFAULT 'not_religious',
  faith_importance      preference_importance NOT NULL DEFAULT 'not_important',

  -- Politics
  politics              politics_spectrum NOT NULL DEFAULT 'prefer_not_to_say',

  -- Monogamy
  monogamy_preference   monogamy_preference NOT NULL DEFAULT 'strictly_monogamous',

  -- Optional profile fields
  school                TEXT,
  job_title             TEXT,
  company               TEXT,
  bio                   TEXT CHECK (char_length(bio) <= 500),
  location_city         TEXT,
  location_state        TEXT,
  location_country      TEXT DEFAULT 'US',
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,

  -- Matching mode preference
  match_mode            match_mode NOT NULL DEFAULT 'spark',

  -- Relationship mode — when active, profile is hidden from discovery
  relationship_mode_active  BOOLEAN NOT NULL DEFAULT FALSE,
  relationship_mode_with    UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Account status
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at        TIMESTAMPTZ,

  -- Computed age guard: must be 18+
  CONSTRAINT age_18_plus CHECK (
    (CURRENT_DATE - birth_date) / 365.25 >= 18
  )
);

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROFILE PHOTOS
-- ============================================================

CREATE TABLE profile_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  storage_path    TEXT NOT NULL,         -- path in Supabase Storage bucket "profile-photos"
  display_order   SMALLINT NOT NULL DEFAULT 0,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  width           INTEGER,
  height          INTEGER,

  CONSTRAINT valid_order CHECK (display_order BETWEEN 0 AND 7),
  UNIQUE (profile_id, display_order)
);

-- Enforce min 3 / max 8 photos via trigger
CREATE OR REPLACE FUNCTION enforce_photo_limits()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO photo_count
  FROM profile_photos
  WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id);

  IF TG_OP = 'DELETE' THEN
    -- After deletion, count will be photo_count - 1; let profile mark incomplete if < 3
    RETURN OLD;
  END IF;

  IF photo_count >= 8 THEN
    RAISE EXCEPTION 'Maximum 8 photos allowed per profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_photos_limit
  BEFORE INSERT ON profile_photos
  FOR EACH ROW EXECUTE FUNCTION enforce_photo_limits();

-- Ensure only one primary photo per profile
CREATE OR REPLACE FUNCTION enforce_single_primary_photo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE profile_photos
    SET is_primary = FALSE
    WHERE profile_id = NEW.profile_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER single_primary_photo
  BEFORE INSERT OR UPDATE ON profile_photos
  FOR EACH ROW EXECUTE FUNCTION enforce_single_primary_photo();

-- ============================================================
-- PROFILE PROMPTS
-- ============================================================

CREATE TABLE prompt_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prompt_text TEXT NOT NULL UNIQUE,
  is_flint_branded BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = Flint original, FALSE = standard
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE profile_prompts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
  prompt_text     TEXT NOT NULL CHECK (char_length(prompt_text) BETWEEN 1 AND 150),
  answer_text     TEXT NOT NULL CHECK (char_length(answer_text) BETWEEN 1 AND 300),
  display_order   SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_prompt_order CHECK (display_order BETWEEN 0 AND 2),
  UNIQUE (profile_id, display_order)
);

CREATE TRIGGER profile_prompts_updated_at
  BEFORE UPDATE ON profile_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Max 3 prompts per profile
CREATE OR REPLACE FUNCTION enforce_prompt_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prompt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO prompt_count
  FROM profile_prompts
  WHERE profile_id = NEW.profile_id;

  IF prompt_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 prompts allowed per profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_prompts_limit
  BEFORE INSERT ON profile_prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_prompt_limit();

-- ============================================================
-- USER PREFERENCES (for scoring and filtering)
-- ============================================================

CREATE TABLE user_preferences (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Age range
  preferred_age_min       SMALLINT NOT NULL DEFAULT 18 CHECK (preferred_age_min >= 18),
  preferred_age_max       SMALLINT NOT NULL DEFAULT 35 CHECK (preferred_age_max <= 100),

  -- Distance
  max_distance_km         SMALLINT NOT NULL DEFAULT 50 CHECK (max_distance_km BETWEEN 1 AND 500),

  -- Gender preferences (array — supports all orientations)
  preferred_genders       gender[] NOT NULL DEFAULT '{}',

  -- Dealbreakers (hard filters run before scoring)
  dealbreaker_goals       relationship_goal[] NOT NULL DEFAULT '{}',
  dealbreaker_faith       faith_tradition[] NOT NULL DEFAULT '{}',
  dealbreaker_monogamy    monogamy_preference[] NOT NULL DEFAULT '{}',
  dealbreaker_politics    politics_spectrum[] NOT NULL DEFAULT '{}',

  -- Scoring weights (0–100, sum doesn't need to equal 100 — normalized in app)
  weight_faith            SMALLINT NOT NULL DEFAULT 20 CHECK (weight_faith BETWEEN 0 AND 100),
  weight_politics         SMALLINT NOT NULL DEFAULT 20 CHECK (weight_politics BETWEEN 0 AND 100),
  weight_relationship_goal SMALLINT NOT NULL DEFAULT 30 CHECK (weight_relationship_goal BETWEEN 0 AND 100),
  weight_monogamy         SMALLINT NOT NULL DEFAULT 15 CHECK (weight_monogamy BETWEEN 0 AND 100),
  weight_lifestyle        SMALLINT NOT NULL DEFAULT 15 CHECK (weight_lifestyle BETWEEN 0 AND 100),

  CONSTRAINT valid_age_range CHECK (preferred_age_min <= preferred_age_max)
);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX profiles_location ON profiles USING GIST (
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX profiles_active ON profiles (is_active, relationship_mode_active, last_active_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX profile_photos_profile ON profile_photos (profile_id, display_order);
CREATE INDEX profile_prompts_profile ON profile_prompts (profile_id, display_order);
CREATE INDEX user_preferences_profile ON user_preferences (profile_id);
