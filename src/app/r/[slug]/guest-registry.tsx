"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Gift, HandCoins, Heart } from "lucide-react";
import { reserveItem, updateMyReservation } from "@/app/actions/guest";
import { ItemThumb } from "@/components/item-thumb";
import { useLang, useTr } from "@/components/lang";
import { Button, buttonClass } from "@/components/ui/button";
import { Progress, toast } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/catalog";
import { errorText } from "@/lib/result";
import { cn, inr } from "@/lib/utils";
import { GuestFields, loadGuest, saveGuest, type GuestInfo } from "./guest-fields";
import { ShagunSheet } from "./shagun-sheet";

export type GuestItem = {
  id: string;
  kind: "product" | "fund";
  title: string;
  description: string | null;
  imageUrl: string | null;
  emoji: string | null;
  url: string | null;
  store: string | null;
  category: string;
  price: number | null;
  quantity: number;
  remainingQty: number;
  state: "available" | "reserved" | "funded" | "open";
  canReserve: boolean;
  canChipIn: boolean;
  progress: number | null;
  raised: number | null;
  target: number | null;
  mine: { id: string; status: "reserved" | "purchased"; quantity: number } | null;
};

type Props = {
  slug: string;
  couple: string;
  items: GuestItem[];
  upi: { id: string; name: string } | null;
  razorpay: boolean;
  guestName: string | null;
};

const PRICE_BANDS = [
  { k: "lt1", en: "Under ₹1,000", hi: "₹1,000 से कम", test: (p: number) => p < 1000 },
  { k: "1to3", en: "₹1,000 – ₹3,000", hi: "₹1,000 – ₹3,000", test: (p: number) => p >= 1000 && p <= 3000 },
  { k: "3to7", en: "₹3,000 – ₹7,000", hi: "₹3,000 – ₹7,000", test: (p: number) => p > 3000 && p <= 7000 },
  { k: "gt7", en: "Above ₹7,000", hi: "₹7,000 से ऊपर", test: (p: number) => p > 7000 },
];

