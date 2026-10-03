import type { APIRoute, GetStaticPaths } from "astro";
import { getProjects } from "../../lib/content";
import { renderOg, type OgCard } from "../../lib/og";
import { site } from "../../site";

/** One card per project plus a default for every other page; a new project file gets its card with no code change. */
export const getStaticPaths = (async () => {
  const projects = await getProjects();
  const home: OgCard = {
    title: site.name,
    summary: site.description,
    icon: "user",
    tags: ["remote", "utc+7", "open to work"],
    cmd: "cat about.md",
  };
  return [
    { params: { slug: "home" }, props: { card: home } },
    ...projects.map((p) => ({
      params: { slug: p.id },
      props: {
        card: {
          title: p.data.title,
          summary: p.data.summary,
          icon: p.data.icon,
          tags: p.data.tags,
          cmd: `cat projects/${p.id}.md`,
        } satisfies OgCard,
      },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: OgCard }> = async ({ props }) =>
  new Response(await renderOg(props.card), { headers: { "Content-Type": "image/png" } });
