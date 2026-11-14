"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Field } from "@astryxdesign/core/Field";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { EyeOff, Gift, Link2, PenLine, Plus, Sparkles, Wallet } from "lucide-react";
import { addFromCatalog, addItem, deleteItem, previewLink, updateItem, uploadItemImage, type ItemInput } from "@/app/actions/items";
import { EssentialsPicker, FundPicker } from "@/components/catalog-picker";
import { useLang, useTr } from "@/components/lang";
import { toast } from "@/components/ui/feedback";
import { ItemThumb, PhotoPicker } from "@/components/ui/kit";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORIES, CUSTOM_PREFIX } from "@/lib/catalog";
import { GiftIcon, PICKER_ICONS, iconLabel } from "@/components/icons";
import { errorText, type ErrorCode } from "@/lib/result";
import { cn, inr } from "@/lib/utils";

export type ManagedItem = {
  id: string;
  kind: "product" | "fund";
  title: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
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
  chipInLeft: number | null;
};

type Draft = {
  kind: "product" | "fund";
  title: string;
  description: string;
  imageUrl: string;
  icon: string;
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
  icon: kind === "fund" ? "blessing" : "gift",
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
  icon: d.icon,
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
  icon: i.icon ?? "",
  url: i.url ?? "",
  store: i.store ?? "",
  category: i.category,
  price: i.price ? String(i.price) : "",
  quantity: i.quantity,
  allowChipIn: i.allowChipIn,
  hidden: i.hidden,
});

type Mode = null | "menu" | "link" | "manual" | "essentials" | "fund" | { edit: ManagedItem };

/** Registry-wide context the add/edit sheets need. */
const RegistryCtx = createContext<{ sections: string[]; tradition: string; giftWord: string | null }>({ sections: [], tradition: "none", giftWord: null });

