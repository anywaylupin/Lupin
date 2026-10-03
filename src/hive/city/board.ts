/** The city is painted on a fixed 1600 by 1000 board; the horizon sits at 560. */
export const CW = 1600;
export const CH = 1000;
export const HZ = 560;

/** A window that can switch on and off; only the mid and near-mid layers keep theirs live. */
export interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  on: boolean;
}

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
