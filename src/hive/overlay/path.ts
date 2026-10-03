import type { Hive } from "../state";

function span(cls: string, text: string): HTMLSpanElement {
  return Object.assign(document.createElement("span"), { className: cls, textContent: text });
}

/** The shell prompt at the top: `~`, then the open section, then the open page as a Markdown file. */
export function createPath(h: Hive, el: HTMLElement, reveal: (el: Element, ms: number) => void) {
  let last = "";
  return () => {
    const n = h.nav;
    const parts: Node[] = [span("prompt", "❯"), document.createTextNode("~")];
    const cell = h.data.home[n.sec];
    if (cell) parts.push(document.createTextNode("/"), span("here", cell.id));
    const L = n.leafOpen;
    const leafId = L ? (L.where === "front" ? h.data.home[L.idx]?.id : cell?.cards?.[L.idx - 1]?.id) : undefined;
    if (leafId) parts.push(document.createTextNode("/"), span("here", `${leafId}.md`));
    const text = parts.map((p) => p.textContent).join("");
    if (text === last) return;
    last = text;
    el.replaceChildren(...parts);
    reveal(el, 300);
  };
}
