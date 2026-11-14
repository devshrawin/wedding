"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { NotebookPen } from "lucide-react";
import { addCashEntry } from "@/app/actions/received";
import { useTr } from "@/components/lang";
import { toast } from "@/components/ui/feedback";
import { AmountChips } from "@/components/ui/kit";
import { Sheet } from "@/components/ui/sheet";
import { errorText } from "@/lib/result";
import { SHAGUN_AMOUNTS, inr } from "@/lib/utils";

const blank = { name: "", amount: "", place: "", phone: "", itemId: "" };

/** The chandlo notebook, digitised: jot down envelopes received at the venue. */
export function CashEntryButton({ slug, funds }: { slug: string; funds: { id: string; title: string }[] }) {
  const tr = useTr();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [count, setCount] = useState(0);
  const [pending, start] = useTransition();
  const set = (p: Partial<typeof blank>) => setF((x) => ({ ...x, ...p }));

  const save = () =>
    start(async () => {
      const res = await addCashEntry(slug, { name: f.name, amount: Number(f.amount), place: f.place, phone: f.phone, itemId: f.itemId || null });
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      toast(tr(`Saved: ${f.name}, ${inr(Number(f.amount))}`, `दर्ज हुआ: ${f.name}, ${inr(Number(f.amount))}`));
      setCount((c) => c + 1);
      setF({ ...blank, itemId: f.itemId }); // stay open: at the counter, envelopes come one after another
      router.refresh();
    });

  return (
    <>
      <Button variant="primary" width="100%" label={tr("Add cash entry", "नकद एंट्री जोड़ें")} icon={<Icon icon={NotebookPen} />} onClick={() => setOpen(true)} />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        purpose="form"
        height="tall"
        title={tr("Cash / envelope entry", "नकद / लिफ़ाफ़ा एंट्री")}
        description={tr("Note down cash gifts received in person, just like the old notebook.", "हाथ में मिला उपहार यहाँ लिखें, बिल्कुल पुरानी कॉपी की तरह।")}
      >
        <form
          className="space-y-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <TextInput label={tr("Name", "नाम")} width="100%" size="lg" value={f.name} onChange={(v) => set({ name: v.slice(0, 60) })} placeholder={tr("Sharma ji (Mama ji)", "शर्मा जी (मामा जी)")} hasAutoFocus />
          <TextInput label={tr("Amount (₹)", "राशि (₹)")} width="100%" size="lg" inputMode="numeric" value={f.amount} onChange={(v) => set({ amount: v.replace(/\D/g, "").slice(0, 8) })} placeholder="1101" />
          <AmountChips amounts={SHAGUN_AMOUNTS.slice(0, 6)} value={Number(f.amount)} onChange={(n) => set({ amount: String(n) })} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label={tr("Village / city", "गाँव / शहर")} isOptional width="100%" value={f.place} onChange={(v) => set({ place: v.slice(0, 60) })} placeholder={tr("Udaipur", "उदयपुर")} />
            <TextInput label={tr("Mobile", "मोबाइल")} isOptional width="100%" type="tel" inputMode="numeric" value={f.phone} onChange={(v) => set({ phone: v.slice(0, 14) })} placeholder="98765 43210" />
          </div>
          {funds.length > 0 && (
            <Selector
              label={tr("Towards", "किसके लिए")}
              isOptional
              width="100%"
              value={f.itemId || "general"}
              options={[{ value: "general", label: tr("General gift", "सामान्य उपहार") }, ...funds.map((x) => ({ value: x.id, label: x.title }))]}
              onChange={(v) => set({ itemId: v === "general" ? "" : v })}
              presentation="adaptive"
            />
          )}
          <Button type="submit" variant="primary" size="lg" width="100%" isLoading={pending} isDisabled={!f.name.trim() || !Number(f.amount)} label={tr("Save & add next", "सेव करें और अगली जोड़ें")} />
          {count > 0 && <p className="text-center text-[15px] font-semibold text-leaf" role="status">{tr(`${count} entr${count > 1 ? "ies" : "y"} saved`, `${count} एंट्री दर्ज हुईं`)}</p>}
        </form>
      </Sheet>
    </>
  );
}
