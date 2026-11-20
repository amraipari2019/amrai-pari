import { defineRouting } from "next-intl/routing";

/**
 * Locale routing.
 * English is the default and is served without a prefix (/about),
 * Bengali is served under /bn (/bn/about). The chosen language is
 * remembered in a cookie so it persists while visitors navigate.
 */
export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
