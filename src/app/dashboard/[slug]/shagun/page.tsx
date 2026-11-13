import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { EntryList } from "@/components/entry-list";
import { buttonClass } from "@/components/ui/button";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { buildEntries } from "@/lib/entries";
import { getTr } from "@/lib/i18n";
import { cn, inr } from "@/lib/utils";
import { CashEntryButton } from "./cash-entry";

export default async function ShagunPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ filter?: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}/shagun`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const [{ tr }, data] = await Promise.all([getTr(), loadRegistryData(registry.id)]);
  const entries = buildEntries(data.items, data.reservations, data.contributions);
  const filter = (await searchParams).filter ?? "all";
  const base = `/dashboard/${slug}/shagun`;

  const isConfirm = (e: (typeof entries)[number]) => e.kind === "contribution" && e.status === "pending";
  const isThank = (e: (typeof entries)[number]) => !e.thanked && (e.kind === "reservation" || e.status === "confirmed");
  const counts = { confirm: entries.filter(isConfirm).length, thank: entries.filter(isThank).length };
  const shown = filter === "confirm" ? entries.filter(isConfirm) : filter === "thank" ? entries.filter(isThank) : entries;

  const tabs = [
    { k: "all", l: tr("All", "सभी"), n: entries.length },
    { k: "confirm", l: tr("To confirm", "पुष्टि बाकी"), n: counts.confirm },
    { k: "thank", l: tr("To thank", "धन्यवाद बाकी"), n: counts.thank },
  ];
  const funds = data.items.filter((i) => i.kind === "fund").map((i) => ({ id: i.id, title: i.title }));

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{tr("Shagun & gifts", "शगुन और तोहफ़े")}</h1>
          <p className="mt-1 text-muted">
            {tr("Received", "मिला")}: <span className="font-semibold text-ink">{inr(data.stats.cashReceived) || "₹0"}</span>
            {data.stats.giftsValue > 0 && <> + {tr("gifts worth", "तोहफ़े, क़ीमत")} <span className="font-semibold text-ink">{inr(data.stats.giftsValue)}</span></>}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <CashEntryButton slug={slug} funds={funds} />
        <Link href={`/dashboard/${slug}/ledger`} className={buttonClass({ variant: "outline" })}>
          <BookOpenText className="size-5" /> {tr("Ledger (PDF)", "बही-खाता (PDF)")}
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
        {tabs.map((t) => (
          <Link key={t.k} href={t.k === "all" ? base : `${base}?filter=${t.k}`} className="chip" data-active={filter === t.k} scroll={false}>
            {t.l}
            <span className={cn("rounded-full px-1.5 text-[13px]", filter === t.k ? "bg-white/25" : "bg-sand")}>{t.n}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {shown.length ? (
          <EntryList slug={slug} entries={shown} couple={`${registry.partnerOne} & ${registry.partnerTwo}`} />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-5xl" aria-hidden>{filter === "all" ? "🪔" : "✨"}</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {filter === "all" ? tr("No blessings yet", "अभी कोई आशीर्वाद नहीं आया") : tr("All caught up!", "सब हो गया!")}
            </h2>
            <p className="mt-1 text-muted">
              {filter === "all"
                ? tr("Share your registry — shagun and gifts will appear here.", "रजिस्ट्री शेयर करें — शगुन और तोहफ़े यहाँ दिखेंगे।")
                : tr("Nothing waiting for you here.", "यहाँ कुछ भी बाकी नहीं है।")}
            </p>
            {filter === "all" && (
              <Link href={`/dashboard/${slug}/share`} className={buttonClass({ className: "mt-5" })}>
                {tr("Share registry", "रजिस्ट्री शेयर करें")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