export function GiftsManager({ slug, items, openAdd, tradition, giftWord }: { slug: string; items: ManagedItem[]; openAdd: boolean; tradition: string; giftWord: string | null }) {
  const sections = [...new Set(items.map((i) => i.category).filter((c) => c.startsWith(CUSTOM_PREFIX)))];
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
    <RegistryCtx.Provider value={{ sections, tradition, giftWord }}>
    <div>
      <div className="flex items-center justify-between gap-3">
        <Heading level={1}>{tr("Your wishlist", "आपकी सूची")}</Heading>
        <Button variant="primary" label={tr("Add", "जोड़ें")} icon={<Icon icon={Plus} />} onClick={() => setMode("menu")} />
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <Card padding={6}>
            <EmptyState
              title={tr("Nothing here yet", "अभी यहाँ कुछ नहीं है")}
              description={tr("Add gifts you'd love, or a cash fund.", "अपनी पसंद के तोहफ़े जोड़ें, या नकद फंड बनाएँ।")}
              icon={<Gift className="size-10 text-accent" />}
              actions={<Button variant="primary" label={tr("Add your first wish", "पहली पसंद जोड़ें")} onClick={() => setMode("menu")} />}
            />
          </Card>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {[
            { title: tr("Cash funds", "नकद फंड"), list: funds },
            { title: tr("Gifts", "तोहफ़े"), list: products },
          ]
            .filter((g) => g.list.length)
            .map((g) => (
              <section key={g.title}>
                <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-secondary">
                  {g.title} · {g.list.length}
                </h2>
                <ul className="space-y-2.5">
                  {g.list.map((i) => (
                    <li key={i.id}>
                      <ClickableCard label={tr(`Edit ${i.title}`, `${i.title} बदलें`)} onClick={() => setMode({ edit: i })} padding={3}>
                        <div className={cn("flex items-center gap-3", i.hidden && "opacity-60")}>
                          <ItemThumb imageUrl={i.imageUrl} icon={i.icon} className="size-16 shrink-0 text-[15px]" />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 font-semibold leading-snug text-primary">{i.title}</p>
                            <ItemStatus item={i} />
                          </div>
                          <PenLine className="size-4 shrink-0 text-secondary" aria-hidden />
                        </div>
                      </ClickableCard>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      <Sheet open={mode === "menu"} onOpenChange={(o) => !o && close()} title={tr("Add to your wishlist", "सूची में जोड़ें")}>
        <div className="space-y-2.5 pb-2">
          {[
            { m: "link" as const, icon: Link2, t: tr("Paste a product link", "प्रोडक्ट का लिंक डालें"), d: tr("Amazon, Flipkart, Myntra, Pepperfry, Croma…", "Amazon, Flipkart, Myntra, Pepperfry, Croma…") },
            { m: "manual" as const, icon: PenLine, t: tr("Add a gift yourself", "ख़ुद तोहफ़ा लिखें"), d: tr("Name, price and your own photo, from any shop.", "नाम, दाम और अपनी फ़ोटो, किसी भी दुकान का।") },
            { m: "essentials" as const, icon: Sparkles, t: tr("Pick wedding essentials", "शादी का ज़रूरी सामान चुनें"), d: tr("Mixer, cooker, bedsheets, pooja thali and more.", "मिक्सर, कुकर, बेडशीट, पूजा थाली और बहुत कुछ।") },
            { m: "fund" as const, icon: Wallet, t: tr("Open a cash fund", "नकद फंड खोलें"), d: tr("Honeymoon, new home, fridge. Guests give any amount.", "हनीमून, नया घर, फ्रिज, मेहमान कोई भी राशि दें।") },
          ].map((o) => (
            <ClickableCard key={o.m} label={o.t} onClick={() => setMode(o.m)} padding={4}>
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-accent">
                  <o.icon className="size-6" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-semibold leading-tight text-primary">{o.t}</span>
                  <span className="block text-[15px] text-secondary">{o.d}</span>
                </span>
              </div>
            </ClickableCard>
          ))}
        </div>
      </Sheet>

      {mode === "link" && <LinkSheet slug={slug} onClose={close} onDone={() => done(tr("Added to your wishlist", "सूची में जुड़ गया"))} />}
      {mode === "manual" && <ManualSheet slug={slug} onClose={close} onDone={() => done(tr("Added to your wishlist", "सूची में जुड़ गया"))} />}
      {mode === "essentials" && <EssentialsSheet slug={slug} onClose={close} onDone={(n) => done(tr(`${n} added`, `${n} चीज़ें जुड़ गईं`))} />}
      {mode === "fund" && <FundSheet slug={slug} onClose={close} onDone={done} />}
      {mode && typeof mode === "object" && <EditSheet slug={slug} item={mode.edit} onClose={close} onDone={done} />}
    </div>
    </RegistryCtx.Provider>
  );
}

function ItemStatus({ item: i }: { item: ManagedItem }) {
  const tr = useTr();
  if (i.hidden)
    return (
      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[15px] text-secondary">
        <EyeOff className="size-4" aria-hidden /> {tr("Hidden from guests", "मेहमानों से छिपा है")}
      </p>
    );
  if (i.kind === "fund" || i.raised > 0 || i.allowChipIn)
    return (
      <div className="mt-1.5 space-y-1">
        {i.target ? <ProgressBar label={tr("Received", "मिला")} isLabelHidden value={i.progress} /> : null}
        <p className="text-[15px] text-secondary">
          {tr("Received", "मिला")} <span className="font-semibold text-primary">{inr(i.raised) || "₹0"}</span>
          {i.target ? ` / ${inr(i.target)}` : ""}
          {i.allowChipIn && !i.fulfilled && <> · {tr("guests chip in", "मेहमान मिलकर देंगे")}</>}
        </p>
      </div>
    );
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-secondary">
      <span>
        {i.price ? inr(i.price) : tr("No price", "दाम नहीं")}
        {i.store && ` · ${i.store}`}
        {i.quantity > 1 && ` · ×${i.quantity}`}
      </span>
      {i.reservedQty > 0 && <Badge variant="success" label={i.fulfilled ? tr("Reserved", "चुन लिया गया") : tr(`${i.reservedQty} reserved`, `${i.reservedQty} चुने गए`)} />}
    </div>
  );
}

// ── Icon + section pickers ────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const tr = useTr();
  return (
    <Field label={tr("Icon", "आइकन")} inputID="item-icon" isGroupLabel>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9" role="radiogroup" aria-label={tr("Icon", "आइकन")}>
        {PICKER_ICONS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={value === k}
            aria-label={iconLabel(k)}
            onClick={() => onChange(k)}
            className={cn(
              "grid aspect-square place-items-center rounded-xl border-2 bg-surface text-accent transition-colors",
              value === k ? "border-[var(--color-accent)] bg-brand-soft" : "border-border hover:border-[var(--color-border-emphasized)]",
            )}
          >
            <GiftIcon name={k} className="size-6" />
          </button>
        ))}
      </div>
    </Field>
  );
}

const NEW_SECTION = "__new__";

/** Built-in sections plus the couple's own ("c:Wall art"), with a way to make a new one. */
function SectionPicker({ value, sections, onChange }: { value: string; sections: string[]; onChange: (v: string) => void }) {
  const tr = useTr();
  const lang = useLang();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const own = [...new Set([...sections, value].filter((s) => s.startsWith(CUSTOM_PREFIX)))];
  const options = [
    ...CATEGORIES.filter((c) => c.key !== "fund").map((c) => ({ value: c.key, label: lang === "hi" ? c.hi : c.en })),
    ...own.map((k) => ({ value: k, label: k.slice(CUSTOM_PREFIX.length) })),
    { value: NEW_SECTION, label: tr("+ New section…", "+ नया हिस्सा…") },
  ];
  if (creating)
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextInput label={tr("New section name", "नए हिस्से का नाम")} width="100%" value={name} hasAutoFocus onChange={(v) => setName(v.slice(0, 40))} placeholder={tr("Wall art, Garden, Books…", "वॉल आर्ट, बगीचा, किताबें…")} />
        </div>
        <Button
          label={tr("Use", "चुनें")}
          isDisabled={!name.trim()}
          onClick={() => {
            onChange(CUSTOM_PREFIX + name.trim());
            setCreating(false);
          }}
        />
      </div>
    );
  return (
    <Selector
      label={tr("Section", "हिस्सा")}
      width="100%"
      value={value}
      options={options}
      onChange={(v) => (v === NEW_SECTION ? setCreating(true) : onChange(v))}
      presentation="adaptive"
    />
  );
}

