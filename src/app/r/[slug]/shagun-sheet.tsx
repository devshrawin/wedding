"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Field } from "@astryxdesign/core/Field";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ArrowLeft, Check, Mail, PartyPopper, CreditCard, HandHeart, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { confirmRazorpay, contribute, startRazorpay } from "@/app/actions/guest";
import { useTr } from "@/components/lang";
import { CopyButton, toast } from "@/components/ui/feedback";
import { AmountChips, PhotoPicker } from "@/components/ui/kit";
import { Sheet } from "@/components/ui/sheet";
import { errorText } from "@/lib/result";
import { buildUpiLink, inr, shagunSuggestions, toShagunAmount } from "@/lib/utils";
import { GuestFields, loadGuest, saveGuest, type GuestInfo } from "./guest-fields";
import type { GuestItem } from "./guest-registry";

type Step = "amount" | "upi" | "done";
type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function ShagunSheet({
  slug,
  couple,
  item,
  upi,
  razorpay,
  guestName,
  giftWord,
  onClose,
}: {
  slug: string;
  couple: string;
  item: GuestItem;
  upi: { id: string; name: string } | null;
  razorpay: boolean;
  guestName: string | null;
  giftWord: string;
  onClose: () => void;
}) {
  const tr = useTr();
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [amountText, setAmountText] = useState("");
  const [guest, setGuest] = useState<GuestInfo>({ name: guestName ?? "", phone: "", message: "", anonymous: false });
  const [doneMethod, setDoneMethod] = useState<"upi" | "cash" | "razorpay">("upi");
  const [utr, setUtr] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const [pending, start] = useTransition();

  const cap = item.chipInLeft; // chip-in gifts can't be over-funded
  const amount = Number(amountText) || 0;
  const suggestions = shagunSuggestions(item.kind === "fund" ? item.target : item.price).filter((a) => cap == null || a <= cap);
  const plusOne = toShagunAmount(amount);
  const overCap = cap != null && amount > cap;
  const identityOk = guest.anonymous || guest.name.trim().length > 0;
  const ready = amount >= 1 && amount <= 1_000_000 && !overCap && identityOk;
  const upiLink = upi ? buildUpiLink({ pa: upi.id, pn: upi.name, am: amount, tn: `${giftWord} for ${couple}`.slice(0, 50) }) : "";

  useEffect(() => {
    const saved = loadGuest();
    if (saved) setGuest((g) => ({ ...g, name: g.name || saved.name, phone: saved.phone }));
    // upi:// links only resolve on phones; desktops get the QR instead.
    setTouch(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1);
  }, []);

  useEffect(() => {
    if (step !== "upi" || !upiLink) return;
    let live = true;
    QRCode.toDataURL(upiLink, { width: 440, margin: 1, errorCorrectionLevel: "M" }).then((d) => live && setQr(d));
    return () => {
      live = false;
    };
  }, [step, upiLink]);

  const finish = (method: "upi" | "cash" | "razorpay") => {
    saveGuest(guest);
    setDoneMethod(method);
    setStep("done");
    router.refresh();
  };

  const record = (method: "upi" | "cash") =>
    start(async () => {
      const res = await contribute(slug, { itemId: item.id, amount, method, utr: method === "upi" ? utr : undefined, proof: method === "upi" && proof ? proof : undefined, ...guest });
      if (!res.ok) {
        toast(res.error === "unavailable" && cap != null ? tr("Someone just chipped in. Please choose a smaller amount.", "किसी ने अभी योगदान दिया है, कृपया कम राशि चुनें।") : errorText(res.error, tr), "error");
        if (res.error === "unavailable") router.refresh();
        return;
      }
      finish(method);
    });

  const payOnline = () =>
    start(async () => {
      const res = await startRazorpay(slug, { itemId: item.id, amount, ...guest });
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      if (!(await loadRazorpay()) || !window.Razorpay) return toast(errorText("payments_off", tr), "error");
      new window.Razorpay({
        key: res.keyId,
        order_id: res.orderId,
        amount: res.amountPaise,
        currency: "INR",
        name: couple,
        description: item.title,
        prefill: { name: guest.anonymous ? "" : guest.name, contact: guest.anonymous ? "" : guest.phone },
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#9B1C31" },
        handler: async (r: RazorpayHandlerResponse) => {
          const ok = await confirmRazorpay({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
          if (ok.ok) finish("razorpay");
          else toast(tr("Payment received. It will show up shortly.", "भुगतान मिल गया, थोड़ी देर में दिखेगा।"));
        },
      }).open();
    });

  const title =
    step === "done"
      ? tr("Thank you!", "धन्यवाद!")
      : step === "upi"
        ? tr(`Pay ${inr(amount)} by UPI`, `UPI से ${inr(amount)} भेजें`)
        : item.kind === "fund"
          ? item.title
          : tr("Chip in for this gift", "इस तोहफ़े में योगदान दें");

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      description={step === "amount" && item.kind === "product" ? item.title : undefined}
      purpose={step === "done" ? "info" : "form"}
      height={step === "done" ? "hug" : "tall"}
    >
      {step === "amount" && (
        <form
          className="space-y-5 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            if (upi) setStep("upi");
            else if (razorpay) payOnline();
            else record("cash");
          }}
        >
          <Field label={tr("Choose an amount", "राशि चुनें")} inputID="shagun-amount" isGroupLabel description={cap != null ? tr(`${inr(cap)} still needed for this gift`, `इस तोहफ़े के लिए ${inr(cap)} बाकी`) : undefined}>
            <div className="space-y-2.5">
              <AmountChips amounts={cap != null && !suggestions.includes(cap) ? [...suggestions.slice(0, 5), cap] : suggestions} value={amount} onChange={(n) => setAmountText(String(n))} />
              <TextInput
                label={tr("Other amount (₹)", "अन्य राशि (₹)")}
                width="100%"
                size="lg"
                inputMode="numeric"
                placeholder={tr("Type any amount", "कोई भी राशि लिखें")}
                value={amountText}
                onChange={(v) => setAmountText(v.replace(/\D/g, "").slice(0, 7))}
                status={overCap ? { type: "error", message: tr(`Only ${inr(cap)} is still needed`, `सिर्फ़ ${inr(cap)} बाकी है`) } : undefined}
                statusVariant="detached"
              />
            </div>
          </Field>
          {plusOne !== amount && (cap == null || plusOne <= cap) && (
            <Button width="100%" icon={<Icon icon={Sparkles} />} label={tr(`Make it ${inr(plusOne)}. The extra ₹1 is for good luck`, `${inr(plusOne)} कर दें, ऊपर का ₹1 शुभ माना जाता है`)} onClick={() => setAmountText(String(plusOne))} />
          )}

          <GuestFields value={guest} onChange={(p) => setGuest((g) => ({ ...g, ...p }))} />

          <div className="space-y-2.5">
            {upi && <Button type="submit" variant="primary" size="lg" width="100%" isDisabled={!ready} label={amount ? tr(`Pay ${inr(amount)} by UPI`, `UPI से ${inr(amount)} भेजें`) : tr("Pay by UPI", "UPI से भेजें")} icon={<Icon icon={Smartphone} />} />}
            {razorpay && (
              <Button
                type={upi ? "button" : "submit"}
                variant={upi ? "secondary" : "primary"}
                size="lg"
                width="100%"
                isDisabled={!ready}
                isLoading={pending}
                label={tr("Card / Netbanking / Wallet", "कार्ड / नेटबैंकिंग / वॉलेट")}
                icon={<Icon icon={CreditCard} />}
                onClick={upi ? payOnline : undefined}
              />
            )}
            <Button
              type={!upi && !razorpay ? "submit" : "button"}
              variant={!upi && !razorpay ? "primary" : "ghost"}
              size="lg"
              width="100%"
              isDisabled={!ready}
              isLoading={pending && !razorpay}
              label={tr("I'll give it in person", "मैं ख़ुद आकर दूँगा/दूँगी")}
              icon={<Icon icon={HandHeart} />}
              onClick={upi || razorpay ? () => record("cash") : undefined}
            />
          </div>
          {!upi && !razorpay && (
            <Text as="p" type="supporting" display="block" justify="center">
              {tr("The couple hasn't set up online payments yet. Bring your envelope to the wedding and we'll let them know to expect it.", "जोड़े ने अभी ऑनलाइन भुगतान शुरू नहीं किया है। लिफ़ाफ़ा शादी में ले आएँ, हम उन्हें बता देंगे।")}
            </Text>
          )}
          <p className="flex items-start justify-center gap-1.5 text-center text-sm text-secondary">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden />
            {tr("Private: other guests can't see your name or amount.", "निजी: दूसरे मेहमान आपका नाम या राशि नहीं देख सकते।")}
          </p>
        </form>
      )}

      {step === "upi" && upi && (
        <div className="space-y-4 pb-2">
          <div className="-ml-2">
            <Button variant="ghost" size="sm" label={tr("Change amount", "राशि बदलें")} icon={<Icon icon={ArrowLeft} />} onClick={() => setStep("amount")} />
          </div>

          <Card padding={5}>
            <div className="text-center">
              <Text type="supporting">{tr("Paying to", "किसे भेज रहे हैं")}</Text>
              <p className="text-xl font-bold text-primary">{upi.name}</p>
              <p className="font-mono text-[15px] text-secondary">{upi.id}</p>

              {touch && (
                <div className="mt-4">
                  <Button variant="primary" size="lg" width="100%" href={upiLink} label={tr("Open UPI app", "UPI ऐप खोलें")} icon={<Icon icon={Smartphone} />} />
                </div>
              )}
              <p className="mt-4 text-[15px] font-semibold text-primary">{touch ? tr("or scan from another phone", "या दूसरे फ़ोन से स्कैन करें") : tr("Scan with any UPI app", "किसी भी UPI ऐप से स्कैन करें")}</p>
              <div className="mx-auto mt-2 grid size-52 place-items-center rounded-xl border border-border bg-white p-2">
                {qr ? <img src={qr} alt={tr("UPI QR code", "UPI QR कोड")} className="size-full" /> : <span className="size-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-r-transparent" />}
              </div>
              <Text type="supporting">PhonePe · Google Pay · Paytm · BHIM</Text>
              <div className="mt-3 flex justify-center">
                <CopyButton text={upi.id} label={tr("Copy UPI ID", "UPI ID कॉपी करें")} />
              </div>
            </div>
          </Card>

          <Card variant="muted" padding={4}>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-primary">{tr("After paying, come back here", "भुगतान के बाद यहाँ वापस आएँ")}</p>
                <Text as="p" type="supporting" display="block">
                  {tr("The couple confirms your gift when they see it in their bank. A screenshot or reference number helps them find it.", "जोड़ा बैंक में देखकर आपके तोहफ़े की पुष्टि करेगा। स्क्रीनशॉट या रेफ़रेंस नंबर से उन्हें आसानी होगी।")}
                </Text>
              </div>
              <Field label={tr("Payment screenshot", "भुगतान का स्क्रीनशॉट")} inputID="upi-proof" isOptional>
                <PhotoPicker label={tr("Add payment screenshot", "भुगतान का स्क्रीनशॉट जोड़ें")} value={proof} onPick={setProof} onRemove={() => setProof(null)} maxSide={1100} />
              </Field>
              <TextInput label={tr("UPI reference no. (UTR)", "UPI रेफ़रेंस नंबर (UTR)")} isOptional width="100%" value={utr} onChange={(v) => setUtr(v.replace(/[^A-Za-z0-9]/g, "").slice(0, 30))} inputMode="numeric" placeholder="412345678901" />
              <Button variant="primary" size="lg" width="100%" isLoading={pending} label={tr(`I've paid ${inr(amount)}`, `मैंने ${inr(amount)} भेज दिए`)} icon={<Icon icon={Check} />} onClick={() => record("upi")} />
            </div>
          </Card>
        </div>
      )}

      {step === "done" && (
        <div className="pb-2 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-accent" aria-hidden>
            {doneMethod === "cash" ? <Mail className="size-8" /> : <PartyPopper className="size-8" />}
          </span>
          <p className="mt-3 font-display text-4xl font-semibold text-accent">{inr(amount)}</p>
          <div className="mt-3">
            <Banner
              status={doneMethod === "razorpay" ? "success" : "info"}
              collapsible={false}
              title={
                doneMethod === "cash"
                  ? tr(`We've told ${couple} to expect your ${giftWord.toLowerCase()}`, `हमने ${couple} को बता दिया है`)
                  : doneMethod === "razorpay"
                    ? tr(`Your ${giftWord.toLowerCase()} has reached ${couple}`, `आपका ${giftWord} ${couple} तक पहुँच गया`)
                    : tr("Sent to the couple for confirmation", "पुष्टि के लिए जोड़े को भेजा गया")
              }
              description={
                doneMethod === "upi"
                  ? tr(`${couple} will see your blessing and confirm once the money shows up in their UPI app.`, `पैसा UPI ऐप में दिखते ही ${couple} आपका आशीर्वाद देखकर पुष्टि करेंगे।`)
                  : tr("Your blessings mean a lot!", "आपका आशीर्वाद अनमोल है!")
              }
            />
          </div>
          <div className="mt-6">
            <Button size="lg" width="100%" label={tr("Done", "ठीक है")} onClick={onClose} />
          </div>
        </div>
      )}
    </Sheet>
  );
}
