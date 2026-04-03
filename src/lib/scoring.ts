import type {
  FlameTier,
  FaithTradition,
  PoliticsSpectrum,
  RelationshipGoal,
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

/** Softer user-facing copy for politics (DB enums unchanged). */
export const POLITICS_DISPLAY_LABELS: Record<PoliticsSpectrum, string> = {
  very_liberal: "Very progressive",
  liberal: "Progressive",
  moderate: "Middle of the road",
  conservative: "Traditional",
  very_conservative: "Very traditional",
  prefer_not_to_say: "Prefer not to say",
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
// Weights from UserPreferences; Phase 2: pgvector embeddings.
// ---------------------------------------------------------------------------

interface ScoringContext {
  viewer: Profile;
  viewerPrefs: UserPreferences;
  candidate: Profile;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km; returns null if either point is missing. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const r1 = (lat1 * Math.PI) / 180;
  const r2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r1) * Math.cos(r2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Compatibility score 0–100 between viewer and candidate.
 * Returns null if a hard dealbreaker or max-distance filter fails.
 */
export function computeCompatibilityScore(
  ctx: ScoringContext
): number | null {
  const { viewer, viewerPrefs, candidate } = ctx;

  if (
    viewerPrefs.dealbreaker_goals.length > 0 &&
    viewerPrefs.dealbreaker_goals.includes(candidate.relationship_goal)
  ) {
    return null;
  }

  if (
    viewerPrefs.dealbreaker_faith.length > 0 &&
    viewerPrefs.dealbreaker_faith.includes(candidate.faith)
  ) {
    return null;
  }

  if (
    viewerPrefs.dealbreaker_politics.length > 0 &&
    viewerPrefs.dealbreaker_politics.includes(candidate.politics)
  ) {
    return null;
  }

  const maxKm = viewerPrefs.max_distance_km;
  if (
    viewer.latitude != null &&
    viewer.longitude != null &&
    candidate.latitude != null &&
    candidate.longitude != null
  ) {
    const d = haversineKm(
      viewer.latitude,
      viewer.longitude,
      candidate.latitude,
      candidate.longitude
    );
    if (d > maxKm) return null;
  }

  const relationshipGoalScore = scoreRelationshipGoal(
    viewer.relationship_goal,
    candidate.relationship_goal
  );

  const faithScore = scoreFaith(
    viewer.faith,
    viewer.faith_importance,
    viewer.faith_subgroup_id,
    candidate.faith,
    candidate.faith_importance,
    candidate.faith_subgroup_id
  );

  const politicsScore = scorePolitics(viewer.politics, candidate.politics);

  const distanceScore = scoreDistanceKm(
    viewer.latitude,
    viewer.longitude,
    candidate.latitude,
    candidate.longitude,
    maxKm
  );

  const lifestyleScore = 50;
  const valuesScore = 50;

  const totalWeight =
    viewerPrefs.weight_relationship_goal +
    viewerPrefs.weight_faith +
    viewerPrefs.weight_politics +
    viewerPrefs.weight_lifestyle +
    viewerPrefs.weight_values +
    viewerPrefs.weight_distance;

  if (totalWeight === 0) return 50;

  const weightedSum =
    relationshipGoalScore * viewerPrefs.weight_relationship_goal +
    faithScore * viewerPrefs.weight_faith +
    politicsScore * viewerPrefs.weight_politics +
    lifestyleScore * viewerPrefs.weight_lifestyle +
    valuesScore * viewerPrefs.weight_values +
    distanceScore * viewerPrefs.weight_distance;

  const raw = weightedSum / totalWeight;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

function scoreRelationshipGoal(
  a: RelationshipGoal,
  b: RelationshipGoal
): number {
  if (a === b) return 100;
  if (a === "not_sure" || b === "not_sure") return 60;
  if (
    (a === "serious" && b === "casual") ||
    (a === "casual" && b === "serious")
  )
    return 10;
  return 40;
}

/** Slight penalty when top-level faith matches but optional subgroup rows differ. */
function scoreFaith(
  faithA: FaithTradition,
  importanceA: PreferenceImportance,
  subgroupIdA: string | null,
  faithB: FaithTradition,
  importanceB: PreferenceImportance,
  subgroupIdB: string | null
): number {
  if (importanceA === "not_important" && importanceB === "not_important") {
    return 75;
  }

  const sameOrCompatible = isFaithCompatible(faithA, faithB);

  let base: number;
  if (sameOrCompatible) base = 100;
  else if (importanceA === "dealbreaker" || importanceB === "dealbreaker")
    base = 0;
  else if (importanceA === "important" || importanceB === "important")
    base = 25;
  else base = 60;

  if (
    faithA === faithB &&
    subgroupIdA != null &&
    subgroupIdB != null &&
    subgroupIdA !== subgroupIdB
  ) {
    base = Math.max(0, Math.round(base * 0.9));
  }

  return base;
}

function isFaithCompatible(a: FaithTradition, b: FaithTradition): boolean {
  if (a === b) return true;
  const nonReligious: FaithTradition[] = ["not_religious", "spiritual"];
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

  const scores: Record<number, number> = { 0: 100, 1: 80, 2: 50, 3: 25, 4: 10 };
  return scores[distance] ?? 10;
}

function scoreDistanceKm(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null,
  maxKm: number
): number {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    maxKm <= 0
  ) {
    return 50;
  }
  const d = haversineKm(lat1, lon1, lat2, lon2);
  if (d >= maxKm) return 0;
  return Math.round(100 * (1 - d / maxKm));
}

// ---------------------------------------------------------------------------
// Nudge hint for new match (UI only — never gate sends on this)
// ---------------------------------------------------------------------------

/**
 * Who gets the *primary* in-app nudge. `null` means both are nudged or either may go first.
 *
 * - Man/woman (heterosexual) pairings: `null` (nudge both in UI; either may message).
 * - Same man/man or woman/woman: first liker id.
 * - Other combinations: `null`.
 */
export function determineNudgedProfile(
  profileA: Pick<Profile, "id" | "gender">,
  profileB: Pick<Profile, "id" | "gender">,
  firstLikerId: string
): string | null {
  const { gender: genderA } = profileA;
  const { gender: genderB } = profileB;

  const isHetPairing =
    (genderA === "man" && genderB === "woman") ||
    (genderA === "woman" && genderB === "man");

  if (isHetPairing) {
    return null;
  }

  const isSameSex =
    (genderA === "man" && genderB === "man") ||
    (genderA === "woman" && genderB === "woman");

  if (isSameSex) {
    return firstLikerId;
  }

  return null;
}

/** @deprecated Use `determineNudgedProfile` (naming aligned with `nudged_profile_id`). */
export const determineFirstMover = determineNudgedProfile;
