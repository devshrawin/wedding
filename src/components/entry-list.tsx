"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Check, Gift, Heart, ImageIcon, MessageCircle, MoreHorizontal, Undo2, X } from "lucide-react";
import { deleteContribution, releaseReservation, setContributionStatus, setThanked } from "@/app/actions/shagun";
import { useLang, useTr } from "@/components/lang";
import { CopyButton, toast } from "@/components/ui/feedback";
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
  const [proof, setProof] = useState<Entry | null>(null);

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
            <li key={e.kind + e.id}>
              <Card padding={4}>
                <div className={cn("flex items-start gap-3", rejected && "opacity-60")}>
                  <div className={cn("grid size-11 shrink-0 place-items-center rounded-full", e.method === "gift" ? "bg-[var(--color-background-green)] text-leaf" : "bg-brand-soft text-accent")}>
                    {e.method === "gift" ? <Gift className="size-5" aria-hidden /> : <span className="text-lg font-bold">₹</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold text-primary">{guestLabel(e, tr)}</p>
                      {e.amount != null && <p className={cn("shrink-0 font-display text-xl font-semibold text-primary", rejected && "line-through")}>{inr(e.amount)}</p>}
                    </div>
                    <p className="text-[15px] leading-snug text-secondary">{[e.itemTitle, methodLabel(e, tr), e.place].filter(Boolean).join(" · ")}</p>
                    {e.message && !compact && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-[15px] italic leading-snug text-primary">“{e.message}”</p>}
                    <p className="mt-1 text-xs text-secondary">
                      {new Date(e.createdAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      {e.phone && ` · ${prettyPhone(e.phone)}`}
                    </p>
                    {(e.utr || e.proofImage) && isPending && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {e.utr && <Badge label={`UTR ${e.utr}`} />}
                        {e.proofImage && <Button size="sm" variant="ghost" label={tr("See payment screenshot", "भुगतान का स्क्रीनशॉट देखें")} icon={<Icon icon={ImageIcon} />} onClick={() => setProof(e)} />}
                      </div>
                    )}
                  </div>
                </div>

                {isPending ? (
                  <div className="mt-3 rounded-xl bg-[var(--color-background-yellow)] p-3">
                    <p className="text-[15px] font-semibold text-primary">
                      {e.method === "cash" ? tr("Did you receive this in person?", "क्या यह आपको हाथ में मिल गया?") : tr("Check your UPI app. Did this arrive?", "अपना UPI ऐप देखें, क्या यह राशि आ गई?")}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button variant="primary" width="100%" label={tr("Yes, received", "हाँ, मिल गया")} icon={<Icon icon={Check} />} onClick={() => run(() => setContributionStatus(slug, e.id, "confirmed"), tr("Confirmed", "पुष्टि हो गई"))} />
                      <Button width="100%" label={tr("Not received", "नहीं मिला")} icon={<Icon icon={X} />} onClick={() => run(() => setContributionStatus(slug, e.id, "rejected"))} />
                    </div>
                  </div>
                ) : rejected ? (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant="error" label={tr("Marked not received", "नहीं मिला के रूप में दर्ज")} />
                    <Button size="sm" variant="ghost" label={tr("Undo", "वापस लें")} icon={<Icon icon={Undo2} />} onClick={() => run(() => setContributionStatus(slug, e.id, "pending"))} />
                  </div>
                ) : (
                  !compact && (
                    <div className="mt-3 flex items-center gap-2">
                      {e.thanked ? (
                        <span className="inline-flex h-10 flex-1 items-center gap-1.5 text-[15px] font-semibold text-leaf">
                          <Heart className="size-4 fill-current" aria-hidden /> {tr("Thanked", "धन्यवाद भेजा")}
                        </span>
                      ) : (
                        <div className="flex-1">
                          <Button width="100%" label={tr("Say thank you", "धन्यवाद कहें")} icon={<Icon icon={MessageCircle} />} onClick={() => setThanking(e)} />
                        </div>
                      )}
                      <IconButton variant="ghost" label={tr(`More for ${guestLabel(e, tr)}`, `${guestLabel(e, tr)} के लिए और`)} icon={<Icon icon={MoreHorizontal} />} onClick={() => setMenu(e)} />
                    </div>
                  )
                )}
              </Card>
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

      <Sheet open={!!proof} onOpenChange={(o) => !o && setProof(null)} title={tr("Payment screenshot", "भुगतान का स्क्रीनशॉट")} description={tr("Sent by the guest. Always check your bank or UPI app before confirming.", "मेहमान ने भेजा है। पुष्टि से पहले अपना बैंक या UPI ऐप ज़रूर देखें।")}>
        {proof?.proofImage && <img src={proof.proofImage} alt={tr("Guest's payment screenshot", "मेहमान का भुगतान स्क्रीनशॉट")} className="mx-auto max-h-[60dvh] rounded-xl border border-border" />}
      </Sheet>

      <Sheet open={!!menu} onOpenChange={(o) => !o && setMenu(null)} title={menu ? guestLabel(menu, tr) : ""}>
        {menu && (
          <div className="space-y-2 pb-2">
            <Button
              width="100%"
              label={menu.thanked ? tr("Mark as not thanked", "धन्यवाद नहीं भेजा, ऐसा दर्ज करें") : tr("Mark as thanked", "धन्यवाद भेज दिया, ऐसा दर्ज करें")}
              onClick={() => {
                const e = menu;
                setMenu(null);
                run(() => setThanked(slug, e.kind, e.id, !e.thanked));
              }}
            />
            {menu.kind === "reservation" && (
              <Button
                variant="destructive"
                width="100%"
                label={tr("Release this gift (guest changed their mind)", "यह तोहफ़ा छोड़ें (मेहमान ने मन बदला)")}
                onClick={() => {
                  const e = menu;
                  setMenu(null);
                  run(() => releaseReservation(slug, e.id), tr("Gift is available again", "तोहफ़ा फिर से उपलब्ध है"));
                }}
              />
            )}
            {menu.kind === "contribution" && menu.method !== "razorpay" && (
              <>
                <Button
                  width="100%"
                  label={tr("Mark as not received", "नहीं मिला, ऐसा दर्ज करें")}
                  onClick={() => {
                    const e = menu;
                    setMenu(null);
                    run(() => setContributionStatus(slug, e.id, "rejected"));
                  }}
                />
                <Button
                  variant="destructive"
                  width="100%"
                  label={tr("Delete entry", "एंट्री हटाएँ")}
                  onClick={() => {
                    const e = menu;
                    setMenu(null);
                    run(() => deleteContribution(slug, e.id), tr("Entry deleted", "एंट्री हटा दी गई"));
                  }}
                />
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

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Thank-you note", "धन्यवाद संदेश")} description={tr("Edit it if you like, then send on WhatsApp.", "चाहें तो बदलें, फिर WhatsApp पर भेजें।")} purpose="form">
      <div className="flex flex-wrap gap-2">
        <SegmentedControl label={tr("Tone", "अंदाज़")} value={tone} onChange={(v) => pick(lang, v as Tone)}>
          <SegmentedControlItem value="warm" label={tr("Warm", "आत्मीय")} />
          <SegmentedControlItem value="formal" label={tr("Respectful", "आदरपूर्ण")} />
          <SegmentedControlItem value="fun" label={tr("Playful", "मज़ेदार")} />
        </SegmentedControl>
        <SegmentedControl label={tr("Language", "भाषा")} value={lang} onChange={(v) => pick(v as "en" | "hi", tone)}>
          <SegmentedControlItem value="en" label="English" />
          <SegmentedControlItem value="hi" label="हिंदी" />
        </SegmentedControl>
      </div>
      <div className="mt-4">
        <TextArea label={tr("Thank-you note", "धन्यवाद संदेश")} isLabelHidden width="100%" rows={8} value={text} onChange={setText} />
      </div>
      <div className="mt-4 grid gap-2 pb-2">
        <a
          href={whatsappLink(text, entry.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setTimeout(onSent, 400)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-element)] bg-whatsapp px-6 text-[17px] font-semibold text-white transition-[filter] hover:brightness-95"
        >
          <MessageCircle className="size-5" aria-hidden />
          {entry.phone ? tr("Send on WhatsApp", "WhatsApp पर भेजें") : tr("Open WhatsApp & choose contact", "WhatsApp खोलें और संपर्क चुनें")}
        </a>
        <div className="grid grid-cols-2 gap-2">
          <CopyButton text={text} width="100%" />
          <Button width="100%" label={tr("Mark as thanked", "धन्यवाद दर्ज करें")} onClick={onSent} />
        </div>
      </div>
    </Sheet>
  );
}
