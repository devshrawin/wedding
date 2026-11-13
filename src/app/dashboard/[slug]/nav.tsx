"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, HandCoins, Home, Send, Settings } from "lucide-react";
import { useTr } from "@/components/lang";
import { cn } from "@/lib/utils";

export function DashboardNav({ slug, pending }: { slug: string; pending: number }) {
  const tr = useTr();
  const pathname = usePathname();
  const base = `/dashboard/${slug}`;
  const tabs = [
    { href: base, icon: Home, label: tr("Home", "होम") },
    { href: `${base}/gifts`, icon: Gift, label: tr("Gifts", "तोहफ़े") },
    { href: `${base}/shagun`, icon: HandCoins, label: tr("Shagun", "शगुन"), badge: pending },
    { href: `${base}/share`, icon: Send, label: tr("Share", "शेयर") },
    { href: `${base}/settings`, icon: Settings, label: tr("Settings", "सेटिंग") },
  ];
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:sticky md:top-0 md:border-b md:border-t-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={tr("Registry sections", "रजिस्ट्री के हिस्से")}
    >
      <ul className="mx-auto flex max-w-3xl">
        {tabs.map((t) => {
          const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold md:h-14 md:flex-row md:gap-2 md:text-[15px]",
                  active ? "text-primary" : "text-muted hover:text-ink",
                )}
              >
                <span className="relative">
                  <t.icon className="size-6 md:size-5" strokeWidth={active ? 2.4 : 2} />
                  {!!t.badge && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{t.badge}</span>
                  )}
                </span>
                {t.label}
                {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary md:bottom-0 md:top-auto" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
