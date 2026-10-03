import { clamp } from "./math";

export const PREF_KEY = "breached-hive-prefs";
export const PREF_VERSION = 1;

export const EFFECTS = ["glitch", "decrypt", "electric", "life", "weather", "sound"] as const;
export type Effect = (typeof EFFECTS)[number];

export type Prefs = Record<Effect, boolean> & { volume: number };

/** Sound is off until asked for; every visual effect starts on. */
export const DEFAULT_PREFS: Readonly<Prefs> = {
  glitch: true,
  decrypt: true,
  electric: true,
  life: true,
  weather: true,
  sound: false,
  volume: 0.3,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Reads stored prefs and never throws: bad JSON, wrong types and unknown keys all fall back to defaults key by key.
 * The prototype stored an unversioned blob under the same key with the same field names, so a missing version is read as that.
 */
export function parsePrefs(raw: string | null | undefined): Prefs {
  const out: Prefs = { ...DEFAULT_PREFS };
  if (!raw) return out;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return out;
  }
  if (!isRecord(parsed)) return out;
  for (const name of EFFECTS) {
    const v = parsed[name];
    if (typeof v === "boolean") out[name] = v;
  }
  const volume = parsed["volume"];
  if (typeof volume === "number" && Number.isFinite(volume)) out.volume = clamp(volume, 0, 1);
  return out;
}

export function serializePrefs(p: Prefs): string {
  return JSON.stringify({ v: PREF_VERSION, ...p });
}

/**
 * Storage can be missing, blocked by privacy settings or throw on access itself, so every touch is guarded.
 * A failed save is ignored: prefs then last for the session only.
 */
export function loadPrefs(getStorage: () => Pick<Storage, "getItem"> | null | undefined): Prefs {
  try {
    return parsePrefs(getStorage()?.getItem(PREF_KEY));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(getStorage: () => Pick<Storage, "setItem"> | null | undefined, p: Prefs): void {
  try {
    getStorage()?.setItem(PREF_KEY, serializePrefs(p));
  } catch {}
}
