-- ============================================================
-- Flint — Product alignment migration
-- Faith taxonomy v2, remove monogamy, nudge column rename,
-- Flint premium table rename, likes/photo guards, scoring prefs
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. Faith: new enum + migrate profiles + user_preferences
-- ---------------------------------------------------------------------------

CREATE TYPE faith_tradition_new AS ENUM (
  'not_religious',
  'spiritual',
  'christian',
  'muslim',
  'jewish',
  'hindu',
  'buddhist'
);

ALTER TABLE profiles ADD COLUMN faith_new faith_tradition_new;

UPDATE profiles SET faith_new = (
  CASE faith::text
    WHEN 'not_religious' THEN 'not_religious'::faith_tradition_new
    WHEN 'spiritual_not_religious' THEN 'spiritual'::faith_tradition_new
    WHEN 'christian' THEN 'christian'::faith_tradition_new
    WHEN 'jewish' THEN 'jewish'::faith_tradition_new
    WHEN 'muslim' THEN 'muslim'::faith_tradition_new
    WHEN 'hindu' THEN 'hindu'::faith_tradition_new
    WHEN 'buddhist' THEN 'buddhist'::faith_tradition_new
    WHEN 'other' THEN 'spiritual'::faith_tradition_new
    ELSE 'not_religious'::faith_tradition_new
  END
);

ALTER TABLE profiles DROP COLUMN faith;
ALTER TABLE profiles RENAME COLUMN faith_new TO faith;
ALTER TABLE profiles ALTER COLUMN faith SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN faith SET DEFAULT 'not_religious'::faith_tradition_new;

ALTER TABLE user_preferences ADD COLUMN dealbreaker_faith_new faith_tradition_new[] NOT NULL DEFAULT '{}';

UPDATE user_preferences SET dealbreaker_faith_new = COALESCE(
  ARRAY(
    SELECT (
      CASE elem::text
        WHEN 'not_religious' THEN 'not_religious'
        WHEN 'spiritual_not_religious' THEN 'spiritual'
        WHEN 'christian' THEN 'christian'
        WHEN 'jewish' THEN 'jewish'
        WHEN 'muslim' THEN 'muslim'
        WHEN 'hindu' THEN 'hindu'
        WHEN 'buddhist' THEN 'buddhist'
        WHEN 'other' THEN 'spiritual'
        ELSE 'not_religious'
      END
    )::faith_tradition_new
    FROM unnest(dealbreaker_faith) AS elem
  ),
  '{}'::faith_tradition_new[]
);

ALTER TABLE user_preferences DROP COLUMN dealbreaker_faith;
ALTER TABLE user_preferences RENAME COLUMN dealbreaker_faith_new TO dealbreaker_faith;

DROP TYPE faith_tradition;
ALTER TYPE faith_tradition_new RENAME TO faith_tradition;

-- Optional denomination / subgroup (app-validated; reference table in phase 2)
ALTER TABLE profiles ADD COLUMN faith_subgroup TEXT CHECK (
  faith_subgroup IS NULL OR char_length(faith_subgroup) <= 80
);

COMMENT ON COLUMN profiles.faith_subgroup IS 'Optional faith subgroup; validated in app. Conditional lists by faith — see docs.';

-- ---------------------------------------------------------------------------
-- 2. Remove monogamy
-- ---------------------------------------------------------------------------

ALTER TABLE profiles DROP COLUMN monogamy_preference;

ALTER TABLE user_preferences DROP COLUMN dealbreaker_monogamy;
ALTER TABLE user_preferences DROP COLUMN weight_monogamy;

DROP TYPE monogamy_preference;

-- Placeholder for future values/personality embedding + distance in scoring
ALTER TABLE user_preferences
  ADD COLUMN weight_values SMALLINT NOT NULL DEFAULT 10
    CHECK (weight_values BETWEEN 0 AND 100);

ALTER TABLE user_preferences
  ADD COLUMN weight_distance SMALLINT NOT NULL DEFAULT 10
    CHECK (weight_distance BETWEEN 0 AND 100);

ALTER TABLE user_preferences
  ALTER COLUMN weight_lifestyle SET DEFAULT 10;

UPDATE user_preferences SET weight_lifestyle = 10 WHERE weight_lifestyle = 15;

COMMENT ON COLUMN user_preferences.weight_values IS 'Reserved for future values/personality scoring; neutral midpoint until populated.';
COMMENT ON COLUMN user_preferences.weight_distance IS 'Weight for haversine distance component in app-side scoring.';

-- ---------------------------------------------------------------------------
-- 3. Matches: nudged profile (UI hint only — not a send gate)
-- ---------------------------------------------------------------------------

ALTER TABLE matches RENAME COLUMN first_mover_id TO nudged_profile_id;

COMMENT ON COLUMN matches.nudged_profile_id IS 'Who gets the primary in-app nudge (e.g. same-sex: first liker). NULL means both nudged or either may message first.';

CREATE OR REPLACE FUNCTION create_match(
  p_a UUID,
  p_b UUID,
  p_score SMALLINT,
  p_nudged_profile UUID DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id1       UUID;
  v_id2       UUID;
  v_tier      flame_tier;
  v_match_id  UUID;
BEGIN
  IF p_a < p_b THEN
    v_id1 := p_a; v_id2 := p_b;
  ELSE
    v_id1 := p_b; v_id2 := p_a;
  END IF;

  v_tier := CASE
    WHEN p_score >= 85 THEN 'strike'::flame_tier
    WHEN p_score >= 69 THEN 'blaze'::flame_tier
    WHEN p_score >= 51 THEN 'ember'::flame_tier
    WHEN p_score >= 31 THEN 'smoke'::flame_tier
    ELSE 'ash'::flame_tier
  END;

  INSERT INTO matches (profile_id_1, profile_id_2, compatibility_score, flame_tier, nudged_profile_id)
  VALUES (v_id1, v_id2, p_score, v_tier, p_nudged_profile)
  RETURNING id INTO v_match_id;

  RETURN v_match_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Premium table — Flint naming
-- ---------------------------------------------------------------------------

ALTER TABLE premium_unlocks RENAME TO flint_premium_unlocks;

ALTER INDEX premium_unlocks_profile RENAME TO flint_premium_unlocks_profile;

COMMENT ON TABLE flint_premium_unlocks IS 'Validated Flint Premium / subscription unlock rows (receipt-backed).';

-- ---------------------------------------------------------------------------
-- 5. Likes: no self-like
-- ---------------------------------------------------------------------------

ALTER TABLE likes ADD CONSTRAINT likes_no_self_like CHECK (actor_id <> target_id);

-- ---------------------------------------------------------------------------
-- 6. Profile photos: minimum 3 (cannot delete below)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_min_three_photos_on_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) - 1 INTO remaining
  FROM profile_photos
  WHERE profile_id = OLD.profile_id;

  IF remaining < 3 THEN
    RAISE EXCEPTION 'Profiles must keep at least 3 photos';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER profile_photos_min_three
  BEFORE DELETE ON profile_photos
  FOR EACH ROW EXECUTE FUNCTION enforce_min_three_photos_on_delete();
