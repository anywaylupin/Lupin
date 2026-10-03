import type { Prefs } from "../prefs";

/** Full volume on the slider maps to 35% gain; brown noise any louder masks speech in a call. */
const MAX_GAIN = 0.35;
const LOWPASS_HZ = 1100;

/** Four seconds of brown noise, looped; integrating white noise with a small leak keeps it from drifting off centre. */
function brownNoise(ctx: AudioContext): AudioBufferSourceNode {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/**
 * Ambient sound is synthesized, so nothing is downloaded.
 * The audio context is only created from a user gesture, and the level ramps to zero while the tab is hidden.
 */
export function createAudio(prefs: () => Prefs) {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let playing = false;
  let unlocked = false;

  const setLevel = () => {
    if (!ctx || !master) return;
    const p = prefs();
    const target = !p.sound || document.hidden ? 0 : p.volume * MAX_GAIN;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.5);
  };

  const start = () => {
    if (!prefs().sound) {
      setLevel();
      return;
    }
    if (!ctx) {
      if (typeof AudioContext === "undefined") return;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    if (!playing && master) {
      const src = brownNoise(ctx);
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = LOWPASS_HZ;
      lowpass.Q.value = 0.7;
      src.connect(lowpass).connect(master);
      src.start();
      playing = true;
    }
    setLevel();
  };

  document.addEventListener("visibilitychange", setLevel);

  return {
    /** Called on the first pointer or key press; sound that was left on last visit resumes only then. */
    gesture() {
      if (unlocked || !prefs().sound) return;
      unlocked = true;
      start();
    },
    toggled() {
      unlocked = true;
      start();
    },
    setLevel,
  };
}
