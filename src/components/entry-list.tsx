"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Gift, Heart, MessageCircle, MoreHorizontal, Undo2, X } from "lucide-react";
import { deleteContribution, releaseReservation, setContributionStatus, setThanked } from "@/app/actions/shagun";
import { useLang, useTr } from "@/components/lang";
import { Button } from "@/components/ui/button";
import { CopyButton, toast } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { thankYouNote, type Tone } from "@/lib/compute";
import { guestLabel, methodLabel, type Entry } from "@/lib/entries";
import { errorText, type Result } from "@/lib/result";
import { cn, inr, prettyPhone, whatsappLink } from "@/lib/utils";

export function EntryList({ slug, entries, couple, compact }: { slug: string; entries: Entry[]; couple: string; compact?: boolean }) {
  const tr = useTr();
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [thanking, setThanking] = useState<Entry | null>(null);
  const [menu, setMenu] = useState<Entry | null>(null);

  const run = (fn: () => Promise<Result>, done?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(errorText(res.error, tr), "error");
      else {
        if (done) toast(done);
        router.refresh();
      }
    });

  if (!entries.length) return null;

  return (
    <>
      <ul className={cn("space-y-3", pending && "opacity-70")}>
        {entries.map((e) => {
          const isPending = e.kind === "contribution" && e.status === "pending";
          const rejected = e.status === "rejected";
          return (
            <li key={e.kind + e.id} className={cn("card p-4", rejected && "opacity-60")}>
              <div className="flex items-start gap-3">
                <div className={cn("grid size-11 shrink-0 place-items-center rounded-full", e.method === "gift" ? "bg-leaf-soft text-leaf" : "bg-primary-soft text-primary")}>
                  {e.method === "gift" ? <Gift className="size-5" /> : <span className="text-lg font-bold">₹</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold">{guestLabel(e, tr)}</p>
                    {e.amount != null && <p className={cn("shrink-0 font-display text-xl font-semibold", rejected && "line-through")}>{inr(e.amount)}</p>}
                  </div>
                  <p className="text-[15px] leading-snug text-muted">
                    {[e.itemTitle, methodLabel(e, tr), e.place].filter(Boolean).join(" · ")}
                  </p>
                  {e.message && !compact && <p className="mt-2 rounded-xl bg-sand/70 px-3 py-2 text-[15px] italic leading-snug">“{e.message}”</p>}
                  {e.utr && isPending && <p className="mt-1 text-sm text-muted">UTR: <span className="font-mono">{e.utr}</span></p>}
                  <p className="mt-1 text-xs text-muted">
                    {new Date(e.createdAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    {e.phone && ` · ${prettyPhone(e.phone)}`}
                  </p>
                </div>
              </div>

              {isPending ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3">
                  <p className="text-[15px] font-semibold text-amber-900">
                    {e.method === "cash"
                      ? tr("Did you receive this in person?", "क्या यह आपको हाथ में मिल गया?")
                      : tr("Check your UPI app — did this arrive?", "अपना UPI ऐप देखें — क्या यह राशि आ गई?")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" block onClick={() => run(() => setContributionStatus(slug, e.id, "confirmed"), tr("Confirmed", "पुष्टि हो गई"))}>
                      <Check className="size-4" /> {tr("Yes, received", "हाँ, मिल गया")}
                    </Button>
                    <Button size="sm" variant="outline" block onClick={() => run(() => setContributionStatus(slug, e.id, "rejected"))}>
                      <X className="size-4" /> {tr("Not received", "नहीं मिला")}
                    </Button>
                  </div>
                </div>
              ) : rejected ? (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-red-700">{tr("Marked not received", "नहीं मिला के रूप में दर्ज")}</span>
                  <Button size="sm" variant="ghost" onClick={() => run(() => setContributionStatus(slug, e.id, "pending"))}>
                    <Undo2 className="size-4" /> {tr("Undo", "वापस लें")}
                  </Button>
                </div>
              ) : (
                !compact && (
                  <div className="mt-3 flex items-center gap-2">
                    {e.thanked ? (
                      <span className="inline-flex h-10 flex-1 items-center gap-1.5 text-[15px] font-semibold text-leaf">
                        <Heart className="size-4 fill-current" /> {tr("Thanked", "धन्यवाद भेजा")}
                      </span>
                    ) : (
                      <Button size="sm" variant="soft" className="flex-1" onClick={() => setThanking(e)}>
                        <MessageCircle className="size-4" /> {tr("Say thank you", "धन्यवाद कहें")}
                      </Button>
                    )}
                    <button type="button" className="grid size-10 place-items-center rounded-xl text-muted hover:bg-sand" onClick={() => setMenu(e)} aria-label={tr("More", "और")}>
                      <MoreHorizontal className="size-5" />
                    </button>
                  </div>
                )
              )}
            </li>
          );
        })}
      </ul>

      {thanking && (
        <ThankSheet
          entry={thanking}
          couple={couple}
          onClose={() => setThanking(null)}
          onSent={() => {
            const e = thanking;
            setThanking(null);
            run(() => setThanked(slug, e.kind, e.id, true), tr("Marked as thanked", "धन्यवाद दर्ज हो गया"));
          }}
        />
      )}

      <Sheet open={!!menu} onOpenChange={(o) => !o && setMenu(null)} title={menu ? guestLabel(menu, tr) : ""}>
        {menu && (
          <div className="space-y-2 pb-2">
            {menu.thanked && (
              <Button variant="outline" block onClick={() => { const e = menu; setMenu(null); run(() => setThanked(slug, e.kind, e.id, false)); }}>
                {tr("Mark as not thanked", "धन्यवाद नहीं भेजा — ऐसा दर्ज करें")}
              </Button>
            )}
            {!menu.thanked && (
              <Button variant="outline" block onClick={() => { const e = menu; setMenu(null); run(() => setThanked(slug, e.kind, e.id, true)); }}>
                {tr("Mark as thanked", "धन्यवाद भेज दिया — ऐसा दर्ज करें")}
              </Button>
            )}
            {menu.kind === "reservation" && (
              <Button variant="danger" block onClick={() => { const e = menu; setMenu(null); run(() => releaseReservation(slug, e.id), tr("Gift is available again", "तोहफ़ा फिर से उपलब्ध है")); }}>
                {tr("Release this gift (guest changed their mind)", "यह तोहफ़ा छोड़ें (मेहमान ने मन बदला)")}
              </Button>
            )}
            {menu.kind === "contribution" && menu.method !== "razorpay" && (
              <>
                <Button variant="outline" block onClick={() => { const e = menu; setMenu(null); run(() => setContributionStatus(slug, e.id, "rejected")); }}>
                  {tr("Mark as not received", "नहीं मिला — ऐसा दर्ज करें")}
                </Button>
                <Button variant="danger" block onClick={() => { const e = menu; setMenu(null); run(() => deleteContribution(slug, e.id), tr("Entry deleted", "एंट्री हटा दी गई")); }}>
                  {tr("Delete entry", "एंट्री हटाएँ")}
                </Button>
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

function ThankSheet({ entry, couple, onClose, onSent }: { entry: Entry; couple: string; onClose: () => void; onSent: () => void }) {
  const tr = useTr();
  const uiLang = useLang();
  const [lang, setLang] = useState<"en" | "hi">(uiLang);
  const [tone, setTone] = useState<Tone>("warm");
  const make = (l: "en" | "hi", t: Tone) =>
    thankYouNote({
      lang: l,
      tone: t,
      guest: entry.name,
      gift: entry.kind === "reservation" ? entry.itemTitle : null,
      amount: entry.amount,
      fund: entry.kind === "contribution" && entry.itemTitle ? entry.itemTitle : null,
      couple,
    });
  const [text, setText] = useState(() => make(uiLang, "warm"));
  const pick = (l: "en" | "hi", t: Tone) => {
    setLang(l);
    setTone(t);
    setText(make(l, t));
  };
  const tones: { k: Tone; l: string }[] = [
    { k: "warm", l: tr("Warm", "आत्मीय") },
    { k: "formal", l: tr("Respectful", "आदरपूर्ण") },
    { k: "fun", l: tr("Playful", "मज़ेदार") },
  ];

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Thank-you note", "धन्यवाद संदेश")} description={tr("Edit it if you like, then send on WhatsApp.", "चाहें तो बदलें, फिर WhatsApp पर भेजें।")}>
      <div className="flex flex-wrap gap-2">
        {tones.map((t) => (
          <button key={t.k} type="button" className="chip" aria-pressed={tone === t.k} onClick={() => pick(lang, t.k)}>
            {t.l}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-line" />
        {(["en", "hi"] as const).map((l) => (
          <button key={l} type="button" className="chip" aria-pressed={lang === l} onClick={() => pick(l, tone)}>
            {l === "en" ? "English" : "हिंदी"}
          </button>
        ))}
      </div>
      <textarea className="input mt-4" rows={8} value={text} onChange={(e) => setText(e.target.value)} aria-label={tr("Thank-you note", "धन्यवाद संदेश")} />
      <div className="mt-4 grid gap-2 pb-2">
        <a
          href={whatsappLink(text, entry.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setTimeout(onSent, 400)}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp px-6 text-lg font-semibold text-white"
        >
          <MessageCircle className="size-5" />
          {entry.phone ? tr("Send on WhatsApp", "WhatsApp पर भेजें") : tr("Open WhatsApp & choose contact", "WhatsApp खोलें और संपर्क चुनें")}
        </a>
        <div className="flex gap-2">
          <CopyButton text={text} className="flex-1" />
          <Button variant="outline" className="flex-1" onClick={onSent}>
            {tr("Mark as thanked", "धन्यवाद दर्ज करें")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
