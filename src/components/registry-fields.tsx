"use client";

import { DateInput } from "@astryxdesign/core/DateInput";
import { Field } from "@astryxdesign/core/Field";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Check } from "lucide-react";
import { useLang, useTr } from "@/components/lang";
import { PhotoPicker } from "@/components/ui/kit";
import { THEMES, cn, type ThemeKey } from "@/lib/utils";

export type RegistryDraft = {
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string;
  city: string;
  note: string;
  theme: string;
  /** data URL (new photo), null (none), or "keep" (unchanged on edit) */
  photo: string | null;
};

/** Shared by the 60-second wizard and the settings screen. */
export function RegistryFields({
  value,
  onChange,
  currentPhoto,
  showNote = true,
}: {
  value: RegistryDraft;
  onChange: (patch: Partial<RegistryDraft>) => void;
  currentPhoto?: string | null;
  showNote?: boolean;
}) {
  const tr = useTr();
  const lang = useLang();
  const shown = value.photo === "keep" ? (currentPhoto ?? null) : value.photo;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <TextInput label={tr("Your name", "आपका नाम")} width="100%" size="lg" value={value.partnerOne} onChange={(v) => onChange({ partnerOne: v.slice(0, 40) })} placeholder={tr("Ananya", "अनन्या")} autoComplete="given-name" />
        <TextInput label={tr("Partner's name", "साथी का नाम")} width="100%" size="lg" value={value.partnerTwo} onChange={(v) => onChange({ partnerTwo: v.slice(0, 40) })} placeholder={tr("Rohan", "रोहन")} autoComplete="off" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DateInput
          label={tr("Wedding date", "शादी की तारीख़")}
          isOptional
          size="lg"
          placeholder={tr("Pick a date", "तारीख़ चुनें")}
          value={(value.weddingDate || undefined) as never}
          onChange={(v) => onChange({ weddingDate: v ?? "" })}
        />
        <TextInput label={tr("City", "शहर")} isOptional width="100%" size="lg" value={value.city} onChange={(v) => onChange({ city: v.slice(0, 60) })} placeholder={tr("Jaipur", "जयपुर")} autoComplete="address-level2" />
      </div>

      {showNote && (
        <TextArea
          label={tr("A short note for guests", "मेहमानों के लिए छोटा संदेश")}
          isOptional
          width="100%"
          rows={3}
          maxLength={400}
          value={value.note}
          onChange={(v) => onChange({ note: v })}
          placeholder={tr("Your presence is the real gift. If you'd still like to bless us, here are a few things for our new home.", "आपका आना ही सबसे बड़ा तोहफ़ा है। फिर भी आशीर्वाद देना चाहें, तो हमारे नए घर के लिए कुछ चीज़ें ये रहीं।")}
        />
      )}

      <Field label={tr("Couple photo", "जोड़े की फ़ोटो")} inputID="couple-photo" isOptional>
        <PhotoPicker round label={tr("Choose couple photo", "जोड़े की फ़ोटो चुनें")} maxSide={720} value={shown} onPick={(d) => onChange({ photo: d })} onRemove={() => onChange({ photo: null })} />
      </Field>

      <Field label={tr("Colour of your page", "आपके पेज का रंग")} inputID="theme-colour" isGroupLabel>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={tr("Colour of your page", "आपके पेज का रंग")}>
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
            const on = value.theme === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ theme: k })}
                className={cn(
                  "flex h-12 items-center gap-2 rounded-full border-2 bg-surface pl-1.5 pr-4 text-[15px] font-semibold text-primary transition-colors",
                  on ? "border-[var(--color-text-primary)]" : "border-border hover:border-[var(--color-border-emphasized)]",
                )}
              >
                <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: THEMES[k].primary }}>
                  {on && <Check className="size-4" aria-hidden />}
                </span>
                {lang === "hi" ? THEMES[k].nameHi : THEMES[k].name}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