export function GuestRegistry({ slug, couple, items, upi, razorpay, guestName }: Props) {
  const tr = useTr();
  const lang = useLang();
  const [category, setCategory] = useState("all");
  const [band, setBand] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [shagunFor, setShagunFor] = useState<string | null>(null);

  const funds = items.filter((i) => i.kind === "fund");
  const products = items.filter((i) => i.kind === "product");
  const mine = products.filter((i) => i.mine);
  const cats = CATEGORIES.filter((c) => products.some((p) => p.category === c.key));
  const bands = PRICE_BANDS.filter((b) => products.some((p) => p.price != null && b.test(p.price)));

  const shown = useMemo(
    () =>
      products.filter((p) => {
        if (category !== "all" && p.category !== category) return false;
        if (band !== "all") {
          const b = PRICE_BANDS.find((x) => x.k === band);
          if (!b || p.price == null || !b.test(p.price)) return false;
        }
        if (availableOnly && p.state !== "available") return false;
        return true;
      }),
    [products, category, band, availableOnly],
  );

  const active = items.find((i) => i.id === openItem) ?? null;
  const shagunItem = items.find((i) => i.id === shagunFor) ?? null;
  const filtered = category !== "all" || band !== "all" || availableOnly;

  if (!items.length) {
    return (
      <div className="mt-10 text-center">
        <p className="text-5xl" aria-hidden>🪔</p>
        <h2 className="mt-3 text-2xl font-semibold">{tr("The wishlist is coming soon", "सूची जल्द आ रही है")}</h2>
        <p className="mt-1 text-muted">{tr("The couple is still adding their wishes. Please check back shortly.", "जोड़ा अभी अपनी पसंद जोड़ रहा है। थोड़ी देर में फिर देखें।")}</p>
      </div>
    );
  }

  return (
    <>
      {mine.length > 0 && (
        <section className="mt-6 rounded-3xl border-2 border-leaf/30 bg-leaf-soft p-4">
          <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-leaf">
            <Heart className="size-5 fill-current" /> {tr("Your gift", "आपका तोहफ़ा")}
          </h2>
          <ul className="mt-2 space-y-2">
            {mine.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setOpenItem(i.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left">
                  <ItemThumb imageUrl={i.imageUrl} emoji={i.emoji} className="size-12 shrink-0 text-[11px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{i.title}</span>
                    <span className="block text-sm text-muted">
                      {i.mine?.status === "purchased" ? tr("Bought ✓", "ख़रीद लिया ✓") : tr("Reserved by you — tap for next steps", "आपने चुना है — आगे के लिए टैप करें")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {funds.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">{tr("Send shagun", "शगुन भेजें")}</h2>
          <p className="mt-1 text-muted">{tr("Give any amount — straight to the couple by UPI.", "कोई भी राशि दें — UPI से सीधे जोड़े को।")}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {funds.map((f) => (
              <li key={f.id} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-3xl" aria-hidden>
                    {f.emoji || "💝"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-sans text-lg font-bold leading-tight">{f.title}</h3>
                    {f.description && <p className="mt-0.5 text-[15px] leading-snug text-muted">{f.description}</p>}
                  </div>
                </div>
                {f.progress != null && f.target != null && (
                  <div className="mt-3">
                    <Progress value={f.progress} />
                    <p className="mt-1.5 text-sm text-muted">
                      {tr(`${inr(f.raised ?? 0) || "₹0"} of ${inr(f.target)}`, `${inr(f.target)} में से ${inr(f.raised ?? 0) || "₹0"}`)}
                    </p>
                  </div>
                )}
                <Button block className="mt-4" onClick={() => setShagunFor(f.id)}>
                  <HandCoins className="size-5" /> {tr("Send shagun", "शगुन भेजें")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">{tr("Gift wishlist", "तोहफ़ों की सूची")}</h2>
          <p className="mt-1 text-muted">{tr("Pick one and we'll mark it as yours, so nobody brings the same thing.", "एक चुनिए — हम उसे आपके नाम कर देंगे, ताकि कोई और वही चीज़ न लाए।")}</p>

          {(cats.length > 1 || bands.length > 1) && (
            <div className="mt-4 space-y-2">
              {cats.length > 1 && (
                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={tr("Category", "श्रेणी")}>
                  <button type="button" className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
                    {tr("All", "सभी")}
                  </button>
                  {cats.map((c) => (
                    <button key={c.key} type="button" className="chip" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>
                      <span aria-hidden>{c.emoji}</span> {lang === "hi" ? c.hi : c.en}
                    </button>
                  ))}
                </div>
              )}
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={tr("Budget", "बजट")}>
                <button type="button" className="chip" aria-pressed={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>
                  {availableOnly && <Check className="size-4" />} {tr("Available only", "सिर्फ़ उपलब्ध")}
                </button>
                {bands.length > 1 &&
                  bands.map((b) => (
                    <button key={b.k} type="button" className="chip" aria-pressed={band === b.k} onClick={() => setBand(band === b.k ? "all" : b.k)}>
                      {lang === "hi" ? b.hi : b.en}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {shown.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shown.map((p) => {
                const gone = p.state !== "available" && !p.mine;
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => setOpenItem(p.id)} className={cn("card flex h-full w-full flex-col overflow-hidden p-0 text-left transition-transform active:scale-[0.98]", gone && "opacity-55")}>
                      <div className="relative w-full">
                        <ItemThumb imageUrl={p.imageUrl} emoji={p.emoji} className="aspect-square w-full rounded-none text-2xl" />
                        {p.state !== "available" && (
                          <span className={cn("absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold text-white", p.mine ? "bg-leaf" : "bg-ink/80")}>
                            <Check className="size-3.5" />
                            {p.mine ? tr("Yours", "आपका") : p.state === "funded" ? tr("Gifted", "मिल गया") : tr("Reserved", "चुन लिया गया")}
                          </span>
                        )}
                        {p.state === "available" && p.canChipIn && (
                          <span className="absolute left-2 top-2 rounded-full bg-marigold px-2.5 py-1 text-[13px] font-bold text-ink">{tr("Chip in", "मिलकर दें")}</span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{p.title}</p>
                        <p className="mt-auto pt-1.5 font-display text-lg font-semibold">{p.price ? inr(p.price) : ""}</p>
                        {p.quantity > 1 && p.state === "available" && <p className="text-[13px] text-muted">{tr(`${p.remainingQty} of ${p.quantity} needed`, `${p.quantity} में से ${p.remainingQty} चाहिए`)}</p>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-line p-8 text-center">
              <p className="text-muted">{tr("Nothing matches these filters.", "इन फ़िल्टर में कुछ नहीं मिला।")}</p>
              {filtered && (
                <button type="button" className="mt-2 h-11 font-semibold text-primary underline" onClick={() => { setCategory("all"); setBand("all"); setAvailableOnly(false); }}>
                  {tr("Clear filters", "फ़िल्टर हटाएँ")}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {active && (
        <ItemSheet
          slug={slug}
          item={active}
          guestName={guestName}
          onClose={() => setOpenItem(null)}
          onChipIn={() => {
            setOpenItem(null);
            setShagunFor(active.id);
          }}
        />
      )}
      {shagunItem && <ShagunSheet slug={slug} couple={couple} item={shagunItem} upi={upi} razorpay={razorpay} guestName={guestName} onClose={() => setShagunFor(null)} />}
    </>
  );
}

// ── Gift details + reserve ────────────────────────────────────────────

function ItemSheet({ slug, item, guestName, onClose, onChipIn }: { slug: string; item: GuestItem; guestName: string | null; onClose: () => void; onChipIn: () => void }) {
  const tr = useTr();
  const router = useRouter();
  const [step, setStep] = useState<"view" | "form" | "done">("view");
  const [guest, setGuest] = useState<GuestInfo>({ name: guestName ?? "", phone: "", message: "", anonymous: false });
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();

  useEffect(() => {
    const saved = loadGuest();
    if (saved) setGuest((g) => ({ ...g, name: g.name || saved.name, phone: saved.phone }));
  }, []);

  const reserve = () =>
    start(async () => {
      const res = await reserveItem(slug, { itemId: item.id, quantity: qty, ...guest });
      if (!res.ok) {
        toast(errorText(res.error, tr), "error");
        if (res.error === "unavailable") {
          onClose();
          router.refresh();
        }
        return;
      }
      saveGuest(guest);
      setStep("done");
      router.refresh();
    });

  const act = (action: "cancel" | "purchased") =>
    start(async () => {
      if (!item.mine) return;
      const res = await updateMyReservation(item.mine.id, action);
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      toast(action === "cancel" ? tr("Reservation cancelled", "आरक्षण रद्द हो गया") : tr("Wonderful — marked as bought!", "बहुत बढ़िया — ख़रीदा हुआ दर्ज हो गया!"));
      onClose();
      router.refresh();
    });

  const storeLink = item.url && (
    <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className={buttonClass({ variant: step === "done" || item.mine ? "primary" : "outline", size: "lg", block: true })}>
      {item.store ? tr(`Buy on ${item.store}`, `${item.store} पर ख़रीदें`) : tr("Open in store", "स्टोर में खोलें")} <ExternalLink className="size-5" />
    </a>
  );

  const title = step === "done" ? tr("It's yours to gift! 🎉", "यह तोहफ़ा अब आपके नाम! 🎉") : step === "form" ? tr("Reserve this gift", "यह तोहफ़ा चुनें") : item.title;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={title}>
      {step === "view" && (
        <div className="pb-2">
          <ItemThumb imageUrl={item.imageUrl} emoji={item.emoji} className="mx-auto aspect-[4/3] w-full max-w-sm text-4xl" />
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <p className="font-display text-3xl font-semibold">{item.price ? inr(item.price) : ""}</p>
            {item.store && <p className="text-[15px] text-muted">{item.store}</p>}
          </div>
          {item.description && <p className="mt-2 rounded-2xl bg-sand/70 px-4 py-3 text-[16px] italic">“{item.description}”</p>}

          {item.mine ? (
            <div className="mt-5 space-y-2.5">
              <p className="rounded-2xl bg-leaf-soft p-4 text-[16px] text-leaf">
                {item.mine.status === "purchased"
                  ? tr("You've bought this. Thank you for the lovely gift!", "आपने यह ख़रीद लिया है। इस प्यारे तोहफ़े के लिए धन्यवाद!")
                  : tr("You've reserved this. Buy it from any shop — online or nearby — and bring it to the wedding.", "आपने यह चुन लिया है। किसी भी दुकान से ख़रीदें — ऑनलाइन या पास की — और शादी में ले आएँ।")}
              </p>
              {item.mine.status === "reserved" && (
                <>
                  {storeLink}
                  <Button variant="soft" size="lg" block loading={pending} onClick={() => act("purchased")}>
                    <Check className="size-5" /> {tr("I've bought it", "मैंने ख़रीद लिया")}
                  </Button>
                  <button type="button" className="h-12 w-full text-[15px] font-semibold text-red-700" onClick={() => act("cancel")} disabled={pending}>
                    {tr("Cancel my reservation", "मेरा आरक्षण रद्द करें")}
                  </button>
                </>
              )}
            </div>
          ) : item.state !== "available" ? (
            <p className="mt-5 rounded-2xl bg-sand p-4 text-center text-[16px] font-semibold">
              {tr("Someone is already gifting this. Please pick another one 🙏", "यह तोहफ़ा कोई और दे रहा है। कृपया कोई और चुनें 🙏")}
            </p>
          ) : (
            <div className="mt-5 space-y-2.5">
              {item.canReserve && (
                <Button size="lg" block onClick={() => setStep("form")}>
                  <Gift className="size-5" /> {tr("I'll gift this", "मैं यह तोहफ़ा दूँगा/दूँगी")}
                </Button>
              )}
              {item.canChipIn && (
                <Button size="lg" variant={item.canReserve ? "soft" : "primary"} block onClick={onChipIn}>
                  <HandCoins className="size-5" /> {tr("Chip in any amount", "थोड़ा योगदान दें")}
                </Button>
              )}
              {item.canReserve && (
                <p className="px-1 text-center text-sm text-muted">{tr("Reserving is free. You buy the gift yourself, from any shop you like.", "चुनना मुफ़्त है। तोहफ़ा आप ख़ुद, अपनी पसंद की दुकान से ख़रीदते हैं।")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === "form" && (
        <form
          className="pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            reserve();
          }}
        >
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-2.5">
            <ItemThumb imageUrl={item.imageUrl} emoji={item.emoji} className="size-14 shrink-0 text-[13px]" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{item.title}</p>
              {item.price && <p className="text-[15px] text-muted">{inr(item.price)}</p>}
            </div>
          </div>
          {item.remainingQty > 1 && (
            <label className="mb-4 block">
              <span className="label">{tr("How many?", "कितने?")}</span>
              <select className="input" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: item.remainingQty }, (_, i) => i + 1).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
          <GuestFields value={guest} onChange={(p) => setGuest((g) => ({ ...g, ...p }))} />
          <Button type="submit" size="lg" block className="mt-5" loading={pending} disabled={!guest.anonymous && !guest.name.trim()}>
            {tr("Confirm — I'll gift this", "पक्का — मैं यह दूँगा/दूँगी")}
          </Button>
          <button type="button" className="mt-1 h-12 w-full text-[15px] font-semibold text-muted" onClick={() => setStep("view")}>
            {tr("Back", "पीछे")}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="pb-2 text-center">
          <p className="text-6xl" aria-hidden>🎁</p>
          <p className="mt-3 text-[17px] text-muted">
            {tr("We've marked it as reserved, so nobody else will bring the same gift.", "हमने इसे आपके नाम कर दिया है, ताकि कोई और वही तोहफ़ा न लाए।")}
          </p>
          <ol className="mt-5 space-y-2 rounded-2xl bg-white p-4 text-left text-[16px]">
            <li className="flex gap-2.5"><span className="font-bold text-primary">1.</span> {tr("Buy it — online or from a shop near you.", "इसे ख़रीदें — ऑनलाइन या पास की दुकान से।")}</li>
            <li className="flex gap-2.5"><span className="font-bold text-primary">2.</span> {tr("Bring it to the wedding, or have it delivered to the couple.", "शादी में ले आएँ, या जोड़े के घर भिजवा दें।")}</li>
            <li className="flex gap-2.5"><span className="font-bold text-primary">3.</span> {tr("Changed your mind? Open this page again on this phone to cancel.", "मन बदल गया? इसी फ़ोन पर यह पेज दोबारा खोलकर रद्द करें।")}</li>
          </ol>
          <div className="mt-5 space-y-2.5">
            {storeLink}
            <Button variant="outline" size="lg" block onClick={onClose}>
              {tr("Done", "ठीक है")}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
