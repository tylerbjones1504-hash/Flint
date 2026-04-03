-- ============================================================
-- Faith subgroups (reference data) + optional profile FK
-- Replaces free-text faith_subgroup; enforced via trigger vs profiles.faith
-- ============================================================

CREATE TABLE faith_subgroups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parent_faith    faith_tradition NOT NULL,
  slug            TEXT NOT NULL,
  label           TEXT NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT faith_subgroups_parent_slug UNIQUE (parent_faith, slug)
);

CREATE INDEX faith_subgroups_parent_sort ON faith_subgroups (parent_faith, sort_order);

COMMENT ON TABLE faith_subgroups IS 'Optional denomination/subgroup per top-level faith; app shows conditional lists.';

ALTER TABLE faith_subgroups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faith_subgroups: read active"
  ON faith_subgroups FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ---------------------------------------------------------------------------
-- Profiles: FK to subgroup (nullable); drop legacy text column from 004
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN faith_subgroup_id UUID
  REFERENCES faith_subgroups(id) ON DELETE SET NULL;

ALTER TABLE profiles DROP COLUMN IF EXISTS faith_subgroup;

CREATE OR REPLACE FUNCTION enforce_faith_subgroup_matches_parent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.faith_subgroup_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM faith_subgroups fs
      WHERE fs.id = NEW.faith_subgroup_id
        AND fs.parent_faith = NEW.faith
        AND fs.is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'faith_subgroup_id must reference an active subgroup for this profile faith';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_faith_subgroup_check
  BEFORE INSERT OR UPDATE OF faith, faith_subgroup_id ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_faith_subgroup_matches_parent();

-- ---------------------------------------------------------------------------
-- Seed subgroups (Christian full; others lighter — expand anytime)
-- ---------------------------------------------------------------------------

INSERT INTO faith_subgroups (parent_faith, slug, label, sort_order) VALUES
-- Christian
('christian', 'catholic', 'Catholic', 1),
('christian', 'baptist', 'Baptist', 2),
('christian', 'methodist', 'Methodist', 3),
('christian', 'presbyterian', 'Presbyterian', 4),
('christian', 'lutheran', 'Lutheran', 5),
('christian', 'orthodox', 'Orthodox', 6),
('christian', 'nondenominational', 'Non-denominational', 7),

-- Muslim
('muslim', 'sunni', 'Sunni', 1),
('muslim', 'shia', 'Shia', 2),
('muslim', 'sufi', 'Sufi', 3),
('muslim', 'ahmadiyya', 'Ahmadiyya', 4),
('muslim', 'ibadi', 'Ibadi', 5),
('muslim', 'quranist', 'Quranist', 6),
('muslim', 'other', 'Other / prefer not to say', 7),

-- Jewish
('jewish', 'orthodox_jewish', 'Orthodox', 1),
('jewish', 'conservative', 'Conservative', 2),
('jewish', 'reform', 'Reform', 3),
('jewish', 'reconstructionist', 'Reconstructionist', 4),
('jewish', 'hasidic', 'Hasidic', 5),
('jewish', 'secular_jewish', 'Secular Jewish', 6),
('jewish', 'other_jewish', 'Other / prefer not to say', 7),

-- Hindu (lighter set)
('hindu', 'vaishnavism', 'Vaishnavism', 1),
('hindu', 'shaivism', 'Shaivism', 2),
('hindu', 'shaktism', 'Shaktism', 3),
('hindu', 'smartism', 'Smartism', 4),
('hindu', 'other_hindu', 'Other / prefer not to say', 5),

-- Buddhist
('buddhist', 'theravada', 'Theravada', 1),
('buddhist', 'mahayana', 'Mahayana', 2),
('buddhist', 'vajrayana', 'Vajrayana', 3),
('buddhist', 'zen', 'Zen', 4),
('buddhist', 'other_buddhist', 'Other / prefer not to say', 5),

-- Spiritual
('spiritual', 'eclectic', 'Eclectic / personal', 1),
('spiritual', 'earth_based', 'Earth-based / nature', 2),
('spiritual', 'other_spiritual', 'Other / prefer not to say', 3);
