import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { CardData, CellData, HiveData, LeafData } from "../hive/data";
import type { IconName } from "../hive/icons";
import { site } from "../site";

type StackGroup = CollectionEntry<"stack">["data"]["groups"][number]["name"];
type HomeId = "about" | "now" | "hours";

const GROUP_ICON: Record<StackGroup, IconName> = {
  frontend: "code",
  backend: "server",
  "data and infra": "cloud",
  tooling: "terminal",
};

/** Home cells in slot order: the name in the centre, then clockwise from the top; the order fixes their place on the sheet. */
export const HOME_ORDER = ["about", "projects", "stack", "experience", "now", "hours"] as const;

export const SECTIONS = {
  projects: { icon: "folder", label: "projects", title: "Projects" },
  stack: { icon: "layers", label: "stack", title: "Stack" },
  experience: { icon: "briefcase", label: "experience", title: "Experience" },
} as const satisfies Record<string, { icon: IconName; label: string; title: string }>;

export function pageTitle(label: string): string {
  return `${label} · ${site.name}`;
}

export const HOME_TITLE = `${site.name}, ${site.role.toLowerCase()}`;

export async function getProjects() {
  return (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
}

export async function getExperience() {
  return (await getCollection("experience")).sort((a, b) => b.data.start.localeCompare(a.data.start));
}

export async function getStack() {
  const entry = await getEntry("stack", "stack");
  if (!entry) throw new Error("src/content/stack.md is missing");
  return entry;
}

export async function getHomePage(id: HomeId) {
  const entry = await getEntry("home", id);
  if (!entry) throw new Error(`src/content/home/${id}.md is missing`);
  return entry;
}

export function homeLabel(entry: CollectionEntry<"home">): string {
  return entry.data.label ?? site.name;
}

export function experienceTag({ data }: CollectionEntry<"experience">): string {
  const start = data.start.slice(0, 4);
  return data.end ? `${start} to ${data.end.slice(0, 4)}` : `since ${start}`;
}

export function experienceTitle({ data }: CollectionEntry<"experience">): string {
  return `${data.role} at ${data.company}`;
}

function bodyHtml(entry: { rendered?: { html: string } }): string {
  return entry.rendered?.html ?? "";
}

function homeCell(entry: CollectionEntry<"home">): CellData {
  const label = homeLabel(entry);
  return {
    id: entry.id,
    icon: entry.data.icon,
    label,
    sub: entry.data.sub ?? null,
    path: `/${entry.id}/`,
    pageTitle: pageTitle(entry.data.title),
    leaf: {
      cmd: `cat ${entry.id}.md`,
      title: entry.data.title,
      html: bodyHtml(entry),
      tags: entry.data.tags,
      links: [],
    },
    cards: null,
  };
}

function sectionCell(id: keyof typeof SECTIONS, cards: CardData[]): CellData {
  const s = SECTIONS[id];
  return {
    id,
    icon: s.icon,
    label: s.label,
    sub: null,
    path: `/${id}/`,
    pageTitle: pageTitle(s.title),
    leaf: null,
    cards,
  };
}

function leafCard(base: Omit<CardData, "path" | "pageTitle" | "leaf">, path: string, leaf: LeafData): CardData {
  return { ...base, path, pageTitle: pageTitle(leaf.title), leaf };
}

/** Builds the JSON every page embeds, so the canvas can open into any route without another request. */
export async function getHiveData(): Promise<HiveData> {
  const [projects, experience, stack, about, now, hours] = await Promise.all([
    getProjects(),
    getExperience(),
    getStack(),
    getHomePage("about"),
    getHomePage("now"),
    getHomePage("hours"),
  ]);
  const projectCards = projects.map((p) =>
    leafCard(
      { id: p.id, icon: p.data.icon, title: p.data.title, text: p.data.summary, tag: p.data.status },
      `/projects/${p.id}/`,
      {
        cmd: `cat projects/${p.id}.md`,
        title: p.data.title,
        html: bodyHtml(p),
        tags: p.data.tags,
        links: p.data.links,
      },
    ),
  );
  const stackCards = stack.data.groups.flatMap((g) =>
    g.items.map((item): CardData => ({
      id: item.replaceAll(" ", "-"),
      icon: GROUP_ICON[g.name],
      title: item,
      text: null,
      tag: g.name,
      path: null,
      pageTitle: null,
      leaf: null,
    })),
  );
  const experienceCards = experience.map((e) => {
    const base = { id: e.id, icon: e.data.icon, title: e.data.title, text: e.data.summary, tag: experienceTag(e) };
    if (!e.body?.trim()) return { ...base, path: null, pageTitle: null, leaf: null };
    return leafCard(base, `/experience/${e.id}/`, {
      cmd: `cat experience/${e.id}.md`,
      title: experienceTitle(e),
      html: bodyHtml(e),
      tags: [experienceTag(e)],
      links: [],
    });
  });
  const cells: Record<(typeof HOME_ORDER)[number], CellData> = {
    about: homeCell(about),
    projects: sectionCell("projects", projectCards),
    stack: sectionCell("stack", stackCards),
    experience: sectionCell("experience", experienceCards),
    now: homeCell(now),
    hours: homeCell(hours),
  };
  return { home: HOME_ORDER.map((id) => cells[id]) };
}

/** JSON inside a script element must not contain `</script>`; escaping every `<` rules that out. */
export function serializeData(data: HiveData): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
