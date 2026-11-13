"use client";

import { Check } from "lucide-react";
import { useLang, useTr } from "@/components/lang";
import { CATALOG, CATEGORIES, FUND_TEMPLATES } from "@/lib/catalog";
import { cn, inr } from "@/lib/utils";

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function FundPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const lang = useLang();
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {FUND_TEMPLATES.map((f) => {
        const on = selected.includes(f.id);
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle(selected, f.id))}
            className={cn("flex min-h-16 items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition-colors", on ? "border-primary bg-primary-soft/50" : "border-line")}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-2xl">{f.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-tight">{lang === "hi" ? f.hi : f.en}</span>
              <span className="block truncate text-sm text-muted">{lang === "hi" ? f.descHi : f.descEn}</span>
            </span>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2", on ? "border-primary bg-primary text-white" : "border-line")}>
              {on && <Check className="size-4" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function EssentialsPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const lang = useLang();
  const tr = useTr();
  return (
    <div className="space-y-6">
      {CATEGORIES.filter((c) => CATALOG.some((i) => i.category === c.key)).map((cat) => (
        <section key={cat.key}>
          <h3 className="mb-2.5 font-sans text-[15px] font-bold uppercase tracking-wider text-muted">
            {cat.emoji} {lang === "hi" ? cat.hi : cat.en}
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {CATALOG.filter((i) => i.category === cat.key).map((i) => {
              const on = selected.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(toggle(selected, i.id))}
                  className={cn("relative flex min-h-28 flex-col items-start rounded-2xl border-2 bg-white p-3 text-left transition-colors", on ? "border-primary bg-primary-soft/50" : "border-line")}
                >
                  <span className="text-3xl" aria-hidden>{i.emoji}</span>
                  <span className="mt-1.5 text-[15px] font-semibold leading-tight">{lang === "hi" ? i.hi : i.en}</span>
                  <span className="mt-auto pt-1 text-sm text-muted">~{inr(i.price)}</span>
                  <span className={cn("absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full border-2", on ? "border-primary bg-primary text-white" : "border-line")}>
                    {on && <Check className="size-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-sm text-muted">{tr("Prices are typical estimates — you can edit them anytime.", "दाम अनुमानित हैं — आप कभी भी बदल सकते हैं।")}</p>
    </div>
  );
}
