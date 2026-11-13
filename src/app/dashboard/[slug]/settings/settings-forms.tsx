"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, KeyRound, MailCheck, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { addFamilyMember, deleteRegistry, removeFamilyMember, updateDetails, updatePrivacy, updateUpi } from "@/app/actions/registry";
import { useTr } from "@/components/lang";
import { RegistryFields, type RegistryDraft } from "@/components/registry-fields";
import { Button } from "@/components/ui/button";
import { Field, Switch, toast } from "@/components/ui/bits";
import { errorText, type Result } from "@/lib/result";
import { cn, isValidUpiId } from "@/lib/utils";

type Props = {
  slug: string;
  role: "owner" | "family";
  razorpay: boolean;
  registry: {
    partnerOne: string;
    partnerTwo: string;
    weddingDate: string;
    city: string;
    note: string;
    theme: string;
    photo: string | null;
    visibility: "link" | "password" | "invite";
    hasPassword: boolean;
    hideReserved: boolean;
    showAmounts: boolean;
    upiId: string;
    upiName: string;
  };
  members: { id: string; name: string; phone: string; relation: string | null }[];
};

function useAction() {
  const tr = useTr();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, okMsg?: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      toast(okMsg ?? tr("Saved", "सेव हो गया"));
      after?.();
      router.refresh();
    });
  return { pending, run };
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-[15px] text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsForms({ slug, role, razorpay, registry, members }: Props) {
  const tr = useTr();
  return (
    <>
      <PrivacySection slug={slug} registry={registry} />
      <UpiSection slug={slug} registry={registry} razorpay={razorpay} canEdit={role === "owner"} />
      <DetailsSection slug={slug} registry={registry} />
      <FamilySection slug={slug} members={members} canEdit={role === "owner"} />
      {role === "owner" && <DangerSection slug={slug} />}
      {role === "family" && (
        <p className="rounded-2xl bg-leaf-soft p-4 text-[15px] text-leaf">
          {tr("You're helping manage this registry in Family mode.", "आप फ़ैमिली मोड में इस रजिस्ट्री को सँभालने में मदद कर रहे हैं।")}
        </p>
      )}
    </>
  );
}

// ── Privacy ───────────────────────────────────────────────────────────

function PrivacySection({ slug, registry }: Pick<Props, "slug" | "registry">) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [visibility, setVisibility] = useState(registry.visibility);
  const [password, setPassword] = useState("");
  const [hideReserved, setHideReserved] = useState(registry.hideReserved);
  const [showAmounts, setShowAmounts] = useState(registry.showAmounts);
  const needsPassword = visibility === "password" && !registry.hasPassword && password.trim().length < 4;

  const options = [
    { k: "link" as const, icon: Globe, t: tr("Anyone with the link", "जिसके पास लिंक हो"), d: tr("Simple. Not listed on Google; only people you send the link to can find it.", "आसान। Google पर नहीं दिखती; सिर्फ़ वही देख पाएँगे जिन्हें आप लिंक भेजें।") },
    { k: "password" as const, icon: KeyRound, t: tr("Password protected", "पासवर्ड से सुरक्षित"), d: tr("Guests enter a password you choose (print it on the invitation).", "मेहमान आपका चुना पासवर्ड डालते हैं (इसे निमंत्रण पर छाप सकते हैं)।") },
    { k: "invite" as const, icon: MailCheck, t: tr("Invite-only", "सिर्फ़ आमंत्रित"), d: tr("Each guest gets a personal WhatsApp link. Most private.", "हर मेहमान को WhatsApp पर निजी लिंक मिलता है। सबसे निजी।") },
  ];

  return (
    <Section id="privacy" title={tr("Privacy", "निजता")} hint={tr("Guests never see who gave what — that's always private.", "मेहमान कभी नहीं देख सकते कि किसने क्या दिया — यह हमेशा निजी रहता है।")}>
      <div role="radiogroup" aria-label={tr("Who can open your registry", "रजिस्ट्री कौन खोल सकता है")} className="space-y-2.5">
        {options.map((o) => (
          <button
            key={o.k}
            type="button"
            role="radio"
            aria-checked={visibility === o.k}
            onClick={() => setVisibility(o.k)}
            className={cn("flex w-full items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left", visibility === o.k ? "border-primary bg-primary-soft/40" : "border-line")}
          >
            <o.icon className={cn("mt-0.5 size-6 shrink-0", visibility === o.k ? "text-primary" : "text-muted")} />
            <span>
              <span className="block font-semibold">{o.t}</span>
              <span className="block text-[15px] leading-snug text-muted">{o.d}</span>
            </span>
          </button>
        ))}
      </div>

      {visibility === "password" && (
        <div className="mt-4">
          <Field label={registry.hasPassword ? tr("New password", "नया पासवर्ड") : tr("Choose a password", "पासवर्ड चुनें")} optional={registry.hasPassword} hint={tr("At least 4 characters. Something easy to say on the phone, like “shaadi2027”.", "कम से कम 4 अक्षर। कुछ ऐसा जो फ़ोन पर बताना आसान हो, जैसे “shaadi2027”।")}>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={40} autoCapitalize="none" autoComplete="off" placeholder={registry.hasPassword ? "••••••" : "shaadi2027"} />
          </Field>
        </div>
      )}
      {visibility === "invite" && (
        <p className="mt-4 rounded-2xl bg-sand/70 p-3 text-[15px] text-muted">{tr("After saving, create personal links in the Share tab.", "सेव करने के बाद, ‘शेयर’ टैब में निजी लिंक बनाएँ।")}</p>
      )}

      <div className="mt-4 rounded-2xl border border-line bg-white px-4 py-1">
        <Switch checked={hideReserved} onChange={setHideReserved} label={tr("Hide gifts once reserved", "चुने जा चुके तोहफ़े छिपाएँ")} hint={tr("Reserved gifts disappear from the guest page instead of showing as “Reserved”.", "चुने गए तोहफ़े “चुन लिया गया” दिखने के बजाय मेहमानों के पेज से हट जाते हैं।")} />
        <Switch checked={showAmounts} onChange={setShowAmounts} label={tr("Show fund progress to guests", "मेहमानों को फंड की प्रगति दिखाएँ")} hint={tr("Off by default: guests can't see how much has been collected.", "शुरू में बंद: मेहमान नहीं देख सकते कि कितनी राशि जमा हुई।")} />
      </div>

      <Button block className="mt-4" loading={pending} disabled={needsPassword} onClick={() => run(() => updatePrivacy(slug, { visibility, password, hideReserved, showAmounts }), undefined, () => setPassword(""))}>
        <ShieldCheck className="size-5" /> {tr("Save privacy", "निजता सेव करें")}
      </Button>
    </Section>
  );
}