// ── Item form (shared by add + edit) ──────────────────────────────────

function ItemForm({ slug, draft, set, locked }: { slug: string; draft: Draft; set: (p: Partial<Draft>) => void; locked?: boolean }) {
  const { sections } = useContext(RegistryCtx);
  const tr = useTr();
  const fund = draft.kind === "fund";
  const upload = async (dataUrl: string) => {
    const res = await uploadItemImage(slug, dataUrl);
    if (!res.ok) return toast(errorText(res.error, tr), "error");
    set({ imageUrl: res.path });
  };
  return (
    <div className="space-y-4">
      {!fund && (
        <Field label={tr("Photo", "फ़ोटो")} inputID="item-photo" isOptional description={draft.store ? tr(`From ${draft.store}`, `${draft.store} से`) : tr("No photo? We'll show the icon below.", "फ़ोटो नहीं है? नीचे वाला आइकन दिखेगा।")}>
          <PhotoPicker label={tr("Choose gift photo", "तोहफ़े की फ़ोटो चुनें")} value={draft.imageUrl || null} onPick={upload} onRemove={() => set({ imageUrl: "" })} />
        </Field>
      )}
      {(fund || !draft.imageUrl) && <IconPicker value={draft.icon} onChange={(icon) => set({ icon })} />}
      <TextInput
        label={fund ? tr("Fund name", "फंड का नाम") : tr("Gift name", "तोहफ़े का नाम")}
        width="100%"
        value={draft.title}
        onChange={(v) => set({ title: v.slice(0, 140) })}
        placeholder={fund ? tr("Honeymoon Fund", "हनीमून फंड") : tr("Prestige Mixer Grinder 750W", "प्रेस्टीज मिक्सर ग्राइंडर 750W")}
      />
      <div className={cn("grid gap-3", !fund && "grid-cols-[1fr_7.5rem]")}>
        <TextInput
          label={fund ? tr("Goal amount (₹)", "लक्ष्य राशि (₹)") : tr("Price (₹)", "दाम (₹)")}
          isOptional={fund}
          description={fund ? tr("Leave empty for an open fund with no goal.", "बिना लक्ष्य वाले खुले फंड के लिए खाली छोड़ दें।") : undefined}
          width="100%"
          inputMode="numeric"
          value={draft.price}
          onChange={(v) => set({ price: v.replace(/\D/g, "").slice(0, 8) })}
          placeholder="0"
        />
        {!fund && (
          <Selector
            label={tr("How many", "कितने")}
            width="100%"
            value={String(draft.quantity)}
            isDisabled={locked}
            disabledMessage={tr("Already reserved by a guest", "मेहमान चुन चुके हैं")}
            options={[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => ({ value: String(n), label: String(n) }))}
            onChange={(v) => set({ quantity: Number(v) })}
            presentation="adaptive"
          />
        )}
      </div>
      {!fund && <SectionPicker value={draft.category} sections={sections} onChange={(category) => set({ category })} />}
      <TextArea
        label={fund ? tr("Why this fund?", "यह फंड क्यों?") : tr("Note for guests", "मेहमानों के लिए नोट")}
        isOptional
        width="100%"
        rows={2}
        maxLength={300}
        value={draft.description}
        onChange={(v) => set({ description: v })}
        placeholder={fund ? tr("Help us make memories on our first trip together.", "हमारी पहली यात्रा को यादगार बनाने में साथ दें।") : tr("Any colour is fine. We love the steel finish!", "कोई भी रंग चलेगा। स्टील फ़िनिश हमें पसंद है!")}
      />
      <Card variant="muted" padding={4}>
        <div className="space-y-4">
          {!fund && draft.quantity === 1 && (
            <Switch
              label={tr("Let guests chip in", "मेहमान मिलकर दें")}
              description={tr("For big gifts, several guests pay part of it by UPI. Guests see how much is still needed.", "बड़े तोहफ़ों के लिए, कई मेहमान UPI से थोड़ा-थोड़ा दें। मेहमानों को दिखेगा कि कितना बाकी है।")}
              labelSpacing="spread"
              width="100%"
              value={draft.allowChipIn && !!draft.price}
              isDisabled={!draft.price}
              disabledMessage={tr("Add a price first", "पहले दाम डालें")}
              onChange={(v) => set({ allowChipIn: v })}
            />
          )}
          <Switch
            label={tr("Hide from guests", "मेहमानों से छिपाएँ")}
            description={tr("Keep it on your list, but don't show it on the guest page.", "सूची में रहे, पर मेहमानों वाले पेज पर न दिखे।")}
            labelSpacing="spread"
            width="100%"
            value={draft.hidden}
            onChange={(v) => set({ hidden: v })}
          />
        </div>
      </Card>
    </div>
  );
}

