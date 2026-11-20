import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hind_Siliguri } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "../globals.css";

const latin = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const bengali = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#120167" };

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${t("name")} — ${t("tagline")}`, template: `%s | ${t("name")}` },
    description: t("description"),
    openGraph: {
      siteName: t("name"),
      locale: locale === "bn" ? "bn_BD" : "en_US",
      type: "website",
      images: [{ url: "/brand/logo-512.png", width: 512, height: 512 }],
    },
    alternates: {
      languages: { en: "/", bn: "/bn" },
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${latin.variable} ${bengali.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
