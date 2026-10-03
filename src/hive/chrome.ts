import { createAudio } from "./fx/audio";
import { decrypt } from "./fx/decrypt";
import { resetSheet } from "./interact";
import { createNavigator, currentRoute } from "./nav";
import { setupHexButton } from "./overlay/hexbtn";
import { createLeaf } from "./overlay/leaf";
import { createPath } from "./overlay/path";
import { createSections } from "./overlay/sections";
import { createSettings } from "./overlay/settings";
import { createTooltip } from "./overlay/tooltip";
import { savePrefs } from "./prefs";
import type { Route } from "./route";
import { on, type Hive } from "./state";

export function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is missing`);
  return el;
}

/** Wires every DOM piece over the canvas to the hive state and to each other; main only drives the frame loop. */
export function createChrome(h: Hive) {
  const reveal = (el: Element, ms: number) => decrypt(el, ms, on(h, "decrypt"));
  const electric = () => on(h, "electric");
  const tip = createTooltip(byId("tip", HTMLElement), () => on(h, "glitch"), reveal);
  const audio = createAudio(() => h.prefs);
  const changed = () => {};

  const cells = byId("cells", HTMLElement);
  const leafBack = byId("leaf-back", HTMLButtonElement);
  const leaf = createLeaf(
    h,
    { leaf: byId("leaf", HTMLElement), inner: byId("leaf-inner", HTMLElement), back: leafBack, cells },
    reveal,
  );
  const path = createPath(h, byId("path", HTMLElement), reveal);
  const sections = createSections(h, cells, {
    activate: (where, i) => {
      if (where === "front") {
        if (h.data.home[i]?.cards) nav.openSection(i);
        else nav.openLeaf("front", i);
      } else if (i === 0) nav.back();
      else nav.openLeaf("back", i);
    },
    hover: (id) => {
      h.hoverKey = id;
      changed();
    },
    reveal,
  });

  const nav = createNavigator(
    h,
    {
      rebuild: sections.rebuild,
      showLeaf: leaf.show,
      hideLeaf: leaf.hide,
      busy: (busy) => {
        if (!busy) return;
        h.hoverKey = null;
        sections.clearHot();
        tip.hide();
      },
      settled: (from: Route) => {
        path();
        changed();
        const to = currentRoute(h);
        if (from.leaf && !to.leaf) sections.focus(from.leaf.where, from.leaf.idx);
        else if (from.sec >= 0 && to.sec < 0) sections.focus("front", from.sec);
        else if (from.sec < 0 && to.sec >= 0) sections.focus("back", 0);
      },
      sectionChange: changed,
    },
    h.data.homeTitle,
  );
  setupHexButton(leafBack, "above", electric, tip);
  leafBack.addEventListener("click", () => nav.back());

  const applyEffects = () => document.body.classList.toggle("glitchy", on(h, "glitch"));
  const settings = createSettings(
    h,
    {
      root: byId("settings", HTMLElement),
      button: byId("settings-btn", HTMLButtonElement),
      menu: byId("menu", HTMLElement),
      close: byId("menu-close", HTMLButtonElement),
      volume: byId("volume", HTMLInputElement),
      reset: byId("reset", HTMLButtonElement),
    },
    tip,
    {
      changed: (name) => {
        savePrefs(() => localStorage, h.prefs);
        applyEffects();
        if (name === "sound") audio.toggled();
        if (name === "volume") audio.setLevel();
      },
      reset: () => resetSheet(h, changed),
      reveal,
    },
  );
  applyEffects();

  return {
    nav,
    changed,
    reducedChanged: applyEffects,
    place: () => {
      sections.place();
      leaf.place();
    },
    gesture: audio.gesture,
    escape: () => {
      if (settings.isOpen()) settings.close();
      else nav.back();
    },
  };
}
