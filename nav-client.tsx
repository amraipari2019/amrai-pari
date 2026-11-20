"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function ActiveNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-[0.95rem] font-medium text-foreground/80 transition-colors hover:text-primary",
        active && "text-primary underline decoration-brand-red decoration-2 underline-offset-8",
      )}
    >
      {children}
    </Link>
  );
}

function MoreMenuInner({ label, items }: { label: string; items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Remember which page the menu was opened on; navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenOn(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[0.95rem] font-medium text-foreground/80 hover:text-primary"
      >
        {label}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <ul className="absolute right-0 mt-2 w-60 rounded-lg border border-border bg-white p-1.5 shadow-lg">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted hover:text-primary"
                aria-current={isActive(pathname, i.href) ? "page" : undefined}
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MobileMenuInner({
  items,
  openLabel,
  closeLabel,
}: {
  items: Item[];
  openLabel: string;
  closeLabel: string;
}) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-md text-primary hover:bg-muted"
        aria-label={openLabel}
        aria-expanded={open}
      >
        <Menu className="size-6" aria-hidden />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-primary/40" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="ml-auto flex h-full w-[min(22rem,88vw)] flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-end border-b border-border px-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-md text-primary hover:bg-muted"
                aria-label={closeLabel}
              >
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-3">
              {items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={isActive(pathname, i.href) ? "page" : undefined}
                    className="block rounded-md px-3 py-3 text-lg font-medium text-primary hover:bg-muted aria-[current=page]:bg-muted"
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="bands-thin" aria-hidden />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/*
 * These read the current URL, which pages with unknown slugs only learn at
 * request time. Suspense lets Next.js prerender a static fallback first.
 */
const linkClass =
  "rounded-md px-3 py-2 text-[0.95rem] font-medium text-foreground/80 transition-colors hover:text-primary";

export function NavLink(props: { href: string; children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={linkClass}>
          {props.children}
        </Link>
      }
    >
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

export function MoreMenu(props: { label: string; items: Item[] }) {
  return (
    <Suspense
      fallback={
        <span className="inline-flex items-center gap-1 px-3 py-2 text-[0.95rem] font-medium text-foreground/80">
          {props.label} <ChevronDown className="size-4" aria-hidden />
        </span>
      }
    >
      <MoreMenuInner {...props} />
    </Suspense>
  );
}

export function MobileMenu(props: { items: Item[]; openLabel: string; closeLabel: string }) {
  return (
    <Suspense
      fallback={
        <span className="inline-flex size-10 items-center justify-center text-primary lg:hidden">
          <Menu className="size-6" aria-hidden />
        </span>
      }
    >
      <MobileMenuInner {...props} />
    </Suspense>
  );
}
