import { clamp } from "../math";
import type { Tip } from "./hexbtn";

/**
 * Tooltips arrive the way the city glitches: sliced, split into pink and cyan, then settling while the words decrypt.
 * They repeat an accessible name that is already on the control, so the element stays hidden from assistive tech.
 */
export function createTooltip(el: HTMLElement, glitch: () => boolean, reveal: (el: Element, ms: number) => void): Tip {
  return {
    show(text, x, y, align) {
      const same = !el.hidden && el.dataset["text"] === text;
      el.textContent = text;
      el.dataset["text"] = text;
      el.hidden = false;
      const r = el.getBoundingClientRect();
      const left = align === "left" ? x - r.width : align === "center" ? x - r.width / 2 : x;
      el.style.left = `${clamp(left, 8, innerWidth - r.width - 8)}px`;
      el.style.top = `${clamp(y - r.height / 2, 8, innerHeight - r.height - 8)}px`;
      if (same) return;
      el.classList.remove("glitch-in");
      if (glitch()) {
        void el.offsetWidth;
        el.classList.add("glitch-in");
      }
      reveal(el, 280);
    },
    hide() {
      el.hidden = true;
    },
  };
}