// ── UPI ───────────────────────────────────────────────────────────────

function UpiSection({ slug, registry, razorpay, canEdit }: Pick<Props, "slug" | "registry" | "razorpay"> & { canEdit: boolean }) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [upiId, setUpiId] = useState(registry.upiId);
  const [upiName, setUpiName] = useState(registry.upiName || registry.partnerOne);
  const valid = !upiId.trim() || (isValidUpiId(upiId) && upiName.trim().length > 0);
  if (!canEdit) {
    return (
      <Section id="upi" title={tr("Receive shagun by UPI", "UPI से शगुन पाएँ")}>
        <p className="text-[15px] text-muted">
          {registry.upiId
            ? tr(`Shagun goes to ${registry.upiName} (${registry.upiId}). Only the couple can change this.`, `शगुन ${registry.upiName} (${registry.upiId}) को जाता है। इसे सिर्फ़ जोड़ा बदल सकता है।`)
            : tr("The couple hasn't added a UPI ID yet. Only they can add it.", "जोड़े ने अभी UPI ID नहीं जोड़ी है। इसे सिर्फ़ वही जोड़ सकते हैं।")}
        </p>
      </Section>
    );
  }
  return (
    <Section id="upi" title={tr("Receive shagun by UPI", "UPI से शगुन पाएँ")} hint={tr("Guests pay straight into your account with any UPI app. Giftr never touches the money and charges nothing.", "मेहमान किसी भी UPI ऐप से सीधे आपके खाते में भेजते हैं। Giftr पैसे को छूता नहीं और कोई शुल्क नहीं लेता।")}>
      <div className="space-y-4">
        <Field label={tr("Your UPI ID", "आपकी UPI ID")} hint={tr("Find it in PhonePe / GPay / Paytm under your profile. Looks like name@okhdfcbank.", "PhonePe / GPay / Paytm में अपनी प्रोफ़ाइल में देखें। जैसे name@okhdfcbank।")}>
          <input className="input font-mono" value={upiId} onChange={(e) => setUpiId(e.target.value.trim())} placeholder="ananya@okhdfcbank" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" />
        </Field>
        {upiId.trim() && !isValidUpiId(upiId) && <p className="-mt-2 text-[15px] font-semibold text-red-700">{tr("That doesn't look like a UPI ID.", "यह UPI ID सही नहीं लग रही।")}</p>}
        <Field label={tr("Account holder name", "खाताधारक का नाम")} hint={tr("Guests see this name before paying, so they know it's you.", "भुगतान से पहले मेहमानों को यह नाम दिखता है, ताकि पहचान पक्की रहे।")}>
          <input className="input" value={upiName} onChange={(e) => setUpiName(e.target.value)} maxLength={60} />
        </Field>
        <Button block loading={pending} disabled={!valid} onClick={() => run(() => updateUpi(slug, { upiId, upiName }))}>
          {tr("Save UPI details", "UPI जानकारी सेव करें")}
        </Button>
        {razorpay && <p className="text-sm text-muted">{tr("Card / netbanking via Razorpay is also enabled for your guests.", "आपके मेहमानों के लिए Razorpay से कार्ड / नेटबैंकिंग भी चालू है।")}</p>}
      </div>
    </Section>
  );
}

// ── Details ───────────────────────────────────────────────────────────

