import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFS,
  loadPrefs,
  parsePrefs,
  PREF_KEY,
  PREF_VERSION,
  savePrefs,
  serializePrefs,
} from "../../src/hive/prefs";

describe("prefs parsing", () => {
  it("starts with every effect on and sound off", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(DEFAULT_PREFS.sound).toBe(false);
  });

  it("never throws on junk", () => {
    for (const raw of ["", "{", "null", "42", '"text"', "[]", "[true]", "undefined", "{}"]) {
      expect(parsePrefs(raw)).toEqual(DEFAULT_PREFS);
    }
  });

  it("keeps valid fields and drops wrong types key by key", () => {
    const p = parsePrefs(JSON.stringify({ v: 1, glitch: false, life: "no", sound: true, volume: "loud", extra: 1 }));
    expect(p).toEqual({ ...DEFAULT_PREFS, glitch: false, sound: true });
    expect(p).not.toHaveProperty("extra");
  });

  it("clamps the volume and rejects non-finite numbers", () => {
    expect(parsePrefs('{"volume": 4}').volume).toBe(1);
    expect(parsePrefs('{"volume": -1}').volume).toBe(0);
    expect(parsePrefs('{"volume": 1e999}').volume).toBe(DEFAULT_PREFS.volume);
  });

  it("reads the unversioned blob the prototype stored", () => {
    const legacy = JSON.stringify({
      glitch: true,
      decrypt: false,
      electric: true,
      life: true,
      weather: false,
      sound: true,
      volume: 0.5,
    });
    expect(parsePrefs(legacy)).toEqual({ ...DEFAULT_PREFS, decrypt: false, weather: false, sound: true, volume: 0.5 });
  });

  it("round trips through its own serialization with a version", () => {
    const p = { ...DEFAULT_PREFS, electric: false, volume: 0.75 };
    const raw = serializePrefs(p);
    expect(JSON.parse(raw).v).toBe(PREF_VERSION);
    expect(parsePrefs(raw)).toEqual(p);
  });
});

describe("prefs storage", () => {
  it("falls back to defaults when storage is missing or throws", () => {
    expect(loadPrefs(() => null)).toEqual(DEFAULT_PREFS);
    expect(
      loadPrefs(() => {
        throw new DOMException("blocked", "SecurityError");
      }),
    ).toEqual(DEFAULT_PREFS);
    expect(
      loadPrefs(() => ({
        getItem: () => {
          throw new Error("denied");
        },
      })),
    ).toEqual(DEFAULT_PREFS);
  });

  it("swallows failed saves", () => {
    expect(() =>
      savePrefs(
        () => ({
          setItem: () => {
            throw new DOMException("full", "QuotaExceededError");
          },
        }),
        DEFAULT_PREFS,
      ),
    ).not.toThrow();
  });

  it("writes under the versioned key", () => {
    const store = new Map<string, string>();
    savePrefs(() => ({ setItem: (k: string, v: string) => void store.set(k, v) }), { ...DEFAULT_PREFS, life: false });
    expect(loadPrefs(() => ({ getItem: (k: string) => store.get(k) ?? null })).life).toBe(false);
    expect(store.has(PREF_KEY)).toBe(true);
  });
});
