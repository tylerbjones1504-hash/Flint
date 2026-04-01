import type {
  FlameTier,
  FaithTradition,
  PoliticsSpectrum,
  RelationshipGoal,
  MonogamyPreference,
  PreferenceImportance,
  UserPreferences,
  Profile,
} from "../types/database";

// ---------------------------------------------------------------------------
// Flame Tier thresholds
// ---------------------------------------------------------------------------
export const FLAME_TIER_THRESHOLDS: Record<FlameTier, [number, number]> = {
  ash: [0, 30],
  smoke: [31, 50],
  ember: [51, 68],
  blaze: [69, 84],
  strike: [85, 100],
};

export const FLAME_TIER_LABELS: Record<FlameTier, string> = {
  ash: "Not your usual type",
  smoke: "Some common ground",
  ember: "Real overlap",
  blaze: "Strongly aligned",
  strike: "Rare kind of connection",
};

export function scoresToTier(score: number): FlameTier {
  if (score >= 85) return "strike";
  if (score >= 69) return "blaze";
  if (score >= 51) return "ember";
  if (score >= 31) return "smoke";
  return "ash";
}

// ---------------------------------------------------------------------------
// Rules-based compatibility scoring
// Weights are sourced from UserPreferences.weight_* fields.
// Phase 2: replace/augment with pgvector embeddings.
// ---------------------------------------------------------------------------

interface ScoringContext {
  viewer: Profile;
  viewerPrefs: UserPreferences;
  candidate: Profile;
}

/**
 * Returns a compatibility score 0–100 between the viewer and a candidate.
 * Returns null if the candidate fails a hard dealbreaker filter.
 */
