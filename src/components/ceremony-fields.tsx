"use client";

import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useLang, useTr } from "@/components/lang";
import { NEUTRAL_GREETING, TRADITIONS, traditionOf, type Tradition } from "@/lib/traditions";

export type CeremonyDraft = { tradition: Tradition; greeting: string; ledgerHeading: string; giftWord: string };

export const NEUTRAL_CEREMONY: CeremonyDraft = { tradition: "none", greeting: "", ledgerHeading: "", giftWord: "" };

/**
 * Optional ceremony style. Picking one fills in suggested wording; every field stays
 * editable, and an empty field simply isn't shown. "None" keeps the registry neutral.
 */
export function CeremonyFields({ value, onChange }: { value: CeremonyDraft; onChange: (v: CeremonyDraft) => void }) {
  const tr = useTr();
  const lang = useLang();

  const pick = (key: string) => {
    const t = traditionOf(key);
    onChange({
      tradition: t.key,
      greeting: t.greeting ? t.greeting[lang] : "",
      ledgerHeading: t.ledgerHeading ?? "",
      giftWord: t.key === "none" ? "" : t.giftWord[lang],
    });
  };

  return (
    <div className="space-y-4">
      <Selector
        label={tr("Ceremony style", "विवाह की रीति")}
        isOptional
        description={tr("It only suggests wording, which you can change. Leave it as None for a neutral page.", "इससे सिर्फ़ शब्द सुझाए जाते हैं, जिन्हें आप बदल सकते हैं। सामान्य पेज के लिए 'कोई नहीं' रहने दें।")}
        width="100%"
        size="lg"
        value={value.tradition}
        presentation="adaptive"
        options={TRADITIONS.map((t) => ({ value: t.key, label: lang === "hi" ? t.hi : t.en }))}
        onChange={pick}
      />
      {value.tradition !== "none" && (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <TextInput
            label={tr("Greeting above your names", "आपके नामों के ऊपर अभिवादन")}
            isOptional
            description={tr(`Leave empty to show "${NEUTRAL_GREETING.en}".`, `खाली छोड़ें तो "${NEUTRAL_GREETING.hi}" दिखेगा।`)}
            width="100%"
            value={value.greeting}
            onChange={(v) => onChange({ ...value, greeting: v.slice(0, 60) })}
          />
          <TextInput
            label={tr("Your word for gift money", "उपहार राशि के लिए आपका शब्द")}
            isOptional
            description={tr('Used on buttons like "Send shagun". Leave empty for "Gift".', 'जैसे "शगुन भेजें" बटन पर। खाली छोड़ें तो "तोहफ़ा" दिखेगा।')}
            width="100%"
            value={value.giftWord}
            onChange={(v) => onChange({ ...value, giftWord: v.slice(0, 24) })}
            placeholder={tr("Shagun, Salami, Gift…", "शगुन, सलामी, तोहफ़ा…")}
          />
          <TextInput
            label={tr("Heading on your printed ledger", "छपी बही का शीर्षक")}
            isOptional
            description={tr("A blessing or verse at the top of the ledger. Leave empty for none.", "बही के ऊपर कोई आशीर्वचन। न चाहें तो खाली छोड़ें।")}
            width="100%"
            value={value.ledgerHeading}
            onChange={(v) => onChange({ ...value, ledgerHeading: v.slice(0, 80) })}
          />
          <Text as="p" type="supporting" display="block">
            {tr("Faith items for this style will also appear in the catalog.", "इस रीति की आस्था से जुड़ी चीज़ें भी सूची में दिखेंगी।")}
          </Text>
        </div>
      )}
    </div>
  );
}