function useSave() {
  const tr = useTr();
  const [pending, start] = useTransition();
  const save = (fn: () => Promise<{ ok: boolean; error?: ErrorCode }>, onOk: () => void) =>
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
  const [partial, setPartial] = useState<"none" | "some" | "all">("none");
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
      setPartial(!p.fetched ? "all" : !p.price || !p.image ? "some" : "none");
      setDraft({ ...emptyDraft("product"), title: p.title ?? "", imageUrl: p.image ?? "", url: p.url, store: p.store, price: p.price ? String(p.price) : "" });
    });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Paste a product link", "प्रोडक्ट का लिंक डालें")} purpose="form" height={draft ? "tall" : "hug"}>
      {!draft ? (
        <form
          className="space-y-3 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            fetchIt();
          }}
        >
          <TextInput
            label={tr("Product link", "प्रोडक्ट लिंक")}
            description={tr("In the shopping app: Share → Copy link, then paste here.", "शॉपिंग ऐप में: शेयर → लिंक कॉपी करें, फिर यहाँ डालें।")}
            width="100%"
            size="lg"
            inputMode="url"
            autoCapitalize="none"
            hasAutoCorrect={false}
            hasAutoFocus
            placeholder="https://www.amazon.in/…"
            value={url}
            onChange={(v) => {
              setUrl(v);
              // Pasting a whole link fetches straight away.
              if (/^\s*\S*https?:\/\/\S+/.test(v) && v.length - url.length > 10) fetchIt(v);
            }}
            hasClear
          />
          <Button type="submit" variant="primary" size="lg" width="100%" isLoading={fetching} isDisabled={!url.trim()} label={fetching ? tr("Fetching details…", "जानकारी ला रहे हैं…") : tr("Fetch details", "जानकारी लाएँ")} />
        </form>
      ) : (
        <div className="space-y-4 pb-2">
          {partial !== "none" && (
            <Banner
              status={partial === "all" ? "warning" : "info"}
              collapsible={false}
              title={partial === "all" ? tr("The store didn't share the details", "स्टोर ने जानकारी नहीं दी") : tr("Some details are missing", "कुछ जानकारी नहीं मिली")}
              description={
                partial === "all"
                  ? tr("Shops like Amazon sometimes block this. We guessed the name from the link. Add the price, and a photo from your gallery if you like.", "Amazon जैसी दुकानें कभी-कभी रोक देती हैं। नाम लिंक से अंदाज़ा लगाया है, दाम डालें, और चाहें तो गैलरी से फ़ोटो लगाएँ।")
                  : tr("Please check the name and price, and add a photo if it's missing.", "कृपया नाम और दाम जाँचें, और फ़ोटो न हो तो लगा दें।")
              }
            />
          )}
          <ItemForm slug={slug} draft={draft} set={(p) => setDraft((d) => (d ? { ...d, ...p } : d))} />
          <Button variant="primary" size="lg" width="100%" isLoading={pending} isDisabled={!draft.title.trim() || !draft.price} label={tr("Add to wishlist", "सूची में जोड़ें")} onClick={() => save(() => addItem(slug, toInput(draft)), onDone)} />
        </div>
      )}
    </Sheet>
  );
}

