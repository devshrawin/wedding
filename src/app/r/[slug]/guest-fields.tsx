"use client";

import { useTr } from "@/components/lang";
import { Field, Switch } from "@/components/ui/bits";

export type GuestInfo = { name: string; phone: string; message: string; anonymous: boolean };

const KEY = "giftr_guest";

/** Remembered on this device only, so a returning guest doesn't retype their name. */
export function loadGuest(): { name: string; phone: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return v && typeof v.name === "string" ? { name: v.name, phone: typeof v.phone === "string" ? v.phone : "" } : null;
  } catch {
    return null;
  }
}

export function saveGuest(g: GuestInfo) {
  if (g.anonymous) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: g.name, phone: g.phone }));
  } catch {
    /* private mode */
  }
}

export function GuestFields({ value, onChange }: { value: GuestInfo; onChange: (p: Partial<GuestInfo>) => void }) {
  const tr = useTr();
  return (
    <div className="space-y-4">
      {!value.anonymous && (
        <>
          <Field label={tr("Your name", "आपका नाम")}>
            <input className="input" value={value.name} maxLength={60} onChange={(e) => onChange({ name: e.target.value })} placeholder={tr("Sunita Sharma (Bua ji)", "सुनीता शर्मा (बुआ जी)")} autoComplete="name" />
          </Field>
          <Field label={tr("Mobile number", "मोबाइल नंबर")} optional hint={tr("Only the couple sees this — so they can thank you on WhatsApp.", "यह सिर्फ़ जोड़े को दिखता है — ताकि वे WhatsApp पर धन्यवाद कह सकें।")}>
            <input className="input" type="tel" inputMode="numeric" value={value.phone} maxLength={14} onChange={(e) => onChange({ phone: e.target.value.replace(/[^\d\s+]/g, "") })} placeholder="98765 43210" autoComplete="tel-national" />
          </Field>
        </>
      )}
      <Field label={tr("Blessing for the couple", "जोड़े के लिए आशीर्वाद")} optional>
        <textarea className="input" rows={2} maxLength={300} value={value.message} onChange={(e) => onChange({ message: e.target.value })} placeholder={tr("Wishing you a lifetime of happiness!", "आप दोनों को ढेर सारी ख़ुशियाँ मिलें!")} />
      </Field>
      <div className="rounded-2xl border border-line bg-white px-4 py-1">
        <Switch
          checked={value.anonymous}
          onChange={(v) => onChange({ anonymous: v })}
          label={tr("Give anonymously", "गुमनाम रहकर दें")}
          hint={tr("We won't record your name. A surprise blessing!", "हम आपका नाम दर्ज नहीं करेंगे। एक गुप्त आशीर्वाद!")}
        />
      </div>
    </div>
  );
}
