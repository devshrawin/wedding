import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@astryxdesign/core/Avatar";
import { ExternalLink } from "lucide-react";
import { Mark } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { getTr } from "@/lib/i18n";
import { registryThemeStyle } from "@/lib/theme-style";
import { DashboardNav } from "./nav";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const [{ tr }, { stats }] = await Promise.all([getTr(), loadRegistryData(registry.id)]);
  const couple = `${registry.partnerOne} & ${registry.partnerTwo}`;

  return (
    <div className="min-h-dvh pb-24 md:pb-10" style={registryThemeStyle(registry.theme)}>
      <header className="no-print border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" aria-label={tr("All registries", "सभी रजिस्ट्रियाँ")} className="rounded-lg">
            {registry.photo ? <Avatar src={registry.photo} name={couple} size={40} tooltip={false} /> : <Mark className="size-10" />}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold leading-tight text-primary">{couple}</p>
            <Link href={`/r/${registry.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-accent underline-offset-4 hover:underline">
              {tr("View guest page", "मेहमानों वाला पेज देखें")} <ExternalLink className="size-3.5" aria-hidden />
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