export function computeCompatibilityScore(
  ctx: ScoringContext
): number | null {
  const { viewer, viewerPrefs, candidate } = ctx;

  // ------------------------------------------------------------------
  // 1. Hard dealbreaker filters (run first — if any fail, return null)
  // ------------------------------------------------------------------

  // Relationship goal dealbreaker
  if (
    viewerPrefs.dealbreaker_goals.length > 0 &&
    viewerPrefs.dealbreaker_goals.includes(candidate.relationship_goal)
  ) {
    return null;
  }

  // Faith dealbreaker
  if (
    viewerPrefs.dealbreaker_faith.length > 0 &&
    viewerPrefs.dealbreaker_faith.includes(candidate.faith)
  ) {
    return null;
  }

  // Monogamy dealbreaker
  if (
    viewerPrefs.dealbreaker_monogamy.length > 0 &&
    viewerPrefs.dealbreaker_monogamy.includes(candidate.monogamy_preference)
  ) {
    return null;
  }

  // Politics dealbreaker
  if (
    viewerPrefs.dealbreaker_politics.length > 0 &&
    viewerPrefs.dealbreaker_politics.includes(candidate.politics)
  ) {
    return null;
  }

  // ------------------------------------------------------------------
  // 2. Component scores (each 0–100)
  // ------------------------------------------------------------------

  const relationshipGoalScore = scoreRelationshipGoal(
    viewer.relationship_goal,
    candidate.relationship_goal
  );

  const monogamyScore = scoreMonogamy(
    viewer.monogamy_preference,
    candidate.monogamy_preference
  );

  const faithScore = scoreFaith(
    viewer.faith,
    viewer.faith_importance,
    candidate.faith,
    candidate.faith_importance
  );

  const politicsScore = scorePolitics(viewer.politics, candidate.politics);

  // Lifestyle placeholder — returns 50 until lifestyle data is collected
  const lifestyleScore = 50;

  // ------------------------------------------------------------------
  // 3. Weighted average
  // ------------------------------------------------------------------
  const totalWeight =
    viewerPrefs.weight_relationship_goal +
    viewerPrefs.weight_monogamy +
    viewerPrefs.weight_faith +
    viewerPrefs.weight_politics +
    viewerPrefs.weight_lifestyle;

  if (totalWeight === 0) return 50; // fallback: neutral score

  const weightedSum =
    relationshipGoalScore * viewerPrefs.weight_relationship_goal +
    monogamyScore * viewerPrefs.weight_monogamy +
    faithScore * viewerPrefs.weight_faith +
    politicsScore * viewerPrefs.weight_politics +
    lifestyleScore * viewerPrefs.weight_lifestyle;

  const raw = weightedSum / totalWeight;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ---------------------------------------------------------------------------
// Component scorers
// ---------------------------------------------------------------------------

function scoreRelationshipGoal(
  a: RelationshipGoal,
  b: RelationshipGoal
): number {
  if (a === b) return 100;
  // "not_sure" is compatible with anything (partial match)
  if (a === "not_sure" || b === "not_sure") return 60;
  // serious/casual are a meaningful mismatch
  if (
    (a === "serious" && b === "casual") ||
    (a === "casual" && b === "serious")
  )
    return 10;
  // open is partially compatible with either
  return 40;
}

function scoreMonogamy(
  a: MonogamyPreference,
  b: MonogamyPreference
): number {
  if (a === b) return 100;
  if (a === "open_to_discussing" || b === "open_to_discussing") return 60;
  // strictly_monogamous vs non_monogamous — fundamental incompatibility
  return 5;
}

function scoreFaith(
  faithA: FaithTradition,
  importanceA: PreferenceImportance,
  faithB: FaithTradition,
  importanceB: PreferenceImportance
): number {
  // If neither cares, irrelevant
  if (importanceA === "not_important" && importanceB === "not_important") {
    return 75;
  }

  const sameOrCompatible = isFaithCompatible(faithA, faithB);

  if (sameOrCompatible) return 100;

  // Mismatch — how much does it matter?
  if (importanceA === "dealbreaker" || importanceB === "dealbreaker") return 0;
  if (importanceA === "important" || importanceB === "important") return 25;
  return 60;
}

function isFaithCompatible(a: FaithTradition, b: FaithTradition): boolean {
  if (a === b) return true;
  // These groupings are deliberately broad — exact compatibility is subjective
  const nonReligious: FaithTradition[] = [
    "not_religious",
    "spiritual_not_religious",
  ];
  return nonReligious.includes(a) && nonReligious.includes(b);
}

const POLITICS_ORDER: PoliticsSpectrum[] = [
  "very_liberal",
  "liberal",
  "moderate",
  "conservative",
  "very_conservative",
];

function scorePolitics(a: PoliticsSpectrum, b: PoliticsSpectrum): number {
  if (a === "prefer_not_to_say" || b === "prefer_not_to_say") return 60;
  if (a === b) return 100;

  const idxA = POLITICS_ORDER.indexOf(a);
  const idxB = POLITICS_ORDER.indexOf(b);
  const distance = Math.abs(idxA - idxB);

  // Map distance 0-4 to score 100-10
  const scores: Record<number, number> = { 0: 100, 1: 80, 2: 50, 3: 25, 4: 10 };
  return scores[distance] ?? 10;
}

// ---------------------------------------------------------------------------
// Determine first-mover in a new match
// ---------------------------------------------------------------------------

/**
 * Returns the profile ID of who should message first.
 *
 * Rules:
 * - In man/woman (heterosexual) pairings: the man messages first.
 * - In same-sex pairings: the person who liked first gets the nudge.
 * - In all other cases (non-binary, etc.): either can go first (return null).
 */
export function determineFirstMover(
  profileA: Pick<Profile, "id" | "gender">,
  profileB: Pick<Profile, "id" | "gender">,
  firstLikerId: string
): string | null {
  const { id: idA, gender: genderA } = profileA;
  const { id: idB, gender: genderB } = profileB;

  const isHetPairing =
    (genderA === "man" && genderB === "woman") ||
    (genderA === "woman" && genderB === "man");

  if (isHetPairing) {
    return genderA === "man" ? idA : idB;
  }

  // Same-sex: first liker gets the nudge
  const isSameSex =
    (genderA === "man" && genderB === "man") ||
    (genderA === "woman" && genderB === "woman");

  if (isSameSex) {
    return firstLikerId;
  }

  // Non-binary / other combinations — either can go first
  return null;
}
