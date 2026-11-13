"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { addCashEntry } from "@/app/actions/shagun";
import { useTr } from "@/components/lang";
import { Button } from "@/components/ui/button";
import { Field, toast } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { errorText } from "@/lib/result";
import { SHAGUN_AMOUNTS, inr } from "@/lib/utils";

const blank = { name: "", amount: "", place: "", phone: "", note: "", itemId: "" };

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
      const res = await addCashEntry(slug, { name: f.name, amount: Number(f.amount), place: f.place, phone: f.phone, note: f.note, itemId: f.itemId || null });
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      toast(tr(`Saved: ${f.name} — ${inr(Number(f.amount))}`, `दर्ज हुआ: ${f.name} — ${inr(Number(f.amount))}`));
      setCount((c) => c + 1);
      setF({ ...blank, itemId: f.itemId }); // stay open: at the counter, entries come one after another
      router.refresh();
    });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <NotebookPen className="size-5" /> {tr("Add cash entry", "नकद एंट्री जोड़ें")}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={tr("Cash / envelope entry", "नकद / लिफ़ाफ़ा एंट्री")}
        description={tr("Note down shagun received in person — just like the chandlo notebook.", "हाथ में मिला शगुन यहाँ लिखें — बिल्कुल चांदलो की कॉपी की तरह।")}
      >
        <form
          className="space-y-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label={tr("Name", "नाम")}>
            <input className="input" value={f.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder={tr("Sharma ji (Mama ji)", "शर्मा जी (मामा जी)")} autoFocus />
          </Field>
          <Field label={tr("Amount", "राशि")}>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted">₹</span>
              <input className="input pl-9 text-xl font-semibold" inputMode="numeric" value={f.amount} onChange={(e) => set({ amount: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="1101" />
            </div>
            <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1">
              {SHAGUN_AMOUNTS.map((a) => (
                <button key={a} type="button" className="chip h-10" aria-pressed={f.amount === String(a)} onClick={() => set({ amount: String(a) })}>
                  {inr(a)}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tr("Village / city", "गाँव / शहर")} optional>
              <input className="input" value={f.place} maxLength={60} onChange={(e) => set({ place: e.target.value })} placeholder={tr("Udaipur", "उदयपुर")} />
            </Field>
            <Field label={tr("Mobile", "मोबाइल")} optional>
              <input className="input" type="tel" inputMode="numeric" value={f.phone} maxLength={14} onChange={(e) => set({ phone: e.target.value })} placeholder="98765 43210" />
            </Field>
          </div>
          {funds.length > 0 && (
            <Field label={tr("Towards", "किसके लिए")} optional>
              <select className="input" value={f.itemId} onChange={(e) => set({ itemId: e.target.value })}>
                <option value="">{tr("General shagun", "सामान्य शगुन")}</option>
                {funds.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Button type="submit" size="lg" block loading={pending} disabled={!f.name.trim() || !Number(f.amount)}>
            {tr("Save & add next", "सेव करें और अगली जोड़ें")}
          </Button>
          {count > 0 && <p className="text-center text-[15px] font-semibold text-leaf">{tr(`${count} entr${count > 1 ? "ies" : "y"} saved`, `${count} एंट्री दर्ज हुईं`)}</p>}
        </form>
      </Sheet>
    </>
  );
}
