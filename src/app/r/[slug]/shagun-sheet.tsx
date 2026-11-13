"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Check, CreditCard, HandHeart, ShieldCheck, Smartphone } from "lucide-react";
import { confirmRazorpay, contribute, startRazorpay } from "@/app/actions/guest";
import { useTr } from "@/components/lang";
import { Button, buttonClass } from "@/components/ui/button";
import { CopyButton, toast } from "@/components/ui/bits";
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
  onClose,
}: {
  slug: string;
  couple: string;
  item: GuestItem;
  upi: { id: string; name: string } | null;
  razorpay: boolean;
  guestName: string | null;
  onClose: () => void;
}) {
  const tr = useTr();
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [amountText, setAmountText] = useState("");
  const [guest, setGuest] = useState<GuestInfo>({ name: guestName ?? "", phone: "", message: "", anonymous: false });
  const [doneMethod, setDoneMethod] = useState<"upi" | "cash" | "razorpay">("upi");
  const [utr, setUtr] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const [pending, start] = useTransition();

  const amount = Number(amountText) || 0;
  const suggestions = shagunSuggestions(item.kind === "fund" ? item.target : item.price);
  const plusOne = toShagunAmount(amount);
  const identityOk = guest.anonymous || guest.name.trim().length > 0;
  const ready = amount >= 1 && amount <= 1_000_000 && identityOk;
  const upiLink = upi ? buildUpiLink({ pa: upi.id, pn: upi.name, am: amount, tn: `Shagun for ${couple}`.slice(0, 50) }) : "";

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
      const res = await contribute(slug, { itemId: item.id, amount, method, utr: method === "upi" ? utr : undefined, ...guest });
      if (!res.ok) return toast(errorText(res.error, tr), "error");
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
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#8c1d2f" },
        handler: async (r: RazorpayHandlerResponse) => {
          const ok = await confirmRazorpay({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
          if (ok.ok) finish("razorpay");
          else toast(tr("Payment received — it will show up shortly.", "भुगतान मिल गया — थोड़ी देर में दिखेगा।"));
        },
      }).open();
    });

  const title =
    step === "done" ? tr("Thank you! 🙏", "धन्यवाद! 🙏") : step === "upi" ? tr(`Pay ${inr(amount)} by UPI`, `UPI से ${inr(amount)} भेजें`) : item.kind === "fund" ? item.title : tr("Chip in for this gift", "इस तोहफ़े में योगदान दें");

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={title} description={step === "amount" && item.kind === "product" ? item.title : undefined}>
      {step === "amount" && (
        <form
          className="pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            if (upi) setStep("upi");
            else if (razorpay) payOnline();
            else record("cash");
          }}
        >
          <span className="label">{tr("Choose an amount", "राशि चुनें")}</span>
          <div className="grid grid-cols-3 gap-2">
            {suggestions.map((a) => (
              <button key={a} type="button" aria-pressed={amount === a} onClick={() => setAmountText(String(a))} className="chip h-13 justify-center px-2 text-[17px]">
                {inr(a)}
              </button>
            ))}
            <div className="relative col-span-3 sm:col-span-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted">₹</span>
              <input
                className="input pl-9 text-lg font-semibold"
                inputMode="numeric"
                aria-label={tr("Other amount", "अन्य राशि")}
                placeholder={tr("Other amount", "अन्य राशि")}
                value={suggestions.includes(amount) ? "" : amountText}
                onChange={(e) => setAmountText(e.target.value.replace(/\D/g, "").slice(0, 7))}
              />
            </div>
          </div>
          {plusOne !== amount && (
            <button type="button" onClick={() => setAmountText(String(plusOne))} className="mt-2.5 flex min-h-11 w-full items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-left text-[15px] font-semibold text-amber-900">
              <span aria-hidden>✨</span>
              {tr(`Make it ${inr(plusOne)} — the extra ₹1 is for good luck`, `${inr(plusOne)} कर दें — ऊपर का ₹1 शुभ माना जाता है`)}
            </button>
          )}

          <div className="mt-5">
            <GuestFields value={guest} onChange={(p) => setGuest((g) => ({ ...g, ...p }))} />
          </div>

          <div className="mt-5 space-y-2.5">
            {upi && (
              <Button type="submit" size="lg" block disabled={!ready}>
                <Smartphone className="size-5" /> {amount ? tr(`Pay ${inr(amount)} by UPI`, `UPI से ${inr(amount)} भेजें`) : tr("Pay by UPI", "UPI से भेजें")}
              </Button>
            )}
            {razorpay && (
              <Button type={upi ? "button" : "submit"} variant={upi ? "outline" : "primary"} size="lg" block disabled={!ready} loading={pending} onClick={upi ? payOnline : undefined}>
                <CreditCard className="size-5" /> {tr("Card / Netbanking / Wallet", "कार्ड / नेटबैंकिंग / वॉलेट")}
              </Button>
            )}
            <Button type={!upi && !razorpay ? "submit" : "button"} variant={!upi && !razorpay ? "primary" : "ghost"} size="lg" block disabled={!ready} loading={pending && !razorpay} onClick={upi || razorpay ? () => record("cash") : undefined}>
              <HandHeart className="size-5" /> {tr("I'll give it in person", "मैं ख़ुद आकर दूँगा/दूँगी")}
            </Button>
          </div>
          {!upi && !razorpay && (
            <p className="mt-3 text-center text-sm text-muted">{tr("The couple hasn't set up online payments yet. Let them know what to expect — and bring your envelope to the wedding.", "जोड़े ने अभी ऑनलाइन भुगतान शुरू नहीं किया है। उन्हें बता दें — और लिफ़ाफ़ा शादी में ले आएँ।")}</p>
          )}
          <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-sm text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" />
            {tr("Private: other guests can't see your name or amount.", "निजी: दूसरे मेहमान आपका नाम या राशि नहीं देख सकते।")}
          </p>
        </form>
      )}

      {step === "upi" && upi && (
        <div className="pb-2">
          <button type="button" onClick={() => setStep("amount")} className="-ml-2 mb-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-muted hover:bg-sand">
            <ArrowLeft className="size-4" /> {tr("Change amount", "राशि बदलें")}
          </button>

          <div className="rounded-3xl border border-line bg-white p-5 text-center">
            <p className="text-[15px] text-muted">{tr("Paying to", "किसे भेज रहे हैं")}</p>
            <p className="text-xl font-bold">{upi.name}</p>
            <p className="font-mono text-[15px] text-muted">{upi.id}</p>

            {touch && (
              <a href={upiLink} className={buttonClass({ size: "lg", block: true, className: "mt-4" })}>
                <Smartphone className="size-5" /> {tr("Open UPI app", "UPI ऐप खोलें")}
              </a>
            )}
            <p className="mt-4 text-[15px] font-semibold">{touch ? tr("or scan from another phone", "या दूसरे फ़ोन से स्कैन करें") : tr("Scan with any UPI app", "किसी भी UPI ऐप से स्कैन करें")}</p>
            <div className="mx-auto mt-2 grid size-52 place-items-center rounded-2xl border border-line bg-white p-2">
              {qr ? <img src={qr} alt={tr("UPI QR code", "UPI QR कोड")} className="size-full" /> : <span className="size-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />}
            </div>
            <p className="mt-1 text-sm text-muted">PhonePe · Google Pay · Paytm · BHIM</p>
            <div className="mt-3 flex justify-center">
              <CopyButton text={upi.id} label={tr("Copy UPI ID", "UPI ID कॉपी करें")} />
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-primary-soft p-4">
            <p className="font-semibold text-primary-deep">{tr("After paying, come back and tap below", "भुगतान के बाद वापस आकर नीचे टैप करें")}</p>
            <input className="input mt-3" value={utr} maxLength={30} onChange={(e) => setUtr(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} placeholder={tr("UPI reference no. (optional)", "UPI रेफ़रेंस नंबर (वैकल्पिक)")} inputMode="numeric" aria-label={tr("UPI reference number", "UPI रेफ़रेंस नंबर")} />
            <Button size="lg" block className="mt-2.5" loading={pending} onClick={() => record("upi")}>
              <Check className="size-5" /> {tr(`I've paid ${inr(amount)}`, `मैंने ${inr(amount)} भेज दिए`)}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="pb-2 text-center">
          <p className="text-6xl" aria-hidden>{doneMethod === "cash" ? "✉️" : "🎉"}</p>
          <p className="mt-3 font-display text-4xl font-semibold text-primary">{inr(amount)}</p>
          <p className="mt-3 text-[17px] text-muted">
            {doneMethod === "cash"
              ? tr(`We've told ${couple} to expect your shagun. See you at the wedding!`, `हमने ${couple} को बता दिया है कि आपका शगुन आ रहा है। शादी में मिलते हैं!`)
              : doneMethod === "razorpay"
                ? tr(`Your shagun has reached ${couple}. Your blessings mean a lot!`, `आपका शगुन ${couple} तक पहुँच गया। आपका आशीर्वाद अनमोल है!`)
                : tr(`${couple} will see your shagun and blessing as soon as they confirm it in their UPI app.`, `${couple} अपने UPI ऐप में पुष्टि करते ही आपका शगुन और आशीर्वाद देख लेंगे।`)}
          </p>
          <Button size="lg" block className="mt-6" onClick={onClose}>
            {tr("Done", "ठीक है")}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
