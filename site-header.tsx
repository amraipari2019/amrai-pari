import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu, MoreMenu, NavLink } from "./nav-client";
import { moreNav, primaryNav } from "./nav-items";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const site = await getTranslations("site");
  const labels = Object.fromEntries([...primaryNav, ...moreNav].map((i) => [i.key, t(i.key)])) as Record<
    string,
    string
  >;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/brand/logo-192.png" alt={site("logoAlt")} width={40} height={40} priority />
          <span className="text-[1.05rem] leading-tight font-bold text-primary">{site("name")}</span>
        </Link>

        <nav aria-label={t("mainNav")} className="ml-auto hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {t(item.key)}
            </NavLink>
          ))}
          <MoreMenu label={t("more")} items={moreNav.map((i) => ({ href: i.href, label: t(i.key) }))} />
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <LanguageSwitcher />
          <Link
            href="/contribute"
            className={buttonVariants({ variant: "outline", size: "sm", className: "hidden sm:inline-flex" })}
          >
            {t("contribute")}
          </Link>
          <Link
            href="/get-involved"
            className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}
          >
            {t("getInvolved")}
          </Link>
          <MobileMenu
            openLabel={t("openMenu")}
            closeLabel={t("closeMenu")}
            items={[
              { href: "/", label: t("home") },
              ...primaryNav.map((i) => ({ href: i.href, label: labels[i.key] })),
              ...moreNav.map((i) => ({ href: i.href, label: labels[i.key] })),
              { href: "/get-involved", label: t("getInvolved") },
              { href: "/contribute", label: t("contribute") },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
