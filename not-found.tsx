import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <div className="bands-thin mt-6 w-24" aria-hidden />
      <h1 className="mt-6 text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("body")}</p>
      <Link href="/" className={buttonVariants({ variant: "navy", className: "mt-8" })}>
        {t("backHome")}
      </Link>
    </main>
  );
}