function DetailsSection({ slug, registry }: Pick<Props, "slug" | "registry">) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<RegistryDraft>({
    partnerOne: registry.partnerOne,
    partnerTwo: registry.partnerTwo,
    weddingDate: registry.weddingDate,
    city: registry.city,
    note: registry.note,
    theme: registry.theme,
    photo: "keep",
  });
  return (
    <Section id="details" title={tr("Wedding details", "शादी की जानकारी")}>
      <RegistryFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} currentPhoto={registry.photo} />
      <Button block className="mt-5" loading={pending} disabled={!draft.partnerOne.trim() || !draft.partnerTwo.trim()} onClick={() => run(() => updateDetails(slug, draft), undefined, () => setDraft((d) => ({ ...d, photo: "keep" })))}>
        {tr("Save details", "जानकारी सेव करें")}
      </Button>
    </Section>
  );
}

// ── Family mode ───────────────────────────────────────────────────────

function FamilySection({ slug, members, canEdit }: { slug: string; members: Props["members"]; canEdit: boolean }) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [f, setF] = useState({ name: "", phone: "", relation: "" });
  return (
    <Section id="family" title={tr("Family mode", "फ़ैमिली मोड")} hint={tr("Let parents or siblings manage the registry — confirm shagun, add cash entries, send thank-yous. They sign in with their own mobile number.", "माता-पिता या भाई-बहन भी रजिस्ट्री सँभाल सकें — शगुन की पुष्टि, नकद एंट्री, धन्यवाद संदेश। वे अपने मोबाइल नंबर से लॉग इन करते हैं।")}>
      {members.length > 0 && (
        <ul className="mb-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-soft font-semibold text-leaf">{m.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {m.name} {m.relation && <span className="font-normal text-muted">· {m.relation}</span>}
                </p>
                <p className="text-sm text-muted">{m.phone}</p>
              </div>
              {canEdit && (
                <button type="button" onClick={() => run(() => removeFamilyMember(slug, m.id), tr("Removed", "हटा दिया गया"))} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700" aria-label={tr(`Remove ${m.name}`, `${m.name} को हटाएँ`)}>
                  <Trash2 className="size-5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addFamilyMember(slug, f), tr("Family member added", "परिवार का सदस्य जुड़ गया"), () => setF({ name: "", phone: "", relation: "" }));
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={tr("Name", "नाम")}>
              <input className="input" value={f.name} maxLength={40} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={tr("Mummy", "मम्मी")} />
            </Field>
            <Field label={tr("Relation", "रिश्ता")} optional>
              <input className="input" value={f.relation} maxLength={30} onChange={(e) => setF({ ...f, relation: e.target.value })} placeholder={tr("Mother", "माँ")} />
            </Field>
          </div>
          <Field label={tr("Mobile number", "मोबाइल नंबर")}>
            <input className="input" type="tel" inputMode="numeric" value={f.phone} maxLength={14} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98765 43210" />
          </Field>
          <Button type="submit" variant="soft" block loading={pending} disabled={!f.name.trim() || f.phone.replace(/\D/g, "").length < 10}>
            <UserPlus className="size-5" /> {tr("Add family member", "परिवार का सदस्य जोड़ें")}
          </Button>
        </form>
      ) : (
        <p className="text-[15px] text-muted">{tr("Only the couple can add or remove family members.", "परिवार के सदस्य सिर्फ़ जोड़ा ही जोड़ या हटा सकता है।")}</p>
      )}
    </Section>
  );
}

// ── Danger zone ───────────────────────────────────────────────────────

function DangerSection({ slug }: { slug: string }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const remove = () =>
    start(async () => {
      const res = await deleteRegistry(slug, text);
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      window.location.assign("/dashboard");
    });
  return (
    <section className="rounded-3xl border border-red-200 bg-red-50/50 p-5">
      <h2 className="text-xl font-semibold text-red-800">{tr("Delete registry", "रजिस्ट्री हटाएँ")}</h2>
      <p className="mt-1 text-[15px] text-red-900/80">{tr("This permanently deletes the registry, all gifts, and the shagun ledger. Export your ledger first.", "इससे रजिस्ट्री, सारे तोहफ़े और शगुन की बही हमेशा के लिए हट जाएगी। पहले बही डाउनलोड कर लें।")}</p>
      {open ? (
        <div className="mt-4 space-y-3">
          <Field label={tr(`Type “${slug}” to confirm`, `पुष्टि के लिए “${slug}” लिखें`)}>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="none" autoComplete="off" />
          </Field>
          <div className="flex gap-2">
            <Button variant="danger" block loading={pending} disabled={text.trim() !== slug} onClick={remove}>
              {tr("Delete forever", "हमेशा के लिए हटाएँ")}
            </Button>
            <Button variant="outline" block onClick={() => setOpen(false)}>
              {tr("Cancel", "रद्द करें")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
          <Trash2 className="size-5" /> {tr("Delete this registry", "यह रजिस्ट्री हटाएँ")}
        </Button>
      )}
    </section>
  );
}
