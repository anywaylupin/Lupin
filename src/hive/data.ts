import type { IconName } from "./icons";

/** Everything the hive draws, built from the content collections at build time and embedded in every page as JSON. */
export interface HiveData {
  homeTitle: string;
  home: CellData[];
}

export interface LinkData {
  label: string;
  href: string | null;
}

export interface LeafData {
  cmd: string;
  title: string;
  html: string;
  tags: string[];
  links: LinkData[];
}

export interface CardData {
  id: string;
  icon: IconName;
  title: string;
  text: string | null;
  tag: string | null;
  path: string | null;
  pageTitle: string | null;
  leaf: LeafData | null;
}

export interface CellData {
  id: string;
  icon: IconName;
  label: string;
  sub: string | null;
  path: string;
  pageTitle: string;
  leaf: LeafData | null;
  cards: CardData[] | null;
}

export const DATA_ELEMENT_ID = "hive-data";
