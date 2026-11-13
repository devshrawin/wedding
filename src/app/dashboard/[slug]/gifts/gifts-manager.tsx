"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Link2, Pencil, Plus, Sparkles, Wallet } from "lucide-react";
import { addFromCatalog, addItem, deleteItem, previewLink, updateItem, type ItemInput } from "@/app/actions/items";
import { EssentialsPicker, FundPicker } from "@/components/catalog-picker";
import { ItemThumb } from "@/components/item-thumb";
import { useLang, useTr } from "@/components/lang";
import { Button } from "@/components/ui/button";
import { Field, Progress, Switch, toast } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/catalog";
import { errorText } from "@/lib/result";
import { cn, inr } from "@/lib/utils";

export type ManagedItem = {
  id: string;
  kind: "product" | "fund";
  title: string;
  description: string | null;
  imageUrl: string | null;
  emoji: string | null;
  url: string | null;
  store: string | null;
  category: string;
  price: number | null;
  quantity: number;
  allowChipIn: boolean;
  hidden: boolean;
  reservedQty: number;
  raised: number;
  target: number | null;
  progress: number;
  fulfilled: boolean;
  givers: number;
};

type Draft = {
  kind: "product" | "fund";
  title: string;
  description: string;
  imageUrl: string;
  emoji: string;
  url: string;
  store: string;
  category: string;
  price: string;
  quantity: number;
  allowChipIn: boolean;
  hidden: boolean;
};

const emptyDraft = (kind: "product" | "fund"): Draft => ({
  kind,
  title: "",
  description: "",
  imageUrl: "",
  emoji: kind === "fund" ? "💝" : "",
  url: "",
  store: "",
  category: kind === "fund" ? "fund" : "other",
  price: "",
  quantity: 1,
  allowChipIn: false,
  hidden: false,
});

const toInput = (d: Draft): ItemInput => ({
  kind: d.kind,
  title: d.title,
  description: d.description,
  imageUrl: d.imageUrl,
  emoji: d.emoji,
  url: d.url,
  store: d.store,
  category: d.category,
  price: d.price ? Math.round(Number(d.price)) : null,
  quantity: d.quantity,
  allowChipIn: d.allowChipIn,
  hidden: d.hidden,
});

const fromItem = (i: ManagedItem): Draft => ({
  kind: i.kind,
  title: i.title,
  description: i.description ?? "",
  imageUrl: i.imageUrl ?? "",
  emoji: i.emoji ?? "",
  url: i.url ?? "",
  store: i.store ?? "",
  category: i.category,
  price: i.price ? String(i.price) : "",
  quantity: i.quantity,
  allowChipIn: i.allowChipIn,
  hidden: i.hidden,
});

type Mode = null | "menu" | "link" | "essentials" | "fund" | { edit: ManagedItem };

