import { notFound } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { BookOpenText, Flame, Sparkles } from "lucide-react";
import { EntryList } from "@/components/entry-list";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { buildEntries } from "@/lib/entries";
import { getTr } from "@/lib/i18n";
import { inr } from "@/lib/utils";
import { CashEntryButton } from "./cash-entry";
import { FilterTabs } from "./filter-tabs";

export default async function ShagunPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ filter?: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}/received`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const [{ tr }, data] = await Promise.all([getTr(), loadRegistryData(registry.id)]);
  const entries = buildEntries(data.items, data.reservations, data.contributions);
  const raw = (await searchParams).filter;
  const filter = raw === "confirm" || raw === "thank" ? raw : "all";

  const isConfirm = (e: (typeof entries)[number]) => e.kind === "contribution" && e.status === "pending";
  const isThank = (e: (typeof entries)[number]) => !e.thanked && (e.kind === "reservation" || e.status === "confirmed");
  const counts = { all: entries.length, confirm: entries.filter(isConfirm).length, thank: entries.filter(isThank).length };
  const shown = filter === "confirm" ? entries.filter(isConfirm) : filter === "thank" ? entries.filter(isThank) : entries;
  const funds = data.items.filter((i) => i.kind === "fund").map((i) => ({ id: i.id, title: i.title }));

  return (
    <div>
      <Heading level={1}>{tr("Everything received", "जो कुछ मिला")}</Heading>
      <p className="mt-1 text-secondary">
        {tr("Received", "मिला")}: <span className="font-semibold text-primary">{inr(data.stats.cashReceived) || "₹0"}</span>
        {data.stats.giftsValue > 0 && (
          <>
            {" "}
            + {tr("gifts worth", "तोहफ़े, क़ीमत")} <span className="font-semibold text-primary">{inr(data.stats.giftsValue)}</span>
          </>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <CashEntryButton slug={slug} funds={funds} />
        <Button width="100%" href={`/dashboard/${slug}/ledger`} label={tr("Ledger (PDF)", "बही-खाता (PDF)")} icon={<BookOpenText className="size-4" aria-hidden />} />
      </div>

      <div className="mt-5">
        <FilterTabs value={filter} counts={counts} />
      </div>

      <div className="mt-4">
        {shown.length ? (
          <EntryList slug={slug} entries={shown} couple={`${registry.partnerOne} & ${registry.partnerTwo}`} giftWord={registry.giftWord} />
        ) : (
          <Card padding={6}>
            <EmptyState
              title={filter === "all" ? tr("No blessings yet", "अभी कोई आशीर्वाद नहीं आया") : tr("All caught up!", "सब हो गया!")}
              description={
                filter === "all"
                  ? tr("Share your registry and gifts will appear here.", "रजिस्ट्री शेयर करें, तोहफ़े यहाँ दिखेंगे।")
                  : tr("Nothing waiting for you here.", "यहाँ कुछ भी बाकी नहीं है।")
              }
              icon={filter === "all" ? <Flame className="size-10 text-marigold" /> : <Sparkles className="size-10 text-marigold" />}
              actions={filter === "all" ? <Button variant="primary" href={`/dashboard/${slug}/share`} label={tr("Share registry", "रजिस्ट्री शेयर करें")} /> : undefined}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
