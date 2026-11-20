import { getTranslations } from "next-intl/server";
import { formatDate, pick } from "@/lib/i18n-content";
import type { ImpactStat } from "@/lib/types";

export async function ImpactList({
  stats,
  locale,
  detailed = false,
}: {
  stats: ImpactStat[];
  locale: string;
  detailed?: boolean;
}) {
  const t = await getTranslations("impact");
  return (
    <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.id} className="border-t-4 border-secondary pt-4">
          <dd className="text-4xl font-extrabold text-primary">{s.value}</dd>
          <dt className="mt-1 font-medium">{pick(s, "label", locale)}</dt>
          {detailed && (s.as_of || s.source) ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {s.as_of ? `${t("asOf")} ${formatDate(s.as_of, locale)}` : null}
              {s.as_of && s.source ? ". " : null}
              {s.source ? `${t("source")}: ${s.source}` : null}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
