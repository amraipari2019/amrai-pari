export const primaryNav = [
  { href: "/about", key: "about" },
  { href: "/programs", key: "programs" },
  { href: "/projects", key: "projects" },
  { href: "/events", key: "events" },
  { href: "/contact", key: "contact" },
] as const;

export const moreNav = [
  { href: "/impact", key: "impact" },
  { href: "/gallery", key: "gallery" },
  { href: "/team", key: "team" },
  { href: "/faq", key: "faq" },
  { href: "/assistance/request", key: "assistance" },
] as const;

export type NavKey = (typeof primaryNav)[number]["key"] | (typeof moreNav)[number]["key"];
