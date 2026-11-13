"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requestOtp, verifyOtp } from "@/app/actions/auth";
import { useTr } from "@/components/lang";
import { Button } from "@/components/ui/button";
import { errorText } from "@/lib/result";
import { normalizePhone, prettyPhone } from "@/lib/utils";

export function LoginForm({ next }: { next: string }) {
  const tr = useTr();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [pending, start] = useTransition();
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  const send = () => {
    setError(null);
    if (!normalizePhone(phone)) {
      setError(tr("Enter a valid 10-digit mobile number.", "सही 10 अंकों का मोबाइल नंबर डालें।"));
      return;
    }
    start(async () => {
      const res = await requestOtp(phone);
      if (!res.ok) return setError(errorText(res.error, tr));
      setDemoCode(res.demoCode ?? null);
      setCode("");
      setStep("otp");
      setResendIn(30);
    });
  };

  const verify = (value = code) => {
    setError(null);
    start(async () => {
      const res = await verifyOtp(phone, value);
      if (!res.ok) return setError(errorText(res.error, tr));
      // Full navigation so every server component sees the new session.
      window.location.assign(next);
    });
  };

  if (step === "phone") {
    return (
      <form
        className="card p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <h1 className="text-3xl font-semibold">{tr("Welcome", "स्वागत है")} 🙏</h1>
        <p className="mt-2 text-muted">{tr("Enter your mobile number. We'll send a one-time code.", "अपना मोबाइल नंबर डालें। हम एक कोड (OTP) भेजेंगे।")}</p>
        <label className="mt-6 block">
          <span className="label">{tr("Mobile number", "मोबाइल नंबर")}</span>
          <div className="flex h-14 items-center rounded-2xl border border-line bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <span className="border-r border-line px-4 text-lg font-semibold text-muted">+91</span>
            <input
              className="h-full w-full rounded-r-2xl bg-transparent px-4 text-xl font-semibold tracking-wide outline-none placeholder:font-normal placeholder:text-muted/50"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              maxLength={14}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+]/g, ""))}
              autoFocus
            />
          </div>
        </label>
        {error && <p className="mt-3 text-[15px] font-semibold text-red-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" block className="mt-5" loading={pending}>
          {tr("Send code", "कोड भेजें")}
        </Button>
        <p className="mt-5 flex items-start gap-2 text-sm text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" />
          {tr("Your number is only used to sign you in. Guests never see it.", "आपका नंबर सिर्फ़ लॉग इन के लिए है। मेहमानों को यह कभी नहीं दिखता।")}
        </p>
      </form>
    );
  }

  return (
    <form
      className="card p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
    >
      <button type="button" onClick={() => setStep("phone")} className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-muted hover:bg-sand">
        <ArrowLeft className="size-4" /> {tr("Change number", "नंबर बदलें")}
      </button>
      <h1 className="mt-2 text-3xl font-semibold">{tr("Enter the code", "कोड डालें")}</h1>
      <p className="mt-2 text-muted">
        {tr("Sent to", "भेजा गया:")} <span className="font-semibold text-ink">{prettyPhone(normalizePhone(phone))}</span>
      </p>

      {demoCode && (
        <div className="mt-4 rounded-2xl border border-dashed border-gold bg-amber-50 p-4 text-[15px]">
          <p className="font-semibold text-ink">{tr("Demo mode — no SMS is sent", "डेमो मोड — SMS नहीं भेजा जाता")}</p>
          <p className="mt-1 text-muted">
            {tr("Your code is", "आपका कोड है")}{" "}
            <button type="button" className="font-mono text-lg font-bold tracking-widest text-primary underline" onClick={() => { setCode(demoCode); verify(demoCode); }}>
              {demoCode}
            </button>
          </p>
        </div>
      )}

      <input
        ref={otpRef}
        aria-label={tr("6-digit code", "6 अंकों का कोड")}
        className="input mt-5 h-16 text-center font-mono text-3xl font-bold tracking-[0.4em]"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="••••••"
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          setCode(v);
          if (v.length === 6) verify(v);
        }}
      />
      {error && <p className="mt-3 text-[15px] font-semibold text-red-700" role="alert">{error}</p>}
      <Button type="submit" size="lg" block className="mt-5" loading={pending} disabled={code.length !== 6}>
        {tr("Verify & continue", "जाँचें और आगे बढ़ें")}
      </Button>
      <div className="mt-4 text-center text-[15px] text-muted">
        {resendIn > 0 ? (
          tr(`Resend code in ${resendIn}s`, `${resendIn} सेकंड में दोबारा भेजें`)
        ) : (
          <button type="button" className="h-11 font-semibold text-primary underline" onClick={send} disabled={pending}>
            {tr("Resend code", "कोड दोबारा भेजें")}
          </button>
        )}
      </div>
    </form>
  );
}
