import type { Locale } from "@/lib/types";

/**
 * Read a bilingual column: pick(row, "title", "bn") returns row.title_bn,
 * falling back to English so visitors never see a blank.
 */
export function pick<T extends object>(row: T, field: string, locale: string): string {
  const r = row as Record<string, unknown>;
  const local = r[`${field}_${locale}`];
  if (typeof local === "string" && local.trim()) return local;
  const en = r[`${field}_en`];
  return typeof en === "string" ? en : "";
}

const tz = "Asia/Dhaka";

export function formatDate(value: string | null | undefined, locale: Locale | string, withTime = false) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00+06:00` : value);
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(d);
}

export function formatNumber(value: number | string, locale: string) {
  if (locale !== "bn") return String(value);
  return String(value).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

/** Split plain text typed in the admin into paragraphs. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
