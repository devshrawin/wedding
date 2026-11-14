/**
 * Ceremony styles. Optional: the default ("none") is neutral and shows nothing religious.
 * A style only *suggests* wording; every field stays editable and can be cleared.
 * Suggestions should be reviewed by people from each community before launch.
 */
export type Tradition = "none" | "hindu" | "muslim" | "christian" | "sikh" | "jain" | "parsi" | "civil" | "custom";

export type TraditionPreset = {
  key: Tradition;
  en: string;
  hi: string;
  /** line above the couple's names on the guest page and share card */
  greeting: { en: string; hi: string } | null;
  /** optional heading at the top of the printed ledger */
  ledgerHeading: string | null;
  /** what the family calls gift money */
  giftWord: { en: string; hi: string };
};

const GIFT = { en: "Gift", hi: "तोहफ़ा" };
const SHAGUN = { en: "Shagun", hi: "शगुन" };

export const TRADITIONS: TraditionPreset[] = [
  { key: "none", en: "None", hi: "कोई नहीं", greeting: null, ledgerHeading: null, giftWord: GIFT },
  { key: "hindu", en: "Hindu", hi: "हिंदू", greeting: { en: "Shubh Vivah", hi: "॥ शुभ विवाह ॥" }, ledgerHeading: "॥ श्री गणेशाय नमः ॥", giftWord: SHAGUN },
  { key: "muslim", en: "Muslim (Nikah)", hi: "मुस्लिम (निकाह)", greeting: { en: "Nikah Mubarak", hi: "निकाह मुबारक" }, ledgerHeading: "بسم الله الرحمن الرحيم", giftWord: GIFT },
  { key: "christian", en: "Christian", hi: "ईसाई", greeting: { en: "Holy Matrimony", hi: "पवित्र विवाह" }, ledgerHeading: null, giftWord: GIFT },
  { key: "sikh", en: "Sikh (Anand Karaj)", hi: "सिख (आनंद कारज)", greeting: { en: "Anand Karaj", hi: "आनंद कारज" }, ledgerHeading: "ੴ", giftWord: SHAGUN },
  { key: "jain", en: "Jain", hi: "जैन", greeting: { en: "Shubh Vivah", hi: "॥ शुभ विवाह ॥" }, ledgerHeading: "॥ जय जिनेन्द्र ॥", giftWord: SHAGUN },
  { key: "parsi", en: "Parsi (Lagan)", hi: "पारसी (लगन)", greeting: { en: "Lagan", hi: "लगन" }, ledgerHeading: null, giftWord: GIFT },
  { key: "civil", en: "Civil / court", hi: "सिविल / कोर्ट", greeting: { en: "Just married", hi: "अभी-अभी शादी हुई" }, ledgerHeading: null, giftWord: GIFT },
  { key: "custom", en: "My own words", hi: "अपने शब्द", greeting: null, ledgerHeading: null, giftWord: GIFT },
];

export function traditionOf(key: string | null | undefined): TraditionPreset {
  return TRADITIONS.find((t) => t.key === key) ?? TRADITIONS[0];
}

/** Default words when the couple hasn't written their own. */
export const NEUTRAL_GREETING = { en: "We're getting married", hi: "हम शादी कर रहे हैं" };

/** If the couple kept a preset word, show it in the reader's language; their own words stay as typed. */
function localise(value: string, lang: "en" | "hi", pairs: ({ en: string; hi: string } | null)[]): string {
  const v = value.trim().toLowerCase();
  const hit = pairs.find((p) => p && (p.en.toLowerCase() === v || p.hi === value.trim()));
  return hit ? hit[lang] : value.trim();
}

export function greetingFor(r: { greeting: string | null }, lang: "en" | "hi"): string {
  if (!r.greeting?.trim()) return NEUTRAL_GREETING[lang];
  return localise(r.greeting, lang, TRADITIONS.map((t) => t.greeting));
}

/** "Gift" / "Shagun" / whatever the couple typed. Used in buttons like "Send shagun". */
export function giftWordFor(r: { giftWord: string | null }, lang: "en" | "hi"): string {
  if (!r.giftWord?.trim()) return GIFT[lang];
  return localise(r.giftWord, lang, TRADITIONS.map((t) => t.giftWord));
}
