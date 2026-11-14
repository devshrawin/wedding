"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Globe, KeyRound, MailCheck, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { addFamilyMember, deleteRegistry, removeFamilyMember, updateCeremony, updateDetails, updatePrivacy, updateUpi } from "@/app/actions/registry";
import { CeremonyFields, type CeremonyDraft } from "@/components/ceremony-fields";
import { useTr } from "@/components/lang";
import { RegistryFields, type RegistryDraft } from "@/components/registry-fields";
import { toast } from "@/components/ui/feedback";
import { errorText, type Result } from "@/lib/result";
import { isValidUpiId } from "@/lib/utils";

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
    ceremony: CeremonyDraft;
    ambient: boolean;
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
    <section id={id} className="scroll-mt-20">
      <Card padding={5}>
        <Heading level={2}>{title}</Heading>
        {hint && (
          <Text as="p" type="supporting" display="block">
            {hint}
          </Text>
        )}
        <div className="mt-4">{children}</div>
      </Card>
    </section>
  );
}

export function SettingsForms({ slug, role, razorpay, registry, members }: Props) {
  const tr = useTr();
  return (
    <>
      {role === "family" && (
        <Banner status="info" collapsible={false} title={tr("You're helping as family", "आप परिवार के रूप में मदद कर रहे हैं")} description={tr("You can manage gifts, cash gifts and thank-yous. Only the couple can change the payout UPI ID, family members, or delete the registry.", "आप तोहफ़े, नकद उपहार और धन्यवाद सँभाल सकते हैं। UPI ID, परिवार के सदस्य या रजिस्ट्री हटाना सिर्फ़ जोड़ा कर सकता है।")} />
      )}
      <PrivacySection slug={slug} registry={registry} />
      <UpiSection slug={slug} registry={registry} razorpay={razorpay} canEdit={role === "owner"} />
      <DetailsSection slug={slug} registry={registry} />
      <CeremonySection slug={slug} initial={registry.ceremony} />
      <FamilySection slug={slug} members={members} canEdit={role === "owner"} />
      {role === "owner" && <DangerSection slug={slug} />}
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
    { k: "link" as const, icon: Globe, t: tr("Anyone with the link", "जिसके पास लिंक हो"), d: tr("Simple. Not on Google; only people you send the link to can find it.", "आसान। Google पर नहीं दिखती; सिर्फ़ वही देख पाएँगे जिन्हें आप लिंक भेजें।") },
    { k: "password" as const, icon: KeyRound, t: tr("Password protected", "पासवर्ड से सुरक्षित"), d: tr("Guests enter a password you choose (print it on the invitation).", "मेहमान आपका चुना पासवर्ड डालते हैं (इसे निमंत्रण पर छाप सकते हैं)।") },
    { k: "invite" as const, icon: MailCheck, t: tr("Invite-only", "सिर्फ़ आमंत्रित"), d: tr("Each guest gets a personal WhatsApp link. Most private.", "हर मेहमान को WhatsApp पर निजी लिंक मिलता है। सबसे निजी।") },
  ];

  return (
    <Section id="privacy" title={tr("Privacy", "निजता")} hint={tr("Guests never see who gave what. That's always private.", "मेहमान कभी नहीं देख सकते कि किसने क्या दिया, यह हमेशा निजी रहता है।")}>
      <div role="radiogroup" aria-label={tr("Who can open your registry", "रजिस्ट्री कौन खोल सकता है")} className="space-y-2.5">
        {options.map((o) => (
          <SelectableCard key={o.k} label={o.t} isSelected={visibility === o.k} onChange={() => setVisibility(o.k)} padding={4}>
            <div className="flex items-start gap-3 pr-6">
              <o.icon className={visibility === o.k ? "mt-0.5 size-6 shrink-0 text-accent" : "mt-0.5 size-6 shrink-0 text-secondary"} aria-hidden />
              <span>
                <span className="block font-semibold text-primary">{o.t}</span>
                <span className="block text-[15px] leading-snug text-secondary">{o.d}</span>
              </span>
            </div>
          </SelectableCard>
        ))}
      </div>

      {visibility === "password" && (
        <div className="mt-4">
          <TextInput
            label={registry.hasPassword ? tr("New password", "नया पासवर्ड") : tr("Choose a password", "पासवर्ड चुनें")}
            isOptional={registry.hasPassword}
            description={tr("At least 4 characters. Easy to say on the phone, like “shaadi2027”. Changing it signs out guests who used the old one.", "कम से कम 4 अक्षर। फ़ोन पर बताना आसान हो, जैसे “shaadi2027”। बदलने पर पुराने पासवर्ड वाले मेहमानों को दोबारा डालना होगा।")}
            width="100%"
            value={password}
            onChange={(v) => setPassword(v.slice(0, 40))}
            autoCapitalize="none"
            autoComplete="off"
            placeholder={registry.hasPassword ? "••••••" : "shaadi2027"}
          />
        </div>
      )}
      {visibility === "invite" && (
        <div className="mt-4">
          <Banner status="info" collapsible={false} title={tr("After saving, create personal links in the Share tab.", "सेव करने के बाद, ‘शेयर’ टैब में निजी लिंक बनाएँ।")} />
        </div>
      )}

      <div className="mt-5 space-y-4">
        <Switch
          label={tr("Hide gifts once reserved", "चुने जा चुके तोहफ़े छिपाएँ")}
          description={tr("Reserved gifts disappear from the guest page instead of showing as “Reserved”.", "चुने गए तोहफ़े “चुन लिया गया” दिखने के बजाय मेहमानों के पेज से हट जाते हैं।")}
          labelSpacing="spread"
          width="100%"
          value={hideReserved}
          onChange={setHideReserved}
        />
        <Switch
          label={tr("Show fund progress to guests", "मेहमानों को फंड की प्रगति दिखाएँ")}
          description={tr("Off by default: guests can't see how much a fund has collected. (Chip-in gifts always show what's still needed.)", "शुरू में बंद: मेहमान नहीं देख सकते कि फंड में कितना जमा हुआ। (मिलकर देने वाले तोहफ़ों पर बाकी राशि हमेशा दिखती है।)")}
          labelSpacing="spread"
          width="100%"
          value={showAmounts}
          onChange={setShowAmounts}
        />
      </div>

      <div className="mt-5">
        <Button
          variant="primary"
          width="100%"
          isLoading={pending}
          isDisabled={needsPassword}
          label={tr("Save privacy", "निजता सेव करें")}
          icon={<Icon icon={ShieldCheck} />}
          onClick={() => run(() => updatePrivacy(slug, { visibility, password, hideReserved, showAmounts }), undefined, () => setPassword(""))}
        />
      </div>
    </Section>
  );
}

