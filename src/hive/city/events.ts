/**
 * One big moment at a time: lightning and the star flare each claim the stage for their length plus a short rest.
 * Anything that finds the stage taken waits and asks again, so the sky never fires two flashes at once.
 */
export interface Stage {
  freeAt: number;
}

/** Seconds of quiet between set pieces. */
export const REST = 1.2;

export function createStage(): Stage {
  return { freeAt: 0 };
}

/** Claims the stage at clock time `now` for `dur` seconds; false when another moment holds it. */
export function claim(s: Stage, now: number, dur: number): boolean {
  if (now < s.freeAt) return false;
  s.freeAt = now + dur + REST;
  return true;
}
