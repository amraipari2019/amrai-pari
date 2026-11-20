import Image from "next/image";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon as Facebook, YoutubeIcon as Youtube } from "@/components/ui/brand-icons";
import { Link } from "@/i18n/navigation";
import { getSettings } from "@/lib/data/public";
import { pick } from "@/lib/i18n-content";
import { siteConfig } from "@/config/site";

export async function SiteFooter() {
  const [t, nav, site, settings, locale] = await Promise.all([
    getTranslations("footer"),
    getTranslations("nav"),
    getTranslations("site"),
    getSettings(),

    getLocale(),
  ]);
  const facebook = settings.facebook_url || siteConfig.social.facebook;
  const address = pick(settings, "address", locale);

  const col = "space-y-2 text-sm";
  const link = "text-white/80 hover:text-white hover:underline";

  return (
    <footer className="mt-auto bg-primary text-white">
      <div className="bands" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-192.png"
              alt=""
              width={52}
              height={52}
              className="rounded-full bg-white"
              loading="eager"
            />
            <p className="text-lg font-bold">{site("name")}</p>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/75">{t("about")}</p>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-highlight">{t("explore")}</h2>
          <ul className={col}>
            {(["about", "programs", "projects", "impact", "events", "gallery", "team"] as const).map((k) => (
              <li key={k}>
                <Link href={`/${k}`} className={link}>
                  {nav(k)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-highlight">{t("help")}</h2>
          <ul className={col}>
            <li>
              <Link href="/get-involved" className={link}>
                {nav("volunteer")}
              </Link>
            </li>
            <li>
              <Link href="/contribute" className={link}>
                {nav("contribute")}
              </Link>
            </li>
            <li>
              <Link href="/partnership" className={link}>
                {nav("partnership")}
              </Link>
            </li>
            <li>
              <Link href="/assistance/request" className={link}>
                {nav("assistance")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className={link}>
                {nav("faq")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-highlight">{t("reach")}</h2>
          <ul className={col}>
            <li className="flex gap-2 text-white/80">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{address || site("area")}</span>
            </li>
            {settings.phone ? (
              <li>
                <a href={`tel:${settings.phone}`} className={`${link} flex gap-2`}>
                  <Phone className="mt-0.5 size-4" aria-hidden /> {settings.phone}
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className={`${link} flex gap-2`}>
                  <Mail className="mt-0.5 size-4" aria-hidden /> {settings.email}
                </a>
              </li>
            ) : null}
            <li>
              <a href={facebook} target="_blank" rel="noopener noreferrer" className={`${link} flex gap-2`}>
                <Facebook className="mt-0.5 size-4" aria-hidden /> {t("facebook")}
              </a>
            </li>
            {settings.youtube_url ? (
              <li>
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link} flex gap-2`}
                >
                  <Youtube className="mt-0.5 size-4" aria-hidden /> {t("youtube")}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-xs text-white/65 sm:px-6">
          <p>
            © {site("name")}. {t("rights")}
          </p>
          <Link href="/privacy-policy" className="hover:text-white">
            {t("privacy")}
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-white">
            {t("terms")}
          </Link>
          <NextLink href="/admin" prefetch={false} className="ml-auto hover:text-white">
            {t("staff")}
          </NextLink>
        </div>
      </div>
    </footer>
  );
}
