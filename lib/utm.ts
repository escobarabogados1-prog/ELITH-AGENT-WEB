import type { UtmParams } from "../types";

const UTM_KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

export function readUtmFromSearchParams(
  searchParams: URLSearchParams
): UtmParams | undefined {
  const utm: UtmParams = {};
  let hasAny = false;

  for (const key of UTM_KEYS) {
    const value = searchParams.get(key);
    if (value) {
      utm[key] = value;
      hasAny = true;
    }
  }

  return hasAny ? utm : undefined;
}