function ManualSheet({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const tr = useTr();
  const [draft, setDraft] = useState<Draft>(emptyDraft("product"));
  const { pending, save } = useSave();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Add a gift yourself", "ख़ुद तोहफ़ा लिखें")} description={tr("Guests can buy it from any shop.", "मेहमान इसे किसी भी दुकान से ख़रीद सकते हैं।")} purpose="form" height="tall">
      <div className="space-y-4 pb-2">
        <ItemForm slug={slug} draft={draft} set={(p) => setDraft((d) => ({ ...d, ...p }))} />
        <Button variant="primary" size="lg" width="100%" isLoading={pending} isDisabled={!draft.title.trim() || !draft.price} label={tr("Add to wishlist", "सूची में जोड़ें")} onClick={() => save(() => addItem(slug, toInput(draft)), onDone)} />
      </div>
    </Sheet>
  );
}

// ── Essentials ────────────────────────────────────────────────────────

function EssentialsSheet({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: (n: number) => void }) {
  const { tradition } = useContext(RegistryCtx);
  const tr = useTr();
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, save } = useSave();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Wedding essentials", "शादी का ज़रूरी सामान")} description={tr("Tap everything you'd like.", "जो-जो चाहिए, उस पर टैप करें।")} height="tall">
      <EssentialsPicker selected={selected} onChange={setSelected} tradition={tradition} />
      <div className="sticky bottom-0 -mx-5 mt-4 border-t border-border bg-surface px-5 py-3">
        <Button
          variant="primary"
          size="lg"
          width="100%"
          isLoading={pending}
          isDisabled={!selected.length}
          label={selected.length ? tr(`Add ${selected.length} to wishlist`, `${selected.length} चीज़ें सूची में जोड़ें`) : tr("Select items", "चीज़ें चुनें")}
          onClick={() => save(() => addFromCatalog(slug, selected, []), () => onDone(selected.length))}
        />
      </div>
    </Sheet>
  );
}

