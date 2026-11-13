import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Gift, HandCoins, Send } from "lucide-react";
import { ItemThumb } from "@/components/item-thumb";
import { EntryList } from "@/components/entry-list";
import { Progress } from "@/components/ui/bits";
import { buttonClass } from "@/components/ui/button";
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
    { done: items.length > 0, label: tr("Add your wishes", "अपनी पसंद जोड़ें"), hint: tr("Paste links, pick essentials, or create a fund.", "लिंक डालें, ज़रूरी सामान चुनें, या फंड बनाएँ।"), href: `${base}/gifts`, icon: Gift },
    { done: !!registry.upiId, label: tr("Add your UPI ID", "अपनी UPI ID जोड़ें"), hint: tr("So shagun reaches you directly. Zero fees.", "ताकि शगुन सीधे आप तक पहुँचे। कोई शुल्क नहीं।"), href: `${base}/settings#upi`, icon: HandCoins },
    { done: stats.guests > 0, label: tr("Share with family & friends", "परिवार और दोस्तों को भेजें"), hint: tr("One tap on WhatsApp, or print the QR card.", "WhatsApp पर एक टैप, या QR कार्ड छापें।"), href: `${base}/share`, icon: Send },
  ];
  const setupDone = checklist.every((c) => c.done);

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="rounded-3xl bg-primary p-6 text-white">
          <p className="text-3xl" aria-hidden>🎉</p>
          <h1 className="mt-2 text-2xl font-semibold">{tr("Your registry is ready!", "आपकी रजिस्ट्री तैयार है!")}</h1>
          <p className="mt-1 text-white/85">{tr("Two quick things left, then share it with everyone.", "बस दो छोटे काम बाकी हैं, फिर सबको भेज दीजिए।")}</p>
        </div>
      )}

      {/* Headline numbers */}
      <section className="card overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-muted">{tr("Total blessings received", "कुल मिला आशीर्वाद")}</p>
              <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-ink">{inr(stats.totalReceived) || "₹0"}</p>
            </div>
            {days != null && days >= 0 && (
              <div className="rounded-2xl bg-primary-soft px-3 py-2 text-center">
                <p className="font-display text-2xl font-semibold leading-none text-primary">{days}</p>
                <p className="text-xs font-semibold text-primary-deep">{tr(days === 1 ? "day to go" : "days to go", "दिन बाकी")}</p>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { v: inr(stats.cashReceived) || "₹0", l: tr("Shagun", "शगुन") },
              { v: inr(stats.giftsValue) || "₹0", l: tr("Gifts", "तोहफ़े") },
              { v: String(stats.guests), l: tr("Guests", "मेहमान") },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-sand/70 px-2 py-3">
                <p className="truncate font-display text-xl font-semibold">{s.v}</p>
                <p className="text-sm text-muted">{s.l}</p>
              </div>
            ))}
          </div>
          {stats.wishlistValue > 0 && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between text-[15px]">
                <span className="font-semibold">{tr(`${stats.fulfilledPct}% of your wishlist fulfilled`, `आपकी सूची का ${stats.fulfilledPct}% पूरा`)}</span>
                <span className="text-muted">
                  {stats.itemsFulfilled}/{stats.itemsTotal}
                </span>
              </div>
              <Progress value={stats.fulfilledPct} />
            </div>
          )}
        </div>
        {stats.cashPending > 0 && (
          <Link href={`${base}/shagun?filter=confirm`} className="flex items-center justify-between gap-2 border-t border-line bg-amber-50 px-5 py-3 text-[15px] font-semibold text-amber-900">
            <span>{tr(`${inr(stats.cashPending)} waiting for your confirmation`, `${inr(stats.cashPending)} आपकी पुष्टि के इंतज़ार में`)}</span>
            <ChevronRight className="size-5" />
          </Link>
        )}
      </section>

      {/* Setup checklist */}
      {!setupDone && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">{tr("Finish setting up", "सेटअप पूरा करें")}</h2>
          <ul className="card divide-y divide-line">
            {checklist.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="flex min-h-16 items-center gap-3 p-4">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", c.done ? "bg-leaf text-white" : "bg-primary-soft text-primary")}>
                    {c.done ? <Check className="size-5" /> : <c.icon className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block font-semibold", c.done && "text-muted line-through")}>{c.label}</span>
                    {!c.done && <span className="block text-[15px] leading-snug text-muted">{c.hint}</span>}
                  </span>
                  {!c.done && <ChevronRight className="size-5 shrink-0 text-muted" />}
                </Link>
              </li>
            ))}
          </ul>
          {hasFunds && !registry.upiId && (
            <p className="mt-2 px-1 text-sm text-muted">{tr("Until you add a UPI ID, guests can only pledge to give shagun in person.", "जब तक UPI ID नहीं जुड़ती, मेहमान सिर्फ़ ख़ुद आकर शगुन देने का वादा कर सकते हैं।")}</p>
          )}
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">{tr("Please confirm", "कृपया पुष्टि करें")}</h2>
          <EntryList slug={slug} entries={pending.slice(0, 5)} couple={couple} compact />
          {pending.length > 5 && (
            <Link href={`${base}/shagun?filter=confirm`} className={buttonClass({ variant: "ghost", block: true, className: "mt-2" })}>
              {tr(`See all ${pending.length}`, `सभी ${pending.length} देखें`)} <ArrowRight className="size-4" />
            </Link>
          )}
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">{tr("Latest blessings", "ताज़ा आशीर्वाद")}</h2>
            <Link href={`${base}/shagun`} className="text-[15px] font-semibold text-primary">
              {tr("See all", "सभी देखें")}
            </Link>
          </div>
          <EntryList slug={slug} entries={recent} couple={couple} compact />
        </section>
      )}

      {needed.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">{tr("Still on your wishlist", "अभी सूची में बाकी")}</h2>
            <Link href={`${base}/gifts`} className="text-[15px] font-semibold text-primary">
              {tr("Manage", "सँभालें")}
            </Link>
          </div>
          <ul className="card divide-y divide-line">
            {needed.map((i) => (
              <li key={i.id} className="flex items-center gap-3 p-3">
                <ItemThumb imageUrl={i.imageUrl} emoji={i.emoji} className="size-14 text-[13px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{i.title}</p>
                  {i.kind === "fund" || i.raised > 0 ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      {i.target ? <Progress value={i.progress} className="h-2" /> : null}
                      <span className="shrink-0 text-sm text-muted">
                        {inr(i.raised) || "₹0"}
                        {i.target ? ` / ${inr(i.target)}` : ""}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[15px] text-muted">
                      {i.price ? inr(i.price) : tr("No price", "दाम नहीं")}
                      {i.quantity > 1 && ` · ${tr(`${i.remainingQty} of ${i.quantity} left`, `${i.quantity} में से ${i.remainingQty} बाकी`)}`}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 && (
        <section className="card p-8 text-center">
          <p className="text-5xl" aria-hidden>🎁</p>
          <h2 className="mt-3 text-2xl font-semibold">{tr("Your wishlist is empty", "आपकी सूची खाली है")}</h2>
          <p className="mt-1 text-muted">{tr("Add a few things you'd genuinely love to receive.", "कुछ ऐसी चीज़ें जोड़ें जो आप सच में पाना चाहेंगे।")}</p>
          <Link href={`${base}/gifts?add=1`} className={buttonClass({ className: "mt-5" })}>
            {tr("Add your first wish", "पहली पसंद जोड़ें")}
          </Link>
        </section>
      )}
    </div>
  );
}
