import type { LeafData } from "../data";
import { svgIcon, type IconName } from "../icons";
import type { Hive } from "../state";
import { SQ3 } from "../hex";
import { leafSize } from "../nav";
import { drawScene, type SceneKind } from "../scenes";

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

/** Which vignette heads the open page: the cell's own for home pages, the section's for cards. */
export function sceneFor(h: Hive): SceneKind | null {
  const L = h.nav.leafOpen;
  if (!L) return null;
  const id = L.where === "front" ? h.data.home[L.idx]?.id : h.data.home[h.nav.sec]?.id;
  const kinds: Record<string, SceneKind> = {
    about: "rooftop",
    now: "lanterns",
    hours: "dusk",
    projects: "hive",
    experience: "orbit",
  };
  return (id && kinds[id]) || null;
}

/** Sizes the scene canvas to its box at device resolution and draws one frame. */
function paintScene(scene: { kind: SceneKind; el: HTMLCanvasElement }, t: number) {
  const c = scene.el;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = c.clientWidth;
  const hh = c.clientHeight;
  if (!w || !hh) return;
  if (c.width !== Math.round(w * dpr)) c.width = Math.round(w * dpr);
  if (c.height !== Math.round(hh * dpr)) c.height = Math.round(hh * dpr);
  const g = c.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScene(g, scene.kind, w, hh, t);
}

export interface LeafEls {
  leaf: HTMLElement;
  inner: HTMLElement;
  back: HTMLElement;
  cells: HTMLElement;
}

/** Leaf pages sit inside the zoomed hex's back face; the cells behind go inert so Tab stays on the page. */
export function createLeaf(h: Hive, els: LeafEls, reveal: (el: Element, ms: number) => void) {
  let scene: { kind: SceneKind; el: HTMLCanvasElement } | null = null;
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
    const kind = sceneFor(h);
    scene = kind ? { kind, el: Object.assign(mk("canvas", "scene"), { ariaHidden: "true" }) } : null;
    const parts: HTMLElement[] = [...(scene ? [scene.el] : []), cmd, title, body];
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
    scene = null;
    els.leaf.hidden = true;
    els.cells.inert = false;
  };

  const place = (now = performance.now()) => {
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
    if (scene) paintScene(scene, h.reduced ? 0.8 : now / 1000);
  };

  return { show, hide, place };
}
