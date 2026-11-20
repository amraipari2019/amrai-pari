"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("body")}</p>
      <Button variant="navy" className="mt-8" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
}
