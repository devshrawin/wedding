"use client";

import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useTr } from "@/components/lang";

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
          <TextInput label={tr("Your name", "आपका नाम")} width="100%" size="lg" value={value.name} onChange={(v) => onChange({ name: v.slice(0, 60) })} placeholder={tr("Sunita Sharma (Bua ji)", "सुनीता शर्मा (बुआ जी)")} autoComplete="name" />
          <TextInput
            label={tr("Mobile number", "मोबाइल नंबर")}
            isOptional
            description={tr("Only the couple sees this, so they can thank you on WhatsApp.", "यह सिर्फ़ जोड़े को दिखता है, ताकि वे WhatsApp पर धन्यवाद कह सकें।")}
            width="100%"
            type="tel"
            inputMode="numeric"
            value={value.phone}
            onChange={(v) => onChange({ phone: v.replace(/[^\d\s+]/g, "").slice(0, 14) })}
            placeholder="98765 43210"
            autoComplete="tel-national"
          />
        </>
      )}
      <TextArea
        label={tr("Blessing for the couple", "जोड़े के लिए आशीर्वाद")}
        isOptional
        width="100%"
        rows={2}
        maxLength={300}
        value={value.message}
        onChange={(v) => onChange({ message: v })}
        placeholder={tr("Wishing you a lifetime of happiness!", "आप दोनों को ढेर सारी ख़ुशियाँ मिलें!")}
      />
      <Switch
        label={tr("Give anonymously", "गुमनाम रहकर दें")}
        description={tr("We won't record your name. A surprise blessing!", "हम आपका नाम दर्ज नहीं करेंगे। एक गुप्त आशीर्वाद!")}
        labelSpacing="spread"
        width="100%"
        value={value.anonymous}
        onChange={(v) => onChange({ anonymous: v })}
      />
    </div>
  );
}
