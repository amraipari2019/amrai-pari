"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Languages } from "lucide-react";

const cls =
  "inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted";

function Switcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const next = locale === "en" ? "bn" : "en";

  return (
    <button
      type="button"
      lang={next}
      onClick={() =>
        // @ts-expect-error -- params always match the current pathname
        router.replace({ pathname, params }, { locale: next })
      }
      className={cls}
      aria-label={`${t("label")}: ${t(next)}`}
    >
      <Languages className="size-4" aria-hidden />
      {t(next)}
    </button>
  );
}

/** Toggles between English and Bengali while staying on the same page. */
export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const next = locale === "en" ? "bn" : "en";
  return (
    <Suspense
      fallback={
        <span className={cls} lang={next}>
          <Languages className="size-4" aria-hidden />
          {t(next)}
        </span>
      }
    >
      <Switcher />
    </Suspense>
  );
}
