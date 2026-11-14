"use client";

import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Text } from "@astryxdesign/core/Text";
import { GiftIcon } from "@/components/icons";
import { useLang, useTr } from "@/components/lang";
import { CATEGORIES, FUND_TEMPLATES, catalogFor, fundTitle } from "@/lib/catalog";
import { inr } from "@/lib/utils";

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function IconTile({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-brand-soft text-accent ${size === "lg" ? "size-12" : "size-11"}`}>
      <GiftIcon name={name} className="size-6" />
    </span>
  );
}

export function FundPicker({ selected, onChange, giftWord = null }: { selected: string[]; onChange: (ids: string[]) => void; giftWord?: string | null }) {
  const lang = useLang();
  return (
    <div className="stagger grid gap-2.5 sm:grid-cols-2">
      {FUND_TEMPLATES.map((f, n) => {
        const title = fundTitle(f, lang, giftWord);
        return (
          <div key={f.id} className="min-w-0" style={{ "--i": n } as React.CSSProperties}><SelectableCard label={title} isSelected={selected.includes(f.id)} onChange={() => onChange(toggle(selected, f.id))} padding={3}>
            <div className="flex items-center gap-3 pr-6">
              <IconTile name={f.icon} />
              <span className="min-w-0">
                <span className="block font-semibold leading-tight text-primary">{title}</span>
                <Text type="supporting" maxLines={1}>
                  {lang === "hi" ? f.descHi : f.descEn}
                </Text>
              </span>
            </div>
          </SelectableCard></div>
        );
      })}
    </div>
  );
}

/** Everyday essentials; faith items appear only for the chosen ceremony style. */
export function EssentialsPicker({ selected, onChange, tradition = "none" }: { selected: string[]; onChange: (ids: string[]) => void; tradition?: string }) {
  const lang = useLang();
  const tr = useTr();
  const items = catalogFor(tradition);
  return (
    <div className="space-y-6">
      {CATEGORIES.filter((c) => items.some((i) => i.category === c.key)).map((cat) => (
        <section key={cat.key}>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-secondary">
            <GiftIcon name={cat.icon} className="size-4" /> {lang === "hi" ? cat.hi : cat.en}
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {items
              .filter((i) => i.category === cat.key)
              .map((i) => {
                const title = lang === "hi" ? i.hi : i.en;
                return (
                  <SelectableCard key={i.id} label={title} isSelected={selected.includes(i.id)} onChange={() => onChange(toggle(selected, i.id))} padding={3} height="100%">
                    <div className="flex h-full flex-col pr-5">
                      <IconTile name={i.icon} />
                      <span className="mt-2 text-[15px] font-semibold leading-tight text-primary">{title}</span>
                      <span className="mt-auto pt-1 text-sm text-secondary">~{inr(i.price)}</span>
                    </div>
                  </SelectableCard>
                );
              })}
          </div>
        </section>
      ))}
      <Text as="p" type="supporting" display="block">
        {tr("Prices are typical estimates. You can edit them, or add anything else from the wishlist later.", "दाम अनुमानित हैं। आप इन्हें बदल सकते हैं, या बाद में सूची से कुछ भी और जोड़ सकते हैं।")}
      </Text>
    </div>
  );
}
