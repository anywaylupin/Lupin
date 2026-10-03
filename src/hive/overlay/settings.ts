import { EFFECTS, type Effect } from "../prefs";
import type { Hive } from "../state";
import type { Tip } from "./hexbtn";

export interface SettingsEls {
  root: HTMLElement;
  button: HTMLButtonElement;
  menu: HTMLElement;
  close: HTMLButtonElement;
  volume: HTMLInputElement;
  reset: HTMLButtonElement;
}

export interface SettingsActions {
  changed: (name: Effect | "volume") => void;
  reset: () => void;
  reveal: (el: Element, ms: number) => void;
}

function isEffect(v: string | undefined): v is Effect {
  return EFFECTS.some((e) => e === v);
}

/** The settings hex unfolds into a panel in place, without rotating; closing folds it back the same way. */
export function createSettings(h: Hive, els: SettingsEls, tip: Tip, actions: SettingsActions) {
  const { root, button, menu, close, volume } = els;
  const switches = [...menu.querySelectorAll<HTMLButtonElement>(".switch")];
  const isOpen = () => root.classList.contains("open");
  const delay = (ms: number) => (h.reduced ? 0 : ms);

  const apply = () => {
    for (const sw of switches) {
      const name = sw.dataset["pref"];
      if (isEffect(name)) sw.setAttribute("aria-checked", String(h.prefs[name]));
    }
    volume.value = String(h.prefs.volume);
    volume.style.setProperty("--p", `${h.prefs.volume * 100}%`);
  };

  const open = () => {
    tip.hide();
    menu.hidden = false;
    root.style.setProperty("--open-h", `${menu.scrollHeight + 2}px`);
    root.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    setTimeout(() => actions.reveal(menu, 420), delay(200));
    setTimeout(() => close.focus({ preventScroll: true }), delay(320));
  };

  const shut = (refocus: boolean) => {
    root.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (!isOpen()) menu.hidden = true;
    }, delay(420));
    if (refocus) button.focus({ preventScroll: true });
  };

  button.addEventListener("click", () => (isOpen() ? shut(false) : open()));
  close.addEventListener("click", () => shut(true));
  document.addEventListener("pointerdown", (e) => {
    if (isOpen() && e.target instanceof Node && !root.contains(e.target)) shut(false);
  });
  button.addEventListener("pointerenter", () => {
    if (isOpen()) return;
    const r = button.getBoundingClientRect();
    tip.show(button.dataset["tip"] ?? "", r.left - 16, r.top + r.height / 2, "left");
  });
  button.addEventListener("pointerleave", () => tip.hide());
  for (const sw of switches) {
    sw.addEventListener("click", () => {
      const name = sw.dataset["pref"];
      if (!isEffect(name)) return;
      h.prefs[name] = !h.prefs[name];
      apply();
      actions.changed(name);
    });
  }
  volume.addEventListener("input", () => {
    h.prefs.volume = Number.parseFloat(volume.value);
    apply();
    actions.changed("volume");
  });
  els.reset.addEventListener("click", () => {
    shut(true);
    actions.reset();
  });
  apply();

  return { isOpen, close: () => shut(true), apply };
}