// ── Fund ──────────────────────────────────────────────────────────────

function FundSheet({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: (msg: string) => void }) {
  const { giftWord } = useContext(RegistryCtx);
  const tr = useTr();
  const [custom, setCustom] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, save } = useSave();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={tr("Cash funds", "नकद फंड")} description={tr("Guests give any amount by UPI. We suggest ₹501, ₹1,101, ₹2,101…", "मेहमान UPI से कोई भी राशि दें। हम ₹501, ₹1,101, ₹2,101… सुझाते हैं।")} height="tall" purpose="form">
      {custom ? (
        <div className="space-y-4 pb-2">
          <ItemForm slug={slug} draft={custom} set={(p) => setCustom((d) => (d ? { ...d, ...p } : d))} />
          <Button variant="primary" size="lg" width="100%" isLoading={pending} isDisabled={!custom.title.trim()} label={tr("Create fund", "फंड बनाएँ")} onClick={() => save(() => addItem(slug, toInput(custom)), () => onDone(tr("Fund created", "फंड बन गया")))} />
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          <FundPicker selected={selected} onChange={setSelected} giftWord={giftWord} />
          <Button width="100%" icon={<Icon icon={Plus} />} label={tr("Create your own fund", "अपना फंड बनाएँ")} onClick={() => setCustom(emptyDraft("fund"))} />
          <Button
            variant="primary"
            size="lg"
            width="100%"
            isLoading={pending}
            isDisabled={!selected.length}
            label={selected.length ? tr(`Add ${selected.length} fund${selected.length > 1 ? "s" : ""}`, `${selected.length} फंड जोड़ें`) : tr("Select a fund", "फंड चुनें")}
            onClick={() => save(() => addFromCatalog(slug, [], selected), () => onDone(tr("Funds added", "फंड जुड़ गए")))}
          />
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
    <Sheet open onOpenChange={(o) => !o && onClose()} title={item.kind === "fund" ? tr("Edit fund", "फंड बदलें") : tr("Edit gift", "तोहफ़ा बदलें")} purpose="form" height="tall">
      <div className="space-y-4 pb-2">
        <ItemForm slug={slug} draft={draft} set={(p) => setDraft((d) => ({ ...d, ...p }))} locked={item.reservedQty > 0} />
        <Button
          variant="primary"
          size="lg"
          width="100%"
          isLoading={pending}
          isDisabled={!draft.title.trim() || (draft.kind === "product" && !draft.price)}
          label={tr("Save changes", "बदलाव सेव करें")}
          onClick={() => save(() => updateItem(slug, item.id, toInput(draft)), () => onDone(tr("Saved", "सेव हो गया")))}
        />
        {confirmDelete ? (
          <Banner
            status="error"
            collapsible={false}
            title={tr("Remove this from your wishlist?", "इसे सूची से हटाएँ?")}
            description={hasActivity ? tr("Guests have already given towards this. Their entries stay in your ledger.", "मेहमान इसके लिए दे चुके हैं। उनकी एंट्री बही में रहेगी।") : undefined}
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="destructive" width="100%" isLoading={pending} label={tr("Yes, remove", "हाँ, हटाएँ")} onClick={() => save(() => deleteItem(slug, item.id), () => onDone(tr("Removed", "हटा दिया गया")))} />
              <Button width="100%" label={tr("Keep it", "रहने दें")} onClick={() => setConfirmDelete(false)} />
            </div>
          </Banner>
        ) : (
          <Button variant="ghost" width="100%" label={tr("Remove from wishlist", "सूची से हटाएँ")} onClick={() => setConfirmDelete(true)} />
        )}
      </div>
    </Sheet>
  );
}
