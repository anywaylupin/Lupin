import { ax, hexVerts, type Point } from "../hex";
import { emptyGaps } from "../sheet";
import type { Hive } from "../state";

const NS = "http://www.w3.org/2000/svg";
/** Map hexes are 6 units across for home cells and 2.4 for cards; the box keeps the prototype's 150 by 124 aspect. */
const CELL = 6;
const SUB = 2.4;
const ASPECT = 150 / 124;

function hexD(x: number, y: number, r: number): string {
  return `M${hexVerts(x, y, r)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join("L")}Z`;
}

function path(d: string, cls: string): SVGPathElement {
  const e = document.createElementNS(NS, "path");
  e.setAttribute("d", d);
  e.setAttribute("class", cls);
  return e;
}

interface Kids {
  g: SVGGElement;
  items: SVGPathElement[];
}

/**
 * The map is built once per layout and only its classes change, so gaps fill, cells dim and cards grow out of their parent with CSS transitions.
 * Each section's cards sit in a small cluster pushed outward from its home cell, linked by a line that draws itself in.
 */
export function createMap(h: Hive, svg: SVGSVGElement) {
  let home: SVGPathElement[] = [];
  let kids: (Kids | null)[] = [];
  let gapG = document.createElementNS(NS, "g");
  let k = 1;

  const build = () => {
    const F = h.front;
    k = CELL / F.R;
    const pts: Point[] = F.hole.map((g) => ({ x: g.x * k, y: g.y * k }));
    gapG = document.createElementNS(NS, "g");
    home = F.powered.map((c, i) => {
      pts.push({ x: c.x * k, y: c.y * k });
      return path(hexD(c.x * k, c.y * k, CELL * 0.9), i === 0 ? "hex you" : "hex");
    });
    kids = h.backs.map((B, i) => {
      const c = F.powered[i];
      if (!B || !c) return null;
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "kids");
      const sp = { x: c.x * k, y: c.y * k };
      const dl = Math.hypot(sp.x, sp.y) || 1;
      let rings = 0;
      for (let cap = 1; cap < B.items.length; cap += 6 * rings) rings++;
      const rad = (rings + 0.6) * SUB * 1.8;
      const cc = { x: sp.x + (sp.x / dl) * (rad + 8), y: sp.y + (sp.y / dl) * (rad + 8) };
      const link = document.createElementNS(NS, "line");
      link.setAttribute("x1", sp.x.toFixed(1));
      link.setAttribute("y1", sp.y.toFixed(1));
      link.setAttribute("x2", cc.x.toFixed(1));
      link.setAttribute("y2", cc.y.toFixed(1));
      link.setAttribute("class", "link");
      g.append(link);
      const items = B.items.map((it, j) => {
        const p = ax(it.q, it.r, SUB);
        const e = path(hexD(cc.x + p.x, cc.y + p.y, SUB * 0.9), "hex");
        e.style.transitionDelay = `${0.15 + j * 0.02}s`;
        g.append(e);
        pts.push({ x: cc.x + p.x, y: cc.y + p.y });
        return e;
      });
      return { g, items };
    });
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs) - 8;
    const maxX = Math.max(...xs) + 8;
    const minY = Math.min(...ys) - 8;
    const maxY = Math.max(...ys) + 8;
    const fw = Math.max(maxX - minX, (maxY - minY) * ASPECT);
    const fh = fw / ASPECT;
    svg.setAttribute(
      "viewBox",
      `${((minX + maxX) / 2 - fw / 2).toFixed(1)} ${((minY + maxY) / 2 - fh / 2).toFixed(1)} ${fw.toFixed(1)} ${fh.toFixed(1)}`,
    );
    svg.replaceChildren(gapG, ...kids.flatMap((x) => (x ? [x.g] : [])), ...home);
  };

  /** Lights the open section, dims the rest, and mirrors hover and the open leaf; `closing` lets the cards fold back as the section closes. */
  const update = (closing = false) => {
    const F = h.front;
    const n = h.nav;
    const open = closing ? -1 : n.sec;
    gapG.replaceChildren(
      ...emptyGaps(F).map((g) => path(hexD(g.x * k, g.y * k, CELL * 0.88), open >= 0 ? "gap dim" : "gap")),
    );
    home.forEach((e, i) => {
      const id = F.powered[i]?.id;
      const leafHere = n.leafOpen?.where === "front" && n.leafOpen.idx === i;
      e.classList.toggle("dim", open >= 0 && i !== open);
      e.classList.toggle("lit", i === open || (open < 0 && (h.hoverKey === id || leafHere)));
    });
    kids.forEach((kk, i) => {
      if (!kk) return;
      kk.g.classList.toggle("show", i === open);
      kk.items.forEach((e, j) => {
        const id = h.backs[i]?.items[j]?.id;
        const leafHere = n.leafOpen?.where === "back" && n.leafOpen.idx === j;
        e.classList.toggle("lit", i === open && (h.hoverKey === id || leafHere));
      });
    });
  };

  return { build, update };
}
