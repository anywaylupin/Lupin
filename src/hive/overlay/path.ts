import type { Hive } from "../state";

export type PathClass = "prompt" | "text" | "here";

export interface PathChar {
  ch: string;
  cls: PathClass;
  noise: boolean;
}

const GLYPHS = "01<>/\\|=+*#%&$@";
/** One letter changes state every 24 ms; a letter spends one tick as noise, so each takes about 50 ms in or out. */
const TICK_MS = 24;

function same(a: PathChar | undefined, b: PathChar | undefined): boolean {
  return !!a && !!b && a.ch === b.ch && a.cls === b.cls;
}

/**
 * One tick of the path animation, from what is shown towards the target.
 * Letters past the shared prefix scramble into noise and drop off from the end, then the new letters arrive one at a time, each as noise before resolving.
 * Returns the same array when there is nothing left to do.
 */
export function pathStep(shown: readonly PathChar[], target: readonly PathChar[]): PathChar[] {
  let p = 0;
  while (p < shown.length && p < target.length && same(shown[p], target[p]) && !shown[p]?.noise) p++;
  const last = shown.at(-1);
  if (shown.length > p) {
    if (shown.length - 1 === p && last && same(last, target[p]) && last.noise) {
      return [...shown.slice(0, -1), { ...last, noise: false }];
    }
    if (last && !last.noise) return [...shown.slice(0, -1), { ...last, noise: true }];
    return shown.slice(0, -1);
  }
  const next = target[shown.length];
  return next ? [...shown, { ...next, noise: true }] : (shown as PathChar[]);
}

function charsOf(parts: readonly [string, PathClass][]): PathChar[] {
  return parts.flatMap(([text, cls]) => [...text].map((ch) => ({ ch, cls, noise: false })));
}

/** The shell prompt at the top: `~`, then the open section, then the open page as a Markdown file. */
export function createPath(h: Hive, el: HTMLElement, animate: () => boolean) {
  let shown: PathChar[] = [];
  let target: PathChar[] = [];
  let timer = 0;

  const render = () => {
    const frag = document.createDocumentFragment();
    let run: HTMLSpanElement | null = null;
    for (const c of shown) {
      if (!run || run.className !== c.cls) {
        run = Object.assign(document.createElement("span"), { className: c.cls });
        frag.append(run);
      }
      run.textContent += c.noise ? (GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? "#") : c.ch;
    }
    el.replaceChildren(frag);
  };

  const tick = () => {
    const next = pathStep(shown, target);
    if (next === shown) {
      timer = 0;
      return;
    }
    shown = next;
    render();
    timer = window.setTimeout(tick, TICK_MS);
  };

  return () => {
    const n = h.nav;
    const cell = h.data.home[n.sec];
    const L = n.leafOpen;
    const leafId = L ? (L.where === "front" ? h.data.home[L.idx]?.id : cell?.cards?.[L.idx - 1]?.id) : undefined;
    const parts: [string, PathClass][] = [
      ["❯ ", "prompt"],
      ["~", "text"],
    ];
    if (cell) parts.push(["/", "text"], [cell.id, "here"]);
    if (leafId) parts.push(["/", "text"], [`${leafId}.md`, "here"]);
    target = charsOf(parts);
    if (!animate()) {
      clearTimeout(timer);
      timer = 0;
      shown = target;
      render();
      return;
    }
    if (!timer) tick();
  };
}
