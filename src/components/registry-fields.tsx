"use client";

import { useRef, useState } from "react";
import { Camera, Check, Trash2 } from "lucide-react";
import { useLang, useTr } from "@/components/lang";
import { Field, toast } from "@/components/ui/bits";
import { compressImage } from "@/lib/image";
import { THEMES, cn, type ThemeKey } from "@/lib/utils";

export type RegistryDraft = {
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string;
  city: string;
  note: string;
  theme: string;
  /** data URL, null (none), or "keep" (unchanged on edit) */
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const shown = value.photo === "keep" ? currentPhoto : value.photo;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange({ photo: await compressImage(file) });
    } catch {
      toast(tr("Couldn't use that photo. Try another one.", "यह फ़ोटो नहीं लग पाई। कोई और चुनें।"), "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr("Your name", "आपका नाम")}>
          <input className="input" value={value.partnerOne} onChange={(e) => onChange({ partnerOne: e.target.value })} maxLength={40} placeholder={tr("Ananya", "अनन्या")} autoComplete="given-name" />
        </Field>
        <Field label={tr("Partner's name", "साथी का नाम")}>
          <input className="input" value={value.partnerTwo} onChange={(e) => onChange({ partnerTwo: e.target.value })} maxLength={40} placeholder={tr("Rohan", "रोहन")} autoComplete="off" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tr("Wedding date", "शादी की तारीख़")} optional>
          <input className="input" type="date" value={value.weddingDate} onChange={(e) => onChange({ weddingDate: e.target.value })} />
        </Field>
        <Field label={tr("City", "शहर")} optional>
          <input className="input" value={value.city} onChange={(e) => onChange({ city: e.target.value })} maxLength={60} placeholder={tr("Jaipur", "जयपुर")} autoComplete="address-level2" />
        </Field>
      </div>

      {showNote && (
        <Field label={tr("A short note for guests", "मेहमानों के लिए छोटा संदेश")} optional>
          <textarea
            className="input"
            rows={3}
            maxLength={400}
            value={value.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder={tr("Your presence is the real gift. If you'd still like to bless us, here are a few things for our new home.", "आपका आना ही सबसे बड़ा तोहफ़ा है। फिर भी आशीर्वाद देना चाहें, तो हमारे नए घर के लिए कुछ चीज़ें ये रहीं।")}
          />
        </Field>
      )}

      <div>
        <span className="label">
          {tr("Couple photo", "जोड़े की फ़ोटो")} <span className="ml-1.5 font-normal text-muted">({tr("optional", "वैकल्पिक")})</span>
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line bg-white text-muted hover:border-primary"
            aria-label={tr("Choose photo", "फ़ोटो चुनें")}
          >
            {shown ? <img src={shown} alt="" className="size-full object-cover" /> : <Camera className="size-7" />}
            {busy && <span className="absolute inset-0 grid place-items-center bg-white/70"><span className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent" /></span>}
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" onClick={() => fileRef.current?.click()}>
              {shown ? tr("Change photo", "फ़ोटो बदलें") : tr("Add photo", "फ़ोटो जोड़ें")}
            </button>
            {shown && (
              <button type="button" className="chip text-red-700" onClick={() => onChange({ photo: null })}>
                <Trash2 className="size-4" /> {tr("Remove", "हटाएँ")}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>
      </div>

      <div>
        <span className="label">{tr("Colour", "रंग")}</span>
        <div className="flex flex-wrap gap-2.5">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ theme: k })}
              aria-pressed={value.theme === k}
              className={cn(
                "flex h-12 items-center gap-2 rounded-full border-2 bg-white pl-1.5 pr-4 text-[15px] font-semibold",
                value.theme === k ? "border-ink" : "border-line",
              )}
            >
              <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: THEMES[k].primary }}>
                {value.theme === k && <Check className="size-4" />}
              </span>
              {lang === "hi" ? THEMES[k].nameHi : THEMES[k].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
