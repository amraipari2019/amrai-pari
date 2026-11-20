/**
 * Verified organisational facts (from the project brief).
 *
 * Anything that is `null` is NOT YET SUPPLIED and must never be guessed.
 * From Phase 4 onward, editable values (contact, social links, payment
 * details) move into the `site_settings` table and are managed from /admin;
 * this file then only provides safe fallbacks.
 */
export const siteConfig = {
  name: "Amrai Pari Foundation",
  tagline: "Everyone Deserves a Chance",
  established: 2019,
  founder: "Sharmin Nasima Banu",
  area: "Mirpur-13, Dhaka, Bangladesh",
  focusAreas: ["education", "healthcare", "community-building"] as const,
  permanentVolunteers: "10+",
  partners: ["WeCareBD Foundation", "Lions"],
  social: {
    facebook: "https://www.facebook.com/share/1NA6EcdAW6/",
    youtube: null as string | null,
  },
  registration: {
    isRegistered: true,
    authority: null as string | null, // PENDING — do not invent
    number: null as string | null, // PENDING — do not invent
  },
  contact: {
    email: null as string | null,
    phone: null as string | null,
    whatsapp: null as string | null,
    address: null as string | null,
    mapEmbedUrl: null as string | null,
  },
} as const;
