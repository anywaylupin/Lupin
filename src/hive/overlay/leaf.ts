import type { LeafData } from "../data";
import { svgIcon, type IconName } from "../icons";
import type { Hive } from "../state";
import { SQ3 } from "../hex";
import { leafSize } from "../nav";

function mk<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** The open leaf's content and icon, from either a home cell or a card on the open section. */
export function leafContent(h: Hive): { leaf: LeafData; icon: IconName } | null {
  const L = h.nav.leafOpen;
  if (!L) return null;
  if (L.where === "front") {
    const cell = h.data.home[L.idx];
    return cell?.leaf ? { leaf: cell.leaf, icon: cell.icon } : null;
  }
  const card = h.data.home[h.nav.sec]?.cards?.[L.idx - 1];
  return card?.leaf ? { leaf: card.leaf, icon: card.icon } : null;
}

export interface LeafEls {
  leaf: HTMLElement;
  inner: HTMLElement;
  back: HTMLElement;
  cells: HTMLElement;
}

/** Leaf pages sit inside the zoomed hex's back face; the cells behind go inert so Tab stays on the page. */
export function createLeaf(h: Hive, els: LeafEls, reveal: (el: Element, ms: number) => void) {
  const show = (moveFocus: boolean) => {
    const c = leafContent(h);
    if (!c) return;
    const { leaf, icon } = c;
    const cmd = mk("div", "cmd");
    cmd.append(mk("b", "", "❯"), leaf.cmd);
    const title = mk("h2");
    title.id = "leaf-title";
    title.innerHTML = svgIcon(icon);
    title.append(leaf.title);
    const body = mk("div", "body");
    body.innerHTML = leaf.html;
    const parts: HTMLElement[] = [cmd, title, body];
    if (leaf.tags.length) {
      const ul = mk("ul", "tags");
      ul.append(...leaf.tags.map((t) => mk("li", "", t)));
      parts.push(ul);
    }
    if (leaf.links.length) {
      const box = mk("div", "links");
      for (const l of leaf.links) {
        const a = l.href ? Object.assign(mk("a"), { href: l.href, target: "_blank", rel: "noopener" }) : mk("span");
        a.append(mk("b", "", "❯"), l.href ? `open ${l.label}` : `${l.label}, add link`);
        box.append(a);
      }
      parts.push(box);
    }
    els.inner.replaceChildren(...parts);
    els.leaf.hidden = false;
    els.cells.inert = true;
    place();
    reveal(els.inner, 620);
    if (moveFocus) els.inner.focus({ preventScroll: true });
  };

  const hide = () => {
    els.leaf.hidden = true;
    els.cells.inert = false;
  };

  const place = () => {
    if (els.leaf.hidden) return;
    const s2 = leafSize(h.W, h.H);
    const w = SQ3 * s2;
    const hh = 2 * s2;
    const st = els.leaf.style;
    st.width = `${w}px`;
    st.height = `${hh}px`;
    st.transform = `translate(${h.W / 2 - w / 2}px, ${h.H / 2 - hh / 2}px)`;
    st.setProperty("--bw", `${s2 * 1.28}px`);
    st.setProperty("--bh", `${s2 * 1.05}px`);
  };

  return { show, hide, place };
}
