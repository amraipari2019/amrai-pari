import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, EmptyState, PageHero } from "@/components/ui/page-hero";
import { getFaqs } from "@/lib/data/public";
import { pick } from "@/lib/i18n-content";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  return pageMetadata(locale, "faq", "/faq");
}

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, nav, common, faqs] = await Promise.all([
    getTranslations("faq"),
    getTranslations("nav"),
    getTranslations("common"),
    getFaqs(),
  ]);
  return (
    <main>
      <PageHero title={t("title")} />
      <Container className="max-w-3xl py-16">
        {faqs.length ? (
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((f) => (
              <details key={f.id} className="group py-2">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold text-primary [&::-webkit-details-marker]:hidden">
                  {pick(f, "question", locale)}
                  <ChevronDown
                    className="size-5 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 whitespace-pre-line text-muted-foreground">{pick(f, "answer", locale)}</p>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState>{common("nothingYet")}</EmptyState>
        )}
        <p className="mt-10 text-lg">
          {t("intro")}{" "}
          <Link href="/contact" className="font-semibold text-accent underline underline-offset-4">
            {nav("contact")}
          </Link>
        </p>
      </Container>
    </main>
  );
}
