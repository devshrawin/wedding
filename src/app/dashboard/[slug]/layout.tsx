import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Mark } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { getTr } from "@/lib/i18n";
import { themeOf } from "@/lib/utils";
import { DashboardNav } from "./nav";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const [{ tr }, { stats }] = await Promise.all([getTr(), loadRegistryData(registry.id)]);
  const theme = themeOf(registry.theme);

  return (
    <div
      className="min-h-dvh pb-24 md:pb-10"
      style={{ "--primary": theme.primary, "--primary-soft": theme.soft, "--primary-deep": theme.deep } as React.CSSProperties}
    >
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" aria-label="Giftr">
            <Mark />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold leading-tight">
              {registry.partnerOne} & {registry.partnerTwo}
            </p>
            <Link href={`/r/${registry.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {tr("View guest page", "मेहमानों वाला पेज देखें")} <ExternalLink className="size-3.5" />
            </Link>
          </div>
          <LangToggle />
        </div>
      </header>
      <DashboardNav slug={registry.slug} pending={stats.pendingCount} />
      <main className="mx-auto max-w-3xl px-4 pt-6">{children}</main>
    </div>
  );
}
