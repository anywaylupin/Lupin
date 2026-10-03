import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { ICON_NAMES } from "./hive/icons";

const icon = z.enum(ICON_NAMES);
const link = z.object({ label: z.string(), href: z.url().nullable() });
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, "use YYYY-MM");

/** One file per project; the card shows title, summary and status, the leaf shows the body. */
const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    icon,
    summary: z.string(),
    status: z.enum(["shipped", "in progress", "planned"]),
    order: z.number(),
    tags: z.array(z.string()),
    links: z.array(link).default([]),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/experience" }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    role: z.string(),
    icon,
    start: yearMonth,
    end: yearMonth.nullable(),
    summary: z.string(),
  }),
});

/** The single-page cells on the home sheet: about, now and hours. */
const home = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/home" }),
  schema: z.object({
    label: z.string().optional(),
    sub: z.string().optional(),
    icon,
    title: z.string(),
    tags: z.array(z.string()),
  }),
});

const stack = defineCollection({
  loader: glob({ pattern: "stack.md", base: "./src/content" }),
  schema: z.object({
    groups: z.array(
      z.object({
        name: z.enum(["frontend", "backend", "data and infra", "tooling"]),
        items: z.array(z.string()).min(1),
      }),
    ),
  }),
});

export const collections = { projects, experience, home, stack };
