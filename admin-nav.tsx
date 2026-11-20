"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Group = { title: string; items: { href: string; label: string }[] };

export function AdminNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-5 py-3 text-sm font-semibold md:hidden"
        aria-expanded={open}
      >
        <Menu className="size-5" aria-hidden /> Menu
      </button>
      <nav className={cn("space-y-5 px-3 py-4", !open && "hidden md:block")} aria-label="Admin">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-2 pb-1 text-xs font-semibold text-highlight">{g.title}</p>
            <ul>
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={() => setOpen(false)}
                    aria-current={active(i.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white",
                      active(i.href) && "bg-white/15 font-semibold text-white",
                    )}
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