export function GiftsManager({ slug, items, openAdd }: { slug: string; items: ManagedItem[]; openAdd: boolean }) {
  const tr = useTr();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(openAdd ? "menu" : null);
  const close = () => setMode(null);
  const done = (msg: string) => {
    toast(msg);
    close();
    router.refresh();
  };

  const funds = items.filter((i) => i.kind === "fund");
  const products = items.filter((i) => i.kind === "product");

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{tr("Your wishlist", "आपकी सूची")}</h1>
        <Button onClick={() => setMode("menu")}>
          <Plus className="size-5" /> {tr("Add", "जोड़ें")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-5xl" aria-hidden>🎁</p>
          <h2 className="mt-3 text-2xl font-semibold">{tr("Nothing here yet", "अभी यहाँ कुछ नहीं है")}</h2>
          <p className="mt-1 text-muted">{tr("Add gifts you'd love, or a fund for shagun.", "अपनी पसंद के तोहफ़े जोड़ें, या शगुन के लिए फंड बनाएँ।")}</p>
          <Button className="mt-5" onClick={() => setMode("menu")}>
            <Plus className="size-5" /> {tr("Add your first wish", "पहली पसंद जोड़ें")}
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {[
            { title: tr("Shagun & funds", "शगुन और फंड"), list: funds },
            { title: tr("Gifts", "तोहफ़े"), list: products },
          ]
            .filter((g) => g.list.length)
            .map((g) => (
              <section key={g.title}>
                <h2 className="mb-3 font-sans text-[15px] font-bold uppercase tracking-wider text-muted">
                  {g.title} · {g.list.length}
                </h2>
                <ul className="space-y-2.5">
                  {g.list.map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => setMode({ edit: i })} className={cn("card flex w-full items-center gap-3 p-3 text-left hover:bg-sand/40", i.hidden && "opacity-60")}>
                        <ItemThumb imageUrl={i.imageUrl} emoji={i.emoji} className="size-16 shrink-0 text-[15px]" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-semibold leading-snug">{i.title}</p>
                          <ItemStatus item={i} />
                        </div>
                        <Pencil className="size-4 shrink-0 text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      {/* Add menu */}
      <Sheet open={mode === "menu"} onOpenChange={(o) => !o && close()} title={tr("Add to your wishlist", "सूची में जोड़ें")}>
        <div className="space-y-2.5 pb-2">
          {[
            { m: "link" as const, icon: Link2, t: tr("Paste a product link", "प्रोडक्ट का लिंक डालें"), d: tr("Amazon, Flipkart, Myntra, Pepperfry, Croma…", "Amazon, Flipkart, Myntra, Pepperfry, Croma…") },
            { m: "essentials" as const, icon: Sparkles, t: tr("Pick from wedding essentials", "शादी के ज़रूरी सामान से चुनें"), d: tr("Mixer, cooker, bedsheets, pooja thali and more.", "मिक्सर, कुकर, बेडशीट, पूजा थाली और बहुत कुछ।") },
            { m: "fund" as const, icon: Wallet, t: tr("Create a shagun fund", "शगुन फंड बनाएँ"), d: tr("Honeymoon, new home, fridge — guests give any amount.", "हनीमून, नया घर, फ्रिज — मेहमान कोई भी राशि दें।") },
          ].map((o) => (
            <button key={o.m} type="button" onClick={() => setMode(o.m)} className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left hover:border-primary">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <o.icon className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold leading-tight">{o.t}</span>
                <span className="block text-[15px] text-muted">{o.d}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      {mode === "link" && <LinkSheet slug={slug} onClose={close} onDone={() => done(tr("Added to your wishlist", "सूची में जुड़ गया"))} />}
      {mode === "essentials" && <EssentialsSheet slug={slug} onClose={close} onDone={(n) => done(tr(`${n} added`, `${n} चीज़ें जुड़ गईं`))} />}
      {mode === "fund" && <FundSheet slug={slug} onClose={close} onDone={(m) => done(m)} />}
      {mode && typeof mode === "object" && (
        <EditSheet slug={slug} item={mode.edit} onClose={close} onDone={(m) => done(m)} />
      )}
    </div>
  );
}

function ItemStatus({ item: i }: { item: ManagedItem }) {
  const tr = useTr();
  if (i.hidden)
    return (
      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[15px] text-muted">
        <EyeOff className="size-4" /> {tr("Hidden from guests", "मेहमानों से छिपा है")}
      </p>
    );
  if (i.kind === "fund" || i.raised > 0)
    return (
      <div className="mt-1.5">
        {i.target ? <Progress value={i.progress} className="h-2" /> : null}
        <p className="mt-1 text-[15px] text-muted">
          {tr("Received", "मिला")} <span className="font-semibold text-ink">{inr(i.raised) || "₹0"}</span>
          {i.target ? ` / ${inr(i.target)}` : ""}
        </p>
      </div>
    );
  return (
    <p className="mt-0.5 text-[15px] text-muted">
      {i.price ? inr(i.price) : tr("No price", "दाम नहीं")}
      {i.store && ` · ${i.store}`}
      {i.quantity > 1 && ` · ×${i.quantity}`}
      {i.reservedQty > 0 && (
        <span className="ml-2 rounded-full bg-leaf-soft px-2 py-0.5 text-[13px] font-bold text-leaf">
          {i.fulfilled ? tr("Reserved ✓", "चुन लिया गया ✓") : tr(`${i.reservedQty} reserved`, `${i.reservedQty} चुने गए`)}
        </span>
      )}
    </p>
  );
}

// ── Item form (shared by add + edit) ──────────────────────────────────

function ItemForm({ draft, set, locked }: { draft: Draft; set: (p: Partial<Draft>) => void; locked?: boolean }) {
  const tr = useTr();
  const lang = useLang();
  const fund = draft.kind === "fund";
  return (
    <div className="space-y-4">
      {!fund && (draft.imageUrl || draft.emoji) && (
        <div className="flex items-center gap-3">
          <ItemThumb key={draft.imageUrl} imageUrl={draft.imageUrl} emoji={draft.emoji} className="size-20 shrink-0" />
          {draft.store && <p className="text-[15px] text-muted">{tr("From", "स्टोर:")} <span className="font-semibold text-ink">{draft.store}</span></p>}
        </div>
      )}
      {fund && (
        <div>
          <span className="label">{tr("Icon", "आइकन")}</span>
          <div className="flex flex-wrap gap-2">
            {["💝", "✈️", "🏡", "🧊", "🛋️", "🪙", "🙏", "🚗", "📚", "🎶"].map((e) => (
              <button key={e} type="button" aria-pressed={draft.emoji === e} onClick={() => set({ emoji: e })} className={cn("grid size-12 place-items-center rounded-2xl border-2 bg-white text-2xl", draft.emoji === e ? "border-primary" : "border-line")}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
      <Field label={fund ? tr("Fund name", "फंड का नाम") : tr("Gift name", "तोहफ़े का नाम")}>
        <input className="input" value={draft.title} maxLength={140} onChange={(e) => set({ title: e.target.value })} placeholder={fund ? tr("Honeymoon Fund", "हनीमून फंड") : tr("Prestige Mixer Grinder 750W", "प्रेस्टीज मिक्सर ग्राइंडर 750W")} />
      </Field>
      <div className={cn("grid gap-3", !fund && "grid-cols-[1fr_7rem]")}>
        <Field
          label={fund ? tr("Goal amount", "लक्ष्य राशि") : tr("Price", "दाम")}
          optional={fund}
          hint={fund ? tr("Leave empty for an open shagun fund.", "खुले शगुन फंड के लिए खाली छोड़ दें।") : undefined}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted">₹</span>
            <input className="input pl-9" inputMode="numeric" value={draft.price} onChange={(e) => set({ price: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="0" />
          </div>
        </Field>
        {!fund && (
          <Field label={tr("Quantity", "संख्या")}>
            <select className="input" value={draft.quantity} disabled={locked} onChange={(e) => set({ quantity: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {!fund && (
        <Field label={tr("Category", "श्रेणी")}>
          <select className="input" value={draft.category} onChange={(e) => set({ category: e.target.value })}>
            {CATEGORIES.filter((c) => c.key !== "fund").map((c) => (
              <option key={c.key} value={c.key}>
                {c.emoji} {lang === "hi" ? c.hi : c.en}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={fund ? tr("Why this fund?", "यह फंड क्यों?") : tr("Note for guests", "मेहमानों के लिए नोट")} optional>
        <textarea className="input" rows={2} maxLength={300} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder={fund ? tr("Help us make memories on our first trip together.", "हमारी पहली यात्रा को यादगार बनाने में साथ दें।") : tr("Any colour is fine. We love the steel finish!", "कोई भी रंग चलेगा। स्टील फ़िनिश हमें पसंद है!")} />
      </Field>
      <div className="rounded-2xl border border-line bg-white px-4 py-1">
        {!fund && draft.quantity === 1 && (
          <Switch
            checked={draft.allowChipIn && !!draft.price}
            disabled={!draft.price}
            onChange={(v) => set({ allowChipIn: v })}
            label={tr("Let guests chip in", "मेहमान मिलकर दें")}
            hint={tr("For big gifts — several guests can contribute any amount by UPI.", "बड़े तोहफ़ों के लिए — कई मेहमान UPI से थोड़ा-थोड़ा दे सकते हैं।")}
          />
        )}
        <Switch
          checked={draft.hidden}
          onChange={(v) => set({ hidden: v })}
          label={tr("Hide from guests", "मेहमानों से छिपाएँ")}
          hint={tr("Keep it on your list, but don't show it on the guest page.", "सूची में रहे, पर मेहमानों वाले पेज पर न दिखे।")}
        />
      </div>
    </div>
  );
}

function useSave() {
  const tr = useTr();
  const [pending, start] = useTransition();
  const save = (fn: () => Promise<{ ok: boolean; error?: Parameters<typeof errorText>[0] }>, onOk: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(errorText(res.error ?? "server", tr), "error");
      else onOk();
    });
  return { pending, save };
}

// ── Paste link ────────────────────────────────────────────────────────

function LinkSheet({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const tr = useTr();
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [partial, setPartial] = useState(false);
  const [fetching, startFetch] = useTransition();
  const { pending, save } = useSave();

  const fetchIt = (value = url) => {
    if (!value.trim()) return;
    startFetch(async () => {
      const res = await previewLink(slug, value);
      if (!res.ok) {
        toast(res.error === "invalid" ? tr("That doesn't look like a product link.", "यह प्रोडक्ट का लिंक नहीं लग रहा।") : errorText(res.error, tr), "error");
        return;
      }
      const p = res.preview;
      setPartial(!p.fetched || !p.price);
      setDraft({ ...emptyDraft("product"), title: p.title ?? "", imageUrl: p.image ?? "", url: p.url, store: p.store, price: p.price ? String(p.price) : "", emoji: "🎁" });
    });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Paste a product link", "प्रोडक्ट का लिंक डालें")} description={draft ? undefined : tr("Open the product in any shopping app → Share → Copy link → paste here.", "किसी भी शॉपिंग ऐप में प्रोडक्ट खोलें → शेयर → लिंक कॉपी करें → यहाँ डालें।")}>
      {!draft ? (
        <form
          className="space-y-3 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            fetchIt();
          }}
        >
          <input
            className="input"
            type="text"
            inputMode="url"
            autoFocus
            placeholder="https://www.amazon.in/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (/https?:\/\//.test(text)) {
                e.preventDefault();
                setUrl(text);
                fetchIt(text);
              }
            }}
          />
          <Button type="submit" size="lg" block loading={fetching} disabled={!url.trim()}>
            {fetching ? tr("Fetching details…", "जानकारी ला रहे हैं…") : tr("Fetch details", "जानकारी लाएँ")}
          </Button>
          <button type="button" className="h-11 w-full text-[15px] font-semibold text-primary underline" onClick={() => setDraft({ ...emptyDraft("product"), emoji: "🎁" })}>
            {tr("No link? Add a gift by hand", "लिंक नहीं है? ख़ुद लिखकर जोड़ें")}
          </button>
        </form>
      ) : (
        <div className="pb-2">
          {partial && draft.url && (
            <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-[15px] text-amber-900">
              {tr("This store didn't share everything. Please check the name and price.", "इस स्टोर से पूरी जानकारी नहीं मिली। कृपया नाम और दाम जाँच लें।")}
            </p>
          )}
          <ItemForm draft={draft} set={(p) => setDraft((d) => (d ? { ...d, ...p } : d))} />
          <Button size="lg" block className="mt-5" loading={pending} disabled={!draft.title.trim() || !draft.price} onClick={() => save(() => addItem(slug, toInput(draft)), onDone)}>
            {tr("Add to wishlist", "सूची में जोड़ें")}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

// ── Essentials ────────────────────────────────────────────────────────

function EssentialsSheet({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: (n: number) => void }) {
  const tr = useTr();
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, save } = useSave();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Wedding essentials", "शादी का ज़रूरी सामान")} description={tr("Tap everything you'd like.", "जो-जो चाहिए, उस पर टैप करें।")}>
      <EssentialsPicker selected={selected} onChange={setSelected} />
      <div className="sticky bottom-0 -mx-5 mt-4 border-t border-line bg-cream px-5 py-3">
        <Button size="lg" block loading={pending} disabled={!selected.length} onClick={() => save(() => addFromCatalog(slug, selected, []), () => onDone(selected.length))}>
          {selected.length ? tr(`Add ${selected.length} to wishlist`, `${selected.length} चीज़ें सूची में जोड़ें`) : tr("Select items", "चीज़ें चुनें")}
        </Button>
      </div>
    </Sheet>
  );
}

// ── Fund ──────────────────────────────────────────────────────────────

function FundSheet({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: (msg: string) => void }) {
  const tr = useTr();
  const [custom, setCustom] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, save } = useSave();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Shagun funds", "शगुन फंड")} description={tr("Guests give any amount by UPI. We suggest ₹501, ₹1,101, ₹2,101…", "मेहमान UPI से कोई भी राशि दें। हम ₹501, ₹1,101, ₹2,101… सुझाते हैं।")}>
      {custom ? (
        <div className="pb-2">
          <ItemForm draft={custom} set={(p) => setCustom((d) => (d ? { ...d, ...p } : d))} />
          <Button size="lg" block className="mt-5" loading={pending} disabled={!custom.title.trim()} onClick={() => save(() => addItem(slug, toInput(custom)), () => onDone(tr("Fund created", "फंड बन गया")))}>
            {tr("Create fund", "फंड बनाएँ")}
          </Button>
        </div>
      ) : (
        <div className="pb-2">
          <FundPicker selected={selected} onChange={setSelected} />
          <button type="button" className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-[16px] font-semibold text-primary" onClick={() => setCustom(emptyDraft("fund"))}>
            <Plus className="size-5" /> {tr("Create your own fund", "अपना फंड बनाएँ")}
          </button>
          <Button size="lg" block className="mt-4" loading={pending} disabled={!selected.length} onClick={() => save(() => addFromCatalog(slug, [], selected), () => onDone(tr("Funds added", "फंड जुड़ गए")))}>
            {selected.length ? tr(`Add ${selected.length} fund${selected.length > 1 ? "s" : ""}`, `${selected.length} फंड जोड़ें`) : tr("Select a fund", "फंड चुनें")}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

// ── Edit ──────────────────────────────────────────────────────────────

function EditSheet({ slug, item, onClose, onDone }: { slug: string; item: ManagedItem; onClose: () => void; onDone: (msg: string) => void }) {
  const tr = useTr();
  const [draft, setDraft] = useState<Draft>(() => fromItem(item));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { pending, save } = useSave();
  const hasActivity = item.givers > 0;
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={item.kind === "fund" ? tr("Edit fund", "फंड बदलें") : tr("Edit gift", "तोहफ़ा बदलें")}>
      <div className="pb-2">
        <ItemForm draft={draft} set={(p) => setDraft((d) => ({ ...d, ...p }))} locked={item.reservedQty > 0} />
        <Button size="lg" block className="mt-5" loading={pending} disabled={!draft.title.trim() || (draft.kind === "product" && !draft.price)} onClick={() => save(() => updateItem(slug, item.id, toInput(draft)), () => onDone(tr("Saved", "सेव हो गया")))}>
          {tr("Save changes", "बदलाव सेव करें")}
        </Button>
        {confirmDelete ? (
          <div className="mt-3 rounded-2xl bg-red-50 p-4">
            <p className="text-[15px] font-semibold text-red-800">
              {hasActivity
                ? tr("Guests have already given towards this. Their entries stay in your ledger, but the gift will be removed.", "मेहमान इसके लिए दे चुके हैं। उनकी एंट्री बही में रहेगी, पर तोहफ़ा हट जाएगा।")
                : tr("Remove this from your wishlist?", "इसे सूची से हटाएँ?")}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" block loading={pending} onClick={() => save(() => deleteItem(slug, item.id), () => onDone(tr("Removed", "हटा दिया गया")))}>
                {tr("Yes, remove", "हाँ, हटाएँ")}
              </Button>
              <Button variant="outline" block onClick={() => setConfirmDelete(false)}>
                {tr("Keep", "रहने दें")}
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" className="mt-2 h-12 w-full text-[15px] font-semibold text-red-700" onClick={() => setConfirmDelete(true)}>
            {tr("Remove from wishlist", "सूची से हटाएँ")}
          </button>
        )}
      </div>
    </Sheet>
  );
}