// ── UPI ───────────────────────────────────────────────────────────────

function UpiSection({ slug, registry, razorpay, canEdit }: Pick<Props, "slug" | "registry" | "razorpay"> & { canEdit: boolean }) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [upiId, setUpiId] = useState(registry.upiId);
  const [upiName, setUpiName] = useState(registry.upiName || registry.partnerOne);
  const badId = upiId.trim() !== "" && !isValidUpiId(upiId);
  const valid = !upiId.trim() || (!badId && upiName.trim().length > 0);

  return (
    <Section
      id="upi"
      title={tr("Receive cash gifts by UPI", "UPI से नकद उपहार पाएँ")}
      hint={tr("Guests pay straight into your account with any UPI app. Giftr never touches the money and charges nothing.", "मेहमान किसी भी UPI ऐप से सीधे आपके खाते में भेजते हैं। Giftr पैसे को छूता नहीं और कोई शुल्क नहीं लेता।")}
    >
      {!canEdit ? (
        <Text as="p" type="body" display="block">
          {registry.upiId
            ? tr(`Cash gifts go to ${registry.upiName} (${registry.upiId}). Only the couple can change this.`, `नकद उपहार ${registry.upiName} (${registry.upiId}) को जाता है। इसे सिर्फ़ जोड़ा बदल सकता है।`)
            : tr("The couple hasn't added a UPI ID yet. Only they can add it.", "जोड़े ने अभी UPI ID नहीं जोड़ी है। इसे सिर्फ़ वही जोड़ सकते हैं।")}
        </Text>
      ) : (
        <div className="space-y-4">
          <TextInput
            label={tr("Your UPI ID", "आपकी UPI ID")}
            description={tr("In PhonePe / GPay / Paytm, tap your profile picture. Looks like name@okhdfcbank.", "PhonePe / GPay / Paytm में अपनी प्रोफ़ाइल फ़ोटो पर टैप करें। जैसे name@okhdfcbank।")}
            width="100%"
            value={upiId}
            onChange={(v) => setUpiId(v.trim())}
            placeholder="ananya@okhdfcbank"
            autoCapitalize="none"
            hasAutoCorrect={false}
            hasSpellCheck={false}
            inputMode="email"
            status={badId ? { type: "error", message: tr("That doesn't look like a UPI ID.", "यह UPI ID सही नहीं लग रही।") } : undefined}
            statusVariant="detached"
          />
          <TextInput
            label={tr("Account holder name", "खाताधारक का नाम")}
            description={tr("Guests see this before paying, so they know it's you.", "भुगतान से पहले मेहमानों को यह नाम दिखता है, ताकि पहचान पक्की रहे।")}
            width="100%"
            value={upiName}
            onChange={(v) => setUpiName(v.slice(0, 60))}
          />
          <Button variant="primary" width="100%" isLoading={pending} isDisabled={!valid} label={tr("Save UPI details", "UPI जानकारी सेव करें")} onClick={() => run(() => updateUpi(slug, { upiId, upiName }))} />
          {razorpay && <Text type="supporting">{tr("Card / netbanking via Razorpay is also on for your guests.", "आपके मेहमानों के लिए Razorpay से कार्ड / नेटबैंकिंग भी चालू है।")}</Text>}
        </div>
      )}
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
  const [ambient, setAmbient] = useState(registry.ambient);
  return (
    <Section id="details" title={tr("Wedding details", "शादी की जानकारी")}>
      <RegistryFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} currentPhoto={registry.photo} />
      <div className="mt-5">
        <Switch
          label={tr("Gentle sparkle on your page", "आपके पेज पर हल्की चमक")}
          description={tr("Petals drift and lights twinkle at the top of your guest page. Off for anyone whose phone asks for less motion.", "मेहमानों वाले पेज के ऊपर पंखुड़ियाँ गिरती हैं और लाइटें टिमटिमाती हैं। जिनके फ़ोन में कम हलचल चुनी है, उनके लिए बंद रहेगा।")}
          labelSpacing="spread"
          width="100%"
          value={ambient}
          onChange={setAmbient}
        />
      </div>
      <div className="mt-5">
        <Button
          variant="primary"
          width="100%"
          isLoading={pending}
          isDisabled={!draft.partnerOne.trim() || !draft.partnerTwo.trim()}
          label={tr("Save details", "जानकारी सेव करें")}
          onClick={() => run(() => updateDetails(slug, { ...draft, ambient }), undefined, () => setDraft((d) => ({ ...d, photo: "keep" })))}
        />
      </div>
    </Section>
  );
}

