import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Check, ChevronRight, Gift, HandCoins, PartyPopper, Send } from "lucide-react";
import { EntryList } from "@/components/entry-list";
import { ItemThumb } from "@/components/ui/kit";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { buildEntries } from "@/lib/entries";
import { getTr } from "@/lib/i18n";
import { cn, daysUntil, inr } from "@/lib/utils";

export default async function Overview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const [{ tr }, data] = await Promise.all([getTr(), loadRegistryData(registry.id)]);
  const { stats, items } = data;
  const entries = buildEntries(items, data.reservations, data.contributions);
  const pending = entries.filter((e) => e.kind === "contribution" && e.status === "pending");
  const recent = entries.filter((e) => e.status !== "pending" && e.status !== "rejected").slice(0, 4);
  const needed = items.filter((i) => !i.fulfilled && !i.hidden).slice(0, 4);
  const couple = `${registry.partnerOne} & ${registry.partnerTwo}`;
  const days = daysUntil(registry.weddingDate);
  const welcome = (await searchParams).welcome === "1";
  const base = `/dashboard/${slug}`;
  const hasFunds = items.some((i) => i.kind === "fund" || i.allowChipIn);

  const checklist = [
    { done: items.length > 0, label: tr("Add your wishes", "अपनी पसंद जोड़ें"), hint: tr("Paste links, pick essentials, or open a fund.", "लिंक डालें, ज़रूरी सामान चुनें, या फंड खोलें।"), href: `${base}/gifts`, icon: Gift },
    { done: !!registry.upiId, label: tr("Add your UPI ID", "अपनी UPI ID जोड़ें"), hint: tr("So cash gifts reach you directly. Zero fees.", "ताकि नकद उपहार सीधे आप तक पहुँचें। कोई शुल्क नहीं।"), href: `${base}/settings#upi`, icon: HandCoins },
    { done: stats.guests > 0, label: tr("Share with family & friends", "परिवार और दोस्तों को भेजें"), hint: tr("One tap on WhatsApp, or print the QR card.", "WhatsApp पर एक टैप, या QR कार्ड छापें।"), href: `${base}/share`, icon: Send },
  ];
  const setupDone = checklist.every((c) => c.done);

  return (
    <div className="space-y-7">
      {welcome && (
        <div className="bg-dots relative overflow-hidden rounded-[var(--radius-container)] bg-[var(--color-accent)] p-6 text-white">
          <PartyPopper className="size-8 text-marigold" aria-hidden />
          <h1 className="mt-2 font-display text-2xl font-semibold text-white">{tr("Your registry is ready!", "आपकी रजिस्ट्री तैयार है!")}</h1>
          <p className="mt-1 text-white/85">{tr("Two quick things left, then share it with everyone.", "बस दो छोटे काम बाकी हैं, फिर सबको भेज दीजिए।")}</p>
        </div>
      )}

      <Card padding={0}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-secondary">{tr("Total blessings received", "कुल मिला आशीर्वाद")}</p>
              <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-primary">{inr(stats.totalReceived) || "₹0"}</p>
            </div>
            {days != null && days >= 0 && (
              <div className="rounded-xl bg-brand-soft px-3 py-2 text-center">
                <p className="font-display text-2xl font-semibold leading-none text-accent">{days}</p>
                <p className="mt-0.5 text-xs font-semibold text-brand-deep">{tr(days === 1 ? "day to go" : "days to go", "दिन बाकी")}</p>
              </div>
            )}
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { v: inr(stats.cashReceived) || "₹0", l: tr("Cash", "नकद") },
              { v: inr(stats.giftsValue) || "₹0", l: tr("Gifts", "तोहफ़े") },
              { v: String(stats.guests), l: tr("Guests", "मेहमान") },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-muted px-2 py-3">
                <dd className="truncate font-display text-xl font-semibold text-primary">{s.v}</dd>
                <dt className="text-sm text-secondary">{s.l}</dt>
              </div>
            ))}
          </dl>
          {stats.wishlistValue > 0 && (
            <div className="mt-5">
              <ProgressBar
                label={tr(`${stats.itemsFulfilled} of ${stats.itemsTotal} wishes fulfilled`, `${stats.itemsTotal} में से ${stats.itemsFulfilled} पसंद पूरी`)}
                value={stats.fulfilledPct}
                hasValueLabel
              />
            </div>
          )}
        </div>
        {stats.cashPending > 0 && (
          <Link href={`${base}/received?filter=confirm`} className="flex min-h-12 items-center justify-between gap-2 border-t border-border bg-[var(--color-background-yellow)] px-5 py-3 text-[15px] font-semibold text-primary">
            <span>{tr(`${inr(stats.cashPending)} waiting for your confirmation`, `${inr(stats.cashPending)} आपकी पुष्टि के इंतज़ार में`)}</span>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}
      </Card>

      {!setupDone && (
        <section>
          <Heading level={2}>{tr("Finish setting up", "सेटअप पूरा करें")}</Heading>
          <div className="mt-3">
            <Card padding={0}>
              <ul className="divide-y divide-[var(--color-border)]">
                {checklist.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className="flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-muted">
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", c.done ? "bg-[var(--color-success)] text-white" : "bg-brand-soft text-accent")}>
                        {c.done ? <Check className="size-5" aria-hidden /> : <c.icon className="size-5" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block font-semibold", c.done ? "text-secondary line-through" : "text-primary")}>
                          {c.label}
                          {c.done && <span className="sr-only">, {tr("done", "हो गया")}</span>}
                        </span>
                        {!c.done && <span className="block text-[15px] leading-snug text-secondary">{c.hint}</span>}
                      </span>
                      {!c.done && <ChevronRight className="size-5 shrink-0 text-secondary" aria-hidden />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          {hasFunds && !registry.upiId && (
            <p className="mt-2 px-1 text-sm text-secondary">{tr("Until you add a UPI ID, guests can only pledge to give cash in person.", "जब तक UPI ID नहीं जुड़ती, मेहमान सिर्फ़ ख़ुद आकर नकद देने का वादा कर सकते हैं।")}</p>
          )}
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <Heading level={2}>{tr("Please confirm", "कृपया पुष्टि करें")}</Heading>
          <div className="mt-3">
            <EntryList slug={slug} entries={pending.slice(0, 5)} couple={couple} compact />
          </div>
          {pending.length > 5 && (
            <div className="mt-2">
              <Button variant="ghost" width="100%" href={`${base}/received?filter=confirm`} label={tr(`See all ${pending.length}`, `सभी ${pending.length} देखें`)} />
            </div>
          )}
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <Heading level={2}>{tr("Latest blessings", "ताज़ा आशीर्वाद")}</Heading>
            <Link href={`${base}/received`} className="text-[15px] font-semibold text-accent">
              {tr("See all", "सभी देखें")}
            </Link>
          </div>
          <div className="mt-3">
            <EntryList slug={slug} entries={recent} couple={couple} compact />
          </div>
        </section>
      )}

      {needed.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <Heading level={2}>{tr("Still on your wishlist", "अभी सूची में बाकी")}</Heading>
            <Link href={`${base}/gifts`} className="text-[15px] font-semibold text-accent">
              {tr("Manage", "सँभालें")}
            </Link>
          </div>
          <div className="mt-3">
            <Card padding={0}>
              <ul className="divide-y divide-[var(--color-border)]">
                {needed.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 p-3">
                    <ItemThumb imageUrl={i.imageUrl} icon={i.icon} className="size-14 shrink-0 text-[13px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-primary">{i.title}</p>
                      {i.kind === "fund" || i.raised > 0 ? (
                        i.target ? (
                          <div className="mt-1.5">
                            <ProgressBar label={`${inr(i.raised) || "₹0"} / ${inr(i.target)}`} value={i.progress} hasValueLabel={false} />
                          </div>
                        ) : (
                          <p className="text-[15px] text-secondary">{tr(`${inr(i.raised) || "₹0"} received`, `${inr(i.raised) || "₹0"} मिला`)}</p>
                        )
                      ) : (
                        <p className="text-[15px] text-secondary">
                          {i.price ? inr(i.price) : tr("No price", "दाम नहीं")}
                          {i.quantity > 1 && ` · ${tr(`${i.remainingQty} of ${i.quantity} left`, `${i.quantity} में से ${i.remainingQty} बाकी`)}`}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      )}

      {items.length === 0 && (
        <Card padding={6}>
          <EmptyState
            title={tr("Your wishlist is empty", "आपकी सूची खाली है")}
            description={tr("Add a few things you'd genuinely love to receive.", "कुछ ऐसी चीज़ें जोड़ें जो आप सच में पाना चाहेंगे।")}
            icon={<Gift className="size-10 text-accent" />}
            actions={<Button variant="primary" href={`${base}/gifts?add=1`} label={tr("Add your first wish", "पहली पसंद जोड़ें")} />}
          />
        </Card>
      )}
    </div>
  );
}
