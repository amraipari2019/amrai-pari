import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** Page title + language alternates for a static route such as "/about". */
export async function pageMetadata(
  locale: string,
  namespace: string,
  path: string,
  key = "title",
  descriptionKey?: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  return {
    title: t(key),
    description: descriptionKey ? t(descriptionKey) : undefined,
    alternates: {
      canonical: locale === "en" ? path : `/bn${path}`,
      languages: { en: path, bn: `/bn${path}` },
    },
  };
}
