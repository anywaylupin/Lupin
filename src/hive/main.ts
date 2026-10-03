import { DATA_ELEMENT_ID, type HiveData } from "./data";
import { buildBack, buildFront } from "./layout";
import { rng } from "./math";
import { loadPrefs } from "./prefs";
import { drawFront } from "./render";
import { createNav, type Hive } from "./state";

/** The JSON is written by our own build from schema-checked content, so it is trusted as is. */
function readData(): HiveData {
  const text = document.getElementById(DATA_ELEMENT_ID)?.textContent;
  if (!text) throw new Error(`#${DATA_ELEMENT_ID} is missing`);
  return JSON.parse(text) as HiveData;
}

function layoutSheets(h: Pick<Hive, "data" | "W" | "H">) {
  const front = buildFront(
    h.data.home.map((c) => c.id),
    h.W,
    h.H,
    rng((Math.random() * 1e9) | 0),
  );
  const backs = h.data.home.map((c) =>
    c.cards
      ? buildBack(
          c.id,
          c.cards.map((k) => k.id),
          h.W,
          h.H,
          front.R,
        )
      : null,
  );
  return { front, backs };
}

/** Boots the hive over the page; throws if the shell markup is missing so the caller can fall back to the plain page. */
export function boot(): void {
  const cv = document.getElementById("hive");
  if (!(cv instanceof HTMLCanvasElement)) throw new Error("#hive canvas is missing");
  const g = cv.getContext("2d");
  if (!g) throw new Error("2D canvas is unavailable");
  const data = readData();
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const W = innerWidth;
  const H = innerHeight;
  const h: Hive = {
    data,
    W,
    H,
    DPR: 1,
    ...layoutSheets({ data, W, H }),
    frontCam: { x: 0, y: 0, z: 1 },
    backCam: { x: 0, y: 0, z: 1 },
    pointer: { x: -9999, y: -9999 },
    clock: 0,
    nav: createNav(),
    hoverKey: null,
    hoverLoose: -1,
    grow: new Map(),
    drag: null,
    dragMoved: false,
    pending: null,
    prefs: loadPrefs(() => localStorage),
    reduced: reduceQuery.matches,
  };
  reduceQuery.addEventListener("change", (e) => (h.reduced = e.matches));

  const sizeCanvas = () => {
    h.W = innerWidth;
    h.H = innerHeight;
    h.DPR = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(h.W * h.DPR);
    cv.height = Math.round(h.H * h.DPR);
  };
  const resize = () => {
    sizeCanvas();
    Object.assign(h, layoutSheets(h));
    Object.assign(h.frontCam, h.front.home);
  };

  const frame = (now: number) => {
    g.setTransform(h.DPR, 0, 0, h.DPR, 0, 0);
    g.clearRect(0, 0, h.W, h.H);
    drawFront(g, h, h.frontCam, true, now);
    requestAnimationFrame(frame);
  };

  addEventListener("pointermove", (e) => {
    h.pointer.x = e.clientX;
    h.pointer.y = e.clientY;
  });
  document.documentElement.addEventListener("pointerleave", () => (h.pointer.x = h.pointer.y = -9999));
  addEventListener("resize", resize);
  sizeCanvas();
  Object.assign(h.frontCam, h.front.home);
  document.documentElement.classList.add("hive");
  requestAnimationFrame(frame);
}
