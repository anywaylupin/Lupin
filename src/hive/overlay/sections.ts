import type { CardData } from "../data";
import { SQ3 } from "../hex";
import { svgIcon, type IconName } from "../icons";
import { startPan } from "../input";
import type { Placed } from "../layout";
import { clamp } from "../math";
import { cardAlpha, movingHex, phases } from "../nav";
import type { Hive, Where } from "../state";
import { HEX } from "../theme";

export interface SectionActions {
  activate: (where: Where, i: number) => void;
  hover: (id: string | null) => void;
  reveal: (el: Element, ms: number) => void;
}

interface Proxy {
  el: HTMLElement;
  where: Where;
  i: number;
  item: Placed;
  label: string;
  hasText: boolean;
  fFront: HTMLElement;
  fBack: HTMLElement;
  shown: boolean;
  face: "front" | "back";
}

function esc(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

function faceHTML(
  icon: IconName,
  label: string,
  sub?: string | null,
  text?: string | null,
  tag?: string | null,
): string {
  return [
    svgIcon(icon),
    `<span class="label" data-text="${esc(label)}">${esc(label)}</span>`,
    sub ? `<span class="sub">${esc(sub)}</span>` : "",
    text ? `<span class="text">${esc(text)}</span>` : "",
    tag ? `<span class="tag">${esc(tag)}</span>` : "",
  ].join("");
}

function face(html: string, icon: string, back = false): HTMLDivElement {
  const f = document.createElement("div");
  f.className = back ? "face is-back" : "face";
  f.innerHTML = html;
  f.style.setProperty("--ic", icon);
  return f;
}

function cardLabel(c: CardData): string {
  return [c.title, c.text, c.tag].filter(Boolean).join(", ");
}

/** Plain left clicks are handled in place; modified clicks fall through so a cell can open in a new tab. */
function inPlace(e: MouseEvent): boolean {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
}

/**
 * Every interactive hex has a focusable proxy in DOM order, positioned over the canvas and sized to the hex.
 * Cells that navigate are real links with real URLs, so they work with modifier clicks and read as links to assistive tech.
 */
export function createSections(h: Hive, root: HTMLElement, actions: SectionActions) {
  let proxies: Proxy[] = [];

  const add = (
    where: Where,
    i: number,
    item: Placed,
    href: string | null,
    aria: string | null,
    label: string,
    hasText: boolean,
    fFront: HTMLElement,
    fBack: HTMLElement,
  ) => {
    const el: HTMLElement = document.createElement(href ? "a" : "div");
    el.className = href ? "cell" : "cell static";
    if (el instanceof HTMLAnchorElement && href) {
      el.href = href;
      el.draggable = false;
    }
    if (aria && href) el.setAttribute("aria-label", aria);
    fBack.hidden = true;
    el.append(fFront, fBack);
    const enter = () => {
      el.classList.add("hot");
      actions.hover(item.id);
    };
    const leave = () => {
      el.classList.remove("hot");
      if (h.hoverKey === item.id) actions.hover(null);
    };
    if (href) {
      el.addEventListener("click", (e) => {
        if (!inPlace(e)) return;
        e.preventDefault();
        if (!h.nav.busy && !h.dragMoved) actions.activate(where, i);
      });
      el.addEventListener("focus", () => el.matches(":focus-visible") && enter());
      el.addEventListener("blur", leave);
    }
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", (e) => startPan(h, e));
    root.append(el);
    proxies.push({ el, where, i, item, label, hasText, fFront, fBack, shown: false, face: "front" });
  };

  const rebuild = () => {
    root.replaceChildren();
    proxies = [];
    h.front.powered.forEach((p, i) => {
      const cell = h.data.home[i];
      if (!cell) return;
      const color = i === 0 ? "var(--cyan)" : cell.cards ? "var(--pink)" : "var(--blue)";
      const aria = cell.cards
        ? `${cell.label}, opens ${cell.cards.length} cards`
        : cell.sub
          ? `${cell.label}, ${cell.sub}`
          : cell.label;
      const back = cell.cards ? face(faceHTML("back", "Back", cell.label), "var(--pink)", true) : face("", color, true);
      add(
        "front",
        i,
        p,
        cell.path,
        aria,
        cell.label,
        false,
        face(faceHTML(cell.icon, cell.label, cell.sub), color),
        back,
      );
    });
    const sec = h.nav.sec;
    const cell = h.data.home[sec];
    h.backs[sec]?.items.forEach((it, k) => {
      if (k === 0) {
        add(
          "back",
          0,
          it,
          "/",
          "Back",
          "Back",
          false,
          face(faceHTML("back", "Back", cell?.label), "var(--pink)", true),
          face("", "var(--pink)", true),
        );
        return;
      }
      const c = cell?.cards?.[k - 1];
      if (!c) return;
      const color = c.leaf ? "var(--pink)" : "var(--cyan)";
      add(
        "back",
        k,
        it,
        c.leaf ? c.path : null,
        cardLabel(c),
        c.title,
        !!c.text,
        face(faceHTML(c.icon, c.title, null, c.text, c.tag), color),
        face("", color, true),
      );
    });
  };

  /** Positions every proxy from the cameras each frame, mirroring the canvas: same flip, same fade, same hover growth. */
  const place = () => {
    const n = h.nav;
    const { A } = phases(n.S);
    const R = h.front.R;
    const back = n.sec >= 0 ? h.backs[n.sec] : null;
    for (const o of proxies) {
      let x: number;
      let y: number;
      let size: number;
      let alpha: number;
      let flip = 0;
      if (o.where === "front" && n.sec === o.i && n.S > 0) {
        const m = movingHex(h);
        ({ x, y, size, flip } = m);
        alpha = n.S >= 1 ? 0 : 1;
      } else {
        const c = o.where === "front" ? h.frontCam : h.backCam;
        x = (o.item.x - c.x) * c.z + h.W / 2;
        y = (o.item.y - c.y) * c.z + h.H / 2;
        size = R * HEX * c.z;
        if (o.where === "front") alpha = n.sec >= 0 ? 1 - A : 1;
        else alpha = o.i === 0 ? (n.S >= 1 ? 1 : 0) : cardAlpha(n.S, o.i, (back?.items.length ?? 1) - 1);
        if (n.CF?.where === o.where && n.CF.idx === o.i) flip = n.CF.f;
      }
      size *= 1 + 0.07 * (h.grow.get(o.item.id) ?? 0);
      const cs = Math.cos(Math.PI * flip);
      const faceNow = cs < 0 ? "back" : "front";
      if (n.CF?.where === o.where && n.CF.idx === o.i && cs < 0) alpha = 0;
      const w = SQ3 * size;
      const hh = 2 * size;
      const st = o.el.style;
      st.width = `${w}px`;
      st.height = `${hh}px`;
      st.transform = `translate(${x - w / 2}px, ${y - hh / 2}px) scaleX(${Math.max(Math.abs(cs), 0.001)})`;
      st.opacity = String(alpha);
      st.visibility = alpha < 0.01 ? "hidden" : "visible";
      st.pointerEvents = alpha > 0.9 && !n.busy && !n.leafOpen ? "auto" : "none";
      st.zIndex = o.item.id === h.hoverKey || (o.where === "front" && n.sec === o.i) ? "3" : "1";
      if (faceNow !== o.face) {
        o.face = faceNow;
        o.fFront.hidden = faceNow === "back";
        o.fBack.hidden = faceNow !== "back";
        if (faceNow === "back") actions.reveal(o.fBack, 320);
      }
      st.setProperty(
        "--fs",
        `${clamp(Math.min(size * (o.hasText ? 0.15 : 0.18), (w * 0.8) / (o.label.length * 0.62)), 9, 26)}px`,
      );
      st.setProperty("--is", `${clamp(size * 0.26, 12, 40)}px`);
      st.setProperty("--ss", `${clamp(size * 0.09, 9, 13)}px`);
      st.setProperty("--tw", `${w * 0.7}px`);
      o.el.classList.toggle("tight", w < (o.hasText ? 230 : 170));
      o.el.classList.toggle("tiny", w < 90);
      const vis = alpha > 0.4;
      if (vis && !o.shown) actions.reveal(o.face === "back" ? o.fBack : o.fFront, 320);
      o.shown = vis;
    }
  };

  const clearHot = () => {
    for (const o of proxies) o.el.classList.remove("hot");
  };

  const focus = (where: Where, i: number) => {
    proxies.find((o) => o.where === where && o.i === i)?.el.focus({ preventScroll: true });
  };

  return { rebuild, place, clearHot, focus };
}
