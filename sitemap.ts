import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getAlbums, getEvents, getPrograms, getProjects } from "@/lib/data/public";

const staticPaths = [
  "",
  "/about",
  "/programs",
  "/projects",
  "/impact",
  "/get-involved",
  "/contribute",
  "/events",
  "/gallery",
  "/team",
  "/contact",
  "/faq",
  "/partnership",
  "/assistance/request",
  "/privacy-policy",
  "/terms-and-conditions",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programs, projects, events, albums] = await Promise.all([
    getPrograms(),
    getProjects(),
    getEvents(),
    getAlbums(),
  ]);
  const paths = [
    ...staticPaths,
    ...programs.map((p) => `/programs/${p.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
    ...[...events.upcoming, ...events.past].map((e) => `/events/${e.slug}`),
    ...albums.map((a) => `/gallery/${a.slug}`),
  ];
  return paths.map((p) => ({
    url: `${siteUrl}${p || "/"}`,
    alternates: { languages: { en: `${siteUrl}${p || "/"}`, bn: `${siteUrl}/bn${p}` } },
  }));
}
