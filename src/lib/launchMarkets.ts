/**
 * MVP launch geography: United States and Canada.
 * Enforce in onboarding, profile save, and any server-side validation.
 * (DB keeps `location_country` as text; normalization happens here.)
 */

export const LAUNCH_MARKET_COUNTRY_CODES = ["US", "CA"] as const;

export type LaunchMarketCountryCode = (typeof LAUNCH_MARKET_COUNTRY_CODES)[number];

const CANONICAL: Record<string, LaunchMarketCountryCode> = {
  US: "US",
  USA: "US",
  "U.S.": "US",
  "U.S.A.": "US",
  UNITEDSTATES: "US",
  UNITED_STATES: "US",
  CA: "CA",
  CAN: "CA",
  CANADA: "CA",
};

/**
 * Normalize user or device input (e.g. "usa", "Canada") to `US` | `CA`, or null if unknown.
 */
export function normalizeLaunchCountryCode(input: string | null | undefined): LaunchMarketCountryCode | null {
  if (input == null || input.trim() === "") return null;
  const key = input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "");
  const mapped = CANONICAL[key];
  return mapped ?? null;
}

export function isLaunchMarketCountryCode(
  code: string | null | undefined
): code is LaunchMarketCountryCode {
  return normalizeLaunchCountryCode(code) != null;
}
