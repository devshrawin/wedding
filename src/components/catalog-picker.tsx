"use client";

import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Text } from "@astryxdesign/core/Text";
import { useLang, useTr } from "@/components/lang";
import { CATALOG, CATEGORIES, FUND_TEMPLATES } from "@/lib/catalog";
import { inr } from "@/lib/utils";

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function FundPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const lang = useLang();
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {FUND_TEMPLATES.map((f) => {
        const title = lang === "hi" ? f.hi : f.en;
        return (
          <SelectableCard key={f.id} label={title} isSelected={selected.includes(f.id)} onChange={() => onChange(toggle(selected, f.id))} padding={3}>
            <div className="flex items-center gap-3 pr-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-2xl" aria-hidden>
                {f.emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-tight text-primary">{title}</span>
                <Text type="supporting" maxLines={1}>
                  {lang === "hi" ? f.descHi : f.descEn}
                </Text>
              </span>
            </div>
          </SelectableCard>
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
          <h3 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-secondary">
            <span aria-hidden>{cat.emoji}</span> {lang === "hi" ? cat.hi : cat.en}
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {CATALOG.filter((i) => i.category === cat.key).map((i) => {
              const title = lang === "hi" ? i.hi : i.en;
              return (
                <SelectableCard key={i.id} label={title} isSelected={selected.includes(i.id)} onChange={() => onChange(toggle(selected, i.id))} padding={3} height="100%">
                  <div className="flex h-full flex-col pr-5">
                    <span className="text-3xl" aria-hidden>
                      {i.emoji}
                    </span>
                    <span className="mt-1.5 text-[15px] font-semibold leading-tight text-primary">{title}</span>
                    <span className="mt-auto pt-1 text-sm text-secondary">~{inr(i.price)}</span>
                  </div>
                </SelectableCard>
              );
            })}
          </div>
        </section>
      ))}
      <Text as="p" type="supporting" display="block">
        {tr("Prices are typical estimates. You can edit them anytime.", "दाम अनुमानित हैं, आप कभी भी बदल सकते हैं।")}
      </Text>
    </div>
  );
}
