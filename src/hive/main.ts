import { restOf } from "./camera";
import { createGlitch } from "./city/glitch";
import { type City, updateCity } from "./city/dynamic";
import { bake, mountCity, placeCity } from "./city/layers";
import { createScene } from "./city/scene";
import { DATA_ELEMENT_ID, type HiveData } from "./data";
import { bindInput } from "./input";
import { buildBack, buildFront } from "./layout";
import { rng } from "./math";
import { loadPrefs } from "./prefs";
import { drawFront } from "./render";
import { activeCam, createNav, on, onBack, type Hive } from "./state";

/** The JSON is written by our own build from schema-checked content, so it is trusted as is. */
function readData(): HiveData {
  const text = document.getElementById(DATA_ELEMENT_ID)?.textContent;
  if (!text) throw new Error(`#${DATA_ELEMENT_ID} is missing`);
  return JSON.parse(text) as HiveData;
}

function layoutSheets(h: Pick<Hive, "data" | "W" | "H">) {
  const ids = h.data.home.map((c) => c.id);
  const front = buildFront(ids, h.W, h.H, rng((Math.random() * 1e9) | 0));
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

/** Canvas font family for the city signs; the fonts API hashes family names, so it is read from the CSS variable. */
function signFont(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--font-zh").trim() || '"Noto Sans SC", sans-serif'
  );
}

/** Boots the hive over the page; throws if the shell markup is missing so the caller can fall back to the plain page. */
export function boot(): void {
  const cv = document.getElementById("hive");
  const cityEl = document.getElementById("city");
  if (!(cv instanceof HTMLCanvasElement) || !cityEl) throw new Error("hive markup is missing");
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
  const zh = signFont();
  let city: City | null = null;
  void bake().then((baked) => {
    city = { layers: mountCity(cityEl, baked), wins: baked.wins, scene: createScene(), glitch: createGlitch() };
  });

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

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!h.reduced) h.clock += dt;
    if (h.drag?.kind !== "pan") {
      const c = activeCam(h);
      const rect = onBack(h) ? (h.backs[h.nav.sec]?.rect ?? h.front.rect) : h.front.rect;
      const r = restOf(rect, c, h.W, h.H);
      const k = h.reduced ? 1 : 0.18;
      c.x += (r.x - c.x) * k;
      c.y += (r.y - c.y) * k;
    }
    g.setTransform(h.DPR, 0, 0, h.DPR, 0, 0);
    g.clearRect(0, 0, h.W, h.H);
    if (city) {
      placeCity(city.layers, h.reduced ? h.front.home : h.frontCam, h.front.home, h.front.hc, h.W, h.H);
      updateCity(city, {
        dt,
        now,
        clock: h.clock,
        life: on(h, "life"),
        weather: on(h, "weather"),
        glitch: on(h, "glitch"),
        reduced: h.reduced,
        DPR: h.DPR,
        zh,
      });
    }
    drawFront(g, h, h.frontCam, true, now);
    requestAnimationFrame(frame);
  };

  bindInput(h, cv, {
    firstGesture: () => {},
    canvasDown: () => false,
    canvasMove: () => false,
    canvasUp: () => {},
    hover: () => {},
    escape: () => {},
  });
  addEventListener("resize", resize);
  sizeCanvas();
  Object.assign(h.frontCam, h.front.home);
  document.documentElement.classList.add("hive");
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
}