// ── Ceremony style ────────────────────────────────────────────────────

function CeremonySection({ slug, initial }: { slug: string; initial: CeremonyDraft }) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [value, setValue] = useState<CeremonyDraft>(initial);
  return (
    <Section
      id="ceremony"
      title={tr("Ceremony style & wording", "विवाह की रीति और शब्द")}
      hint={tr("Your page is neutral unless you choose otherwise. Change the greeting, your word for gift money, or the ledger heading anytime.", "जब तक आप न चुनें, आपका पेज सामान्य रहता है। अभिवादन, उपहार राशि का शब्द या बही का शीर्षक कभी भी बदलें।")}
    >
      <CeremonyFields value={value} onChange={setValue} />
      <div className="mt-5">
        <Button variant="primary" width="100%" isLoading={pending} label={tr("Save wording", "शब्द सेव करें")} onClick={() => run(() => updateCeremony(slug, value))} />
      </div>
    </Section>
  );
}

// ── Family mode ───────────────────────────────────────────────────────

function FamilySection({ slug, members, canEdit }: { slug: string; members: Props["members"]; canEdit: boolean }) {
  const tr = useTr();
  const { pending, run } = useAction();
  const [f, setF] = useState({ name: "", phone: "", relation: "" });
  return (
    <Section
      id="family"
      title={tr("Family mode", "फ़ैमिली मोड")}
      hint={tr("Let parents or siblings help: confirm cash gifts, add cash entries, send thank-yous. They sign in with their own mobile number.", "माता-पिता या भाई-बहन भी मदद करें, उपहार की पुष्टि, नकद एंट्री, धन्यवाद संदेश। वे अपने मोबाइल नंबर से लॉग इन करते हैं।")}
    >
      {members.length > 0 && (
        <ul className="mb-4 divide-y divide-[var(--color-border)] rounded-xl border border-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-3">
              <Avatar name={m.name} size="md" tooltip={false} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">
                  {m.name} {m.relation && <span className="font-normal text-secondary">· {m.relation}</span>}
                </p>
                <p className="text-sm text-secondary">{m.phone}</p>
              </div>
              {canEdit && <IconButton variant="ghost" label={tr(`Remove ${m.name}`, `${m.name} को हटाएँ`)} icon={<Icon icon={Trash2} />} onClick={() => run(() => removeFamilyMember(slug, m.id), tr("Removed", "हटा दिया गया"))} />}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <form
          id="family-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addFamilyMember(slug, f), tr("Family member added", "परिवार का सदस्य जुड़ गया"), () => setF({ name: "", phone: "", relation: "" }));
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextInput label={tr("Name", "नाम")} width="100%" value={f.name} onChange={(v) => setF({ ...f, name: v.slice(0, 40) })} placeholder={tr("Mummy", "मम्मी")} />
            <TextInput label={tr("Relation", "रिश्ता")} isOptional width="100%" value={f.relation} onChange={(v) => setF({ ...f, relation: v.slice(0, 30) })} placeholder={tr("Mother", "माँ")} />
          </div>
          <TextInput label={tr("Their mobile number", "उनका मोबाइल नंबर")} width="100%" type="tel" inputMode="numeric" value={f.phone} onChange={(v) => setF({ ...f, phone: v.slice(0, 14) })} placeholder="98765 43210" />
          <Button type="submit" width="100%" isLoading={pending} isDisabled={!f.name.trim() || f.phone.replace(/\D/g, "").length < 10} label={tr("Add family member", "परिवार का सदस्य जोड़ें")} icon={<Icon icon={UserPlus} />} />
        </form>
      ) : (
        <Text type="supporting">{tr("Only the couple can add or remove family members.", "परिवार के सदस्य सिर्फ़ जोड़ा ही जोड़ या हटा सकता है।")}</Text>
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
    <section>
      <Banner
        status="error"
        collapsible={false}
        title={tr("Delete registry", "रजिस्ट्री हटाएँ")}
        description={tr("Permanently deletes the registry, all gifts, photos and the gift ledger. Download your ledger first.", "रजिस्ट्री, सारे तोहफ़े, फ़ोटो और उपहार बही हमेशा के लिए हट जाएँगे। पहले बही डाउनलोड कर लें।")}
      >
        {open ? (
          <div className="space-y-3">
            <TextInput label={tr(`Type “${slug}” to confirm`, `पुष्टि के लिए “${slug}” लिखें`)} width="100%" value={text} onChange={setText} autoCapitalize="none" autoComplete="off" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="destructive" width="100%" isLoading={pending} isDisabled={text.trim() !== slug} label={tr("Delete forever", "हमेशा के लिए हटाएँ")} onClick={remove} />
              <Button width="100%" label={tr("Cancel", "रद्द करें")} onClick={() => setOpen(false)} />
            </div>
          </div>
        ) : (
          <Button variant="destructive" label={tr("Delete this registry", "यह रजिस्ट्री हटाएँ")} icon={<Icon icon={Trash2} />} onClick={() => setOpen(true)} />
        )}
      </Banner>
    </section>
  );
}
