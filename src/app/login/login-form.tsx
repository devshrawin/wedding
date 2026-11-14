"use client";

import { useEffect, useState, useTransition } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requestOtp, verifyOtp } from "@/app/actions/auth";
import { useTr } from "@/components/lang";
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

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const send = () => {
    setError(null);
    if (!normalizePhone(phone)) {
      setError(tr("Enter a valid 10-digit mobile number.", "सही 10 अंकों का मोबाइल नंबर डालें।"));
      return;
    }
    start(async () => {
      const res = await requestOtp(phone);
      if (!res.ok) return setError(errorText(res.error, tr));
      if (res.demoCode) setDemoCode(res.demoCode);
      setStep("otp");
      setResendIn(res.waitSeconds ?? 30);
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

  return (
    <Card padding={6} elevation="low">
      {step === "phone" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="space-y-5"
        >
          <div>
            <Heading level={1}>{tr("Welcome", "स्वागत है")}</Heading>
            <Text as="p" type="supporting" display="block">
              {tr("Enter your mobile number. We'll send a 6-digit code.", "अपना मोबाइल नंबर डालें। हम 6 अंकों का कोड भेजेंगे।")}
            </Text>
          </div>
          <TextInput
            label={tr("Mobile number", "मोबाइल नंबर")}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            size="lg"
            width="100%"
            placeholder="98765 43210"
            description={tr("Indian number, +91", "भारतीय नंबर, +91")}
            value={phone}
            onChange={(v) => setPhone(v.replace(/[^\d\s+]/g, "").slice(0, 14))}
            hasAutoFocus
            status={error ? { type: "error", message: error } : undefined}
            statusVariant="detached"
          />
          <Button type="submit" variant="primary" size="lg" width="100%" label={tr("Send code", "कोड भेजें")} isLoading={pending} />
          <p className="flex items-start gap-2 text-sm text-secondary">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden />
            {tr("Your number is only used to sign you in. Guests never see it.", "आपका नंबर सिर्फ़ लॉग इन के लिए है। मेहमानों को यह कभी नहीं दिखता।")}
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          className="space-y-5"
        >
          <div className="-ml-2">
            <Button variant="ghost" size="sm" label={tr("Change number", "नंबर बदलें")} icon={<Icon icon={ArrowLeft} />} onClick={() => setStep("phone")} />
          </div>
          <div>
            <Heading level={1}>{tr("Enter the code", "कोड डालें")}</Heading>
            <Text as="p" type="supporting" display="block">
              {tr("Sent to", "भेजा गया:")} <strong className="text-primary">{prettyPhone(normalizePhone(phone))}</strong>
            </Text>
          </div>

          {demoCode && (
            <Banner
              status="warning"
              title={tr("Demo mode: no SMS is sent", "डेमो मोड, SMS नहीं भेजा जाता")}
              description={tr(`Your code is ${demoCode}`, `आपका कोड है ${demoCode}`)}
              collapsible={false}
              endContent={<Button size="sm" label={tr("Use code", "कोड लगाएँ")} onClick={() => { setCode(demoCode); verify(demoCode); }} />}
            />
          )}

          <TextInput
            label={tr("6-digit code", "6 अंकों का कोड")}
            inputMode="numeric"
            autoComplete="one-time-code"
            size="lg"
            width="100%"
            placeholder="••••••"
            value={code}
            hasAutoFocus
            controlStyle={{ letterSpacing: "0.4em", fontSize: "1.5rem", fontWeight: 700, textAlign: "center" }}
            onChange={(v) => {
              const d = v.replace(/\D/g, "").slice(0, 6);
              setCode(d);
              if (d.length === 6) verify(d);
            }}
            status={error ? { type: "error", message: error } : undefined}
            statusVariant="detached"
          />
          <Button type="submit" variant="primary" size="lg" width="100%" label={tr("Verify & continue", "जाँचें और आगे बढ़ें")} isLoading={pending} isDisabled={code.length !== 6} />
          <div className="text-center">
            {resendIn > 0 ? (
              <Text type="supporting">{tr(`You can resend in ${resendIn}s`, `${resendIn} सेकंड में दोबारा भेज सकते हैं`)}</Text>
            ) : (
              <Button variant="ghost" label={tr("Resend code", "कोड दोबारा भेजें")} onClick={send} isDisabled={pending} />
            )}
            <Text as="p" type="supporting" display="block">
              {tr("Earlier codes keep working for 10 minutes.", "पहले भेजे कोड 10 मिनट तक चलते रहेंगे।")}
            </Text>
          </div>
        </form>
      )}
    </Card>
  );
}
