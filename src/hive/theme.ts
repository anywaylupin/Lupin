/** Canvas fills; the CSS tokens in styles/tokens.css mirror the ones the DOM uses. */
export const C = {
  bg: "#05040b",
  base: "#05040b",
  deco: "#0b0917",
  loose: "#100d22",
  cell: "#141030",
  back: "#110c26",
  flip: "#1a0f36",
  line: "#181436",
} as const;

export const PINK = "217,71,159";
export const BLUE = "58,111,214";
export const CYAN = "92,196,220";
/** Amber belongs to the city only: windows, headlights, sparks. */
export const AMBER = "235,168,72";

export function rgba(rgb: string, a: number): string {
  return `rgba(${rgb},${a})`;
}

/** Cells are drawn a little smaller than their slot so the seams between them read as space, not hairlines. */
export const HEX = 0.9;
export const FLIP_MS = 700;
export const SEC_MS = 900;
/** Pixels a press on a plain hex must travel before it tears the hex out instead of panning. */
export const TEAR_PX = 6;
