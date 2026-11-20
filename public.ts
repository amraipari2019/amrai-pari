import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Album,
  EventItem,
  Faq,
  ImpactStat,
  Partner,
  Photo,
  Program,
  Project,
  SiteSettings,
  TeamMember,
} from "@/lib/types";

/**
 * Public, cached reads. Each function is tagged; the admin panel calls
 * updateTag(<tag>) after a change so visitors see edits immediately.
 * When Supabase isn't configured yet, everything returns empty and the
 * pages show friendly placeholders instead of crashing.
 */
export const TAGS = {
  settings: "settings",
  programs: "programs",
  projects: "projects",
  events: "events",
  gallery: "gallery",
  team: "team",
  faqs: "faqs",
  impact: "impact",
  partners: "partners",
} as const;

async function safe<T>(fallback: T, run: () => PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { data, error } = await run();
    if (error) {
      console.error("[supabase]", error);
      return fallback;
    }
    return data ?? fallback;
  } catch (e) {
    console.error("[supabase]", e);
    return fallback;
  }
}

export async function getSettings(): Promise<Partial<SiteSettings>> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("hours");
  return safe<Partial<SiteSettings>>({}, () =>
    createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle(),
  );
}

export async function getPrograms(): Promise<Program[]> {
  "use cache";
  cacheTag(TAGS.programs);
  cacheLife("hours");
  return safe<Program[]>([], () =>
    createPublicClient().from("programs").select("*").eq("is_published", true).order("sort_order"),
  );
}

export async function getProgram(slug: string): Promise<Program | null> {
  "use cache";
  cacheTag(TAGS.programs);
  cacheLife("hours");
  return safe<Program | null>(null, () =>
    createPublicClient().from("programs").select("*").eq("slug", slug).eq("is_published", true).maybeSingle(),
  );
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  return safe<Project[]>([], () =>
    createPublicClient()
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("sort_order")
      .order("start_date", { ascending: false }),
  );
}

export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  return safe<Project | null>(null, () =>
    createPublicClient().from("projects").select("*").eq("slug", slug).eq("is_published", true).maybeSingle(),
  );
}

export async function getEvents(): Promise<{ upcoming: EventItem[]; past: EventItem[] }> {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife("hours");
  const all = await safe<EventItem[]>([], () =>
    createPublicClient().from("events").select("*").eq("is_published", true).order("starts_at"),
  );
  const now = Date.now();
  const isUpcoming = (e: EventItem) => new Date(e.ends_at ?? e.starts_at).getTime() >= now;
  return {
    upcoming: all.filter(isUpcoming),
    past: all.filter((e) => !isUpcoming(e)).reverse(),
  };
}

export async function getEvent(slug: string): Promise<EventItem | null> {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife("hours");
  return safe<EventItem | null>(null, () =>
    createPublicClient().from("events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle(),
  );
}

export async function getAlbums(): Promise<Album[]> {
  "use cache";
  cacheTag(TAGS.gallery);
  cacheLife("hours");
  return safe<Album[]>([], () =>
    createPublicClient()
      .from("gallery_albums")
      .select("*")
      .eq("is_published", true)
      .order("sort_order")
      .order("album_date", { ascending: false }),
  );
}

export async function getAlbum(slug: string): Promise<{ album: Album; photos: Photo[] } | null> {
  "use cache";
  cacheTag(TAGS.gallery);
  cacheLife("hours");
  const album = await safe<Album | null>(null, () =>
    createPublicClient()
      .from("gallery_albums")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
  );
  if (!album) return null;
  const photos = await safe<Photo[]>([], () =>
    createPublicClient().from("gallery_photos").select("*").eq("album_id", album.id).order("sort_order"),
  );
  return { album, photos };
}

export async function getRecentPhotos(limit = 6): Promise<Photo[]> {
  "use cache";
  cacheTag(TAGS.gallery);
  cacheLife("hours");
  return safe<Photo[]>([], () =>
    createPublicClient()
      .from("gallery_photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function getTeam(): Promise<TeamMember[]> {
  "use cache";
  cacheTag(TAGS.team);
  cacheLife("hours");
  return safe<TeamMember[]>([], () =>
    createPublicClient().from("team_members").select("*").eq("is_published", true).order("sort_order"),
  );
}

export async function getFaqs(): Promise<Faq[]> {
  "use cache";
  cacheTag(TAGS.faqs);
  cacheLife("hours");
  return safe<Faq[]>([], () =>
    createPublicClient().from("faqs").select("*").eq("is_published", true).order("sort_order"),
  );
}

export async function getImpactStats(): Promise<ImpactStat[]> {
  "use cache";
  cacheTag(TAGS.impact);
  cacheLife("hours");
  return safe<ImpactStat[]>([], () =>
    createPublicClient().from("impact_stats").select("*").eq("is_verified", true).order("sort_order"),
  );
}

export async function getPartners(): Promise<Partner[]> {
  "use cache";
  cacheTag(TAGS.partners);
  cacheLife("hours");
  return safe<Partner[]>([], () =>
    createPublicClient().from("partners").select("*").eq("is_published", true).order("sort_order"),
  );
}
