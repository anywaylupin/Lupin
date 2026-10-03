import { clamp } from "../math";

const GLYPHS = "01<>/\\|=+*#%&$@";

interface Run {
  raf: number;
  nodes: { n: Text; final: string }[];
}

const runs = new WeakMap<Element, Run>();

function finish(root: Element, run: Run): void {
  cancelAnimationFrame(run.raf);
  for (const o of run.nodes) o.n.nodeValue = o.final;
  runs.delete(root);
  root.removeAttribute("aria-busy");
}

/**
 * Any text can decrypt into place: characters not yet revealed show as glyph noise, revealed left to right, so text arrives with its cell instead of popping.
 * Later text nodes start up to 35% later, and the root is marked busy so screen readers wait for the real words.
 */
export function decrypt(root: Element | null, dur: number, enabled: boolean): void {
  if (!root) return;
  const prev = runs.get(root);
  if (prev) finish(root, prev);
  if (!enabled) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Run["nodes"] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n instanceof Text && n.nodeValue?.trim()) nodes.push({ n, final: n.nodeValue });
  }
  if (!nodes.length) return;
  const t0 = performance.now();
  const run: Run = { nodes, raf: 0 };
  runs.set(root, run);
  root.setAttribute("aria-busy", "true");
  const step = (now: number) => {
    const p = clamp((now - t0) / dur, 0, 1);
    nodes.forEach((o, idx) => {
      const start = (idx / nodes.length) * 0.35;
      const local = clamp((p - start) / 0.65, 0, 1);
      const shown = Math.floor(local * o.final.length);
      let s = o.final.slice(0, shown);
      for (const ch of o.final.slice(shown))
        s += ch === " " || ch === "\n" ? ch : (GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? "#");
      o.n.nodeValue = s;
    });
    if (p < 1) run.raf = requestAnimationFrame(step);
    else finish(root, run);
  };
  run.raf = requestAnimationFrame(step);
}
