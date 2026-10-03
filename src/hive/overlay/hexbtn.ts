import { hexVerts, perimeter } from "../hex";

export type TipAlign = "left" | "right" | "center";

export interface Tip {
  show: (text: string, x: number, y: number, align: TipAlign) => void;
  hide: () => void;
}

const NS = "http://www.w3.org/2000/svg";

function points(size: number): string {
  return hexVerts(0, 0, size)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

/**
 * Each small hex button's border becomes a live wire on hover, matching the big cells: the edge is re-jittered every 120 ms with the odd stronger spike.
 * Returns a function that re-shows the tooltip, so callers can swap its text in place, as the copy button does.
 */
export function setupHexButton(
  el: HTMLElement,
  side: "right" | "left" | "above",
  electric: () => boolean,
  tip: Tip | null,
): () => void {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "frame");
  svg.setAttribute("viewBox", "-38 -41 76 82");
  svg.setAttribute("aria-hidden", "true");
  const fill = document.createElementNS(NS, "polygon");
  fill.setAttribute("class", "fill");
  fill.setAttribute("points", points(25));
  const edge = document.createElementNS(NS, "polygon");
  edge.setAttribute("class", "edge");
  edge.setAttribute("points", points(28));
  svg.append(fill, edge);
  el.prepend(svg);
  const base = perimeter(hexVerts(0, 0, 28), 0.12);
  let timer = 0;
  const crackle = () => {
    const amp = Math.random() < 0.15 ? 3 : 1.1;
    const pts = base.map((p) => {
      const j = (Math.random() - 0.5) * 2 * amp;
      return `${(p.x + j).toFixed(1)},${(p.y - j).toFixed(1)}`;
    });
    edge.setAttribute("points", pts.join(" "));
  };
  const showTip = () => {
    const text = el.dataset["tip"];
    if (!tip || !text) return;
    const r = el.getBoundingClientRect();
    if (side === "above") tip.show(text, r.left + r.width / 2, r.top - 18, "center");
    else if (side === "left") tip.show(text, r.left - 16, r.top + r.height / 2, "left");
    else tip.show(text, r.right + 16, r.top + r.height / 2, "right");
  };
  const show = () => {
    clearInterval(timer);
    if (electric()) {
      crackle();
      timer = window.setInterval(crackle, 120);
    }
    showTip();
  };
  const off = () => {
    clearInterval(timer);
    edge.setAttribute("points", points(28));
    tip?.hide();
  };
  el.addEventListener("pointerenter", show);
  el.addEventListener("focus", show);
  el.addEventListener("pointerleave", off);
  el.addEventListener("blur", off);
  return showTip;
}
