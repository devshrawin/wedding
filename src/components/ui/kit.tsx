"use client";

import { useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { GiftIcon } from "@/components/icons";
import { useTr } from "@/components/lang";
import { compressImage } from "@/lib/image";
import { cn, inr } from "@/lib/utils";
import { toast } from "./feedback";

/** Rupee amount chips (₹501, ₹1,101…) — large targets for older relatives. */
export function AmountChips({ amounts, value, onChange }: { amounts: number[]; value: number; onChange: (n: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group">
      {amounts.map((a) => (
        <ToggleButton key={a} size="lg" label={inr(a)} isPressed={value === a} onPressedChange={() => onChange(a)} />
      ))}
    </div>
  );
}

/** Pick a photo from the phone, shrink it in the browser, hand back a data URL. */
export function PhotoPicker({
  value,
  onPick,
  onRemove,
  round,
  label,
  maxSide = 900,
}: {
  value: string | null;
  onPick: (dataUrl: string) => void | Promise<void>;
  onRemove?: () => void;
  round?: boolean;
  label: string;
  maxSide?: number;
}) {
  const tr = useTr();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      await onPick(await compressImage(file, maxSide));
    } catch {
      toast(tr("Couldn't use that photo. Try another one.", "यह फ़ोटो नहीं लग पाई। कोई और चुनें।"), "error");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        aria-label={label}
        className={cn(
          "relative grid size-20 shrink-0 place-items-center overflow-hidden border-2 border-dashed border-border bg-surface text-secondary transition-colors hover:border-[var(--color-accent)]",
          round ? "rounded-full" : "rounded-xl",
        )}
      >
        {value ? <img src={value} alt="" className="size-full object-cover" /> : round ? <Camera className="size-7" aria-hidden /> : <ImagePlus className="size-7" aria-hidden />}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/70"><span className="size-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-r-transparent" /></span>}
      </button>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" label={value ? tr("Change photo", "फ़ोटो बदलें") : tr("Choose photo", "फ़ोटो चुनें")} onClick={() => ref.current?.click()} isLoading={busy} />
        {value && onRemove && <Button size="sm" variant="ghost" label={tr("Remove", "हटाएँ")} icon={<Icon icon={Trash2} />} onClick={onRemove} />}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/** Product photo, or a line icon on a soft tile when there is no photo (or the store's image fails). */
export function ItemThumb({ imageUrl, icon, className, iconClassName }: { imageUrl?: string | null; icon?: string | null; className?: string; iconClassName?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative grid place-items-center overflow-hidden rounded-xl bg-brand-soft text-accent", className)}>
      <GiftIcon name={icon} className={cn("size-[42%] min-h-5 min-w-5", iconClassName)} />
      {imageUrl && !failed && (
        <img src={imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="absolute inset-0 size-full bg-white object-contain p-1.5" />
      )}
    </div>
  );
}
