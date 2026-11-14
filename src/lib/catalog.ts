import type { Tradition } from "./traditions";

export type Category = { key: string; en: string; hi: string; icon: string };

export const CATEGORIES: Category[] = [
  { key: "kitchen", en: "Kitchen", hi: "रसोई", icon: "cookware" },
  { key: "appliances", en: "Appliances", hi: "उपकरण", icon: "microwave" },
  { key: "home", en: "Home & decor", hi: "घर और सजावट", icon: "lamp" },
  { key: "bedding", en: "Bed & bath", hi: "बिस्तर और स्नान", icon: "bed" },
  { key: "faith", en: "Faith & prayer", hi: "आस्था और प्रार्थना", icon: "candle" },
  { key: "travel", en: "Travel", hi: "यात्रा", icon: "luggage" },
  { key: "fund", en: "Cash funds", hi: "नकद फंड", icon: "blessing" },
  { key: "other", en: "Other", hi: "अन्य", icon: "gift" },
];

/** Couples can name their own section: stored as "c:<name>". */
export const CUSTOM_PREFIX = "c:";

export function categoryOf(key: string): Category {
  if (key.startsWith(CUSTOM_PREFIX)) {
    const name = key.slice(CUSTOM_PREFIX.length);
    return { key, en: name, hi: name, icon: "gift" };
  }
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export type CatalogItem = {
  id: string;
  en: string;
  hi: string;
  icon: string;
  category: string;
  price: number; // typical price in rupees; couples can edit
  starter?: boolean;
  /** faith items appear only for these ceremony styles */
  traditions?: Tradition[];
};

/** Everyday essentials every new home needs, plus faith items shown only when a style is picked. */
export const CATALOG: CatalogItem[] = [
  // Kitchen
  { id: "mixer", en: "Mixer grinder (750W)", hi: "मिक्सर ग्राइंडर (750W)", icon: "mixer", category: "kitchen", price: 4500, starter: true },
  { id: "cooker", en: "Pressure cooker set", hi: "प्रेशर कुकर सेट", icon: "pressureCooker", category: "kitchen", price: 3200, starter: true },
  { id: "steel", en: "Stainless steel utensil set (51 pc)", hi: "स्टील बर्तन सेट (51 पीस)", icon: "steelSet", category: "kitchen", price: 6500, starter: true },
  { id: "dinner", en: "Dinner set (33 pc)", hi: "डिनर सेट (33 पीस)", icon: "dinnerSet", category: "kitchen", price: 3800, starter: true },
  { id: "nonstick", en: "Non-stick cookware set", hi: "नॉन-स्टिक कुकवेयर सेट", icon: "cookware", category: "kitchen", price: 2800 },
  { id: "casserole", en: "Insulated casserole set", hi: "कैसरोल सेट", icon: "casserole", category: "kitchen", price: 1600 },
  { id: "masala", en: "Spice box (masala dabba)", hi: "मसाला डब्बा", icon: "spiceBox", category: "kitchen", price: 900 },
  { id: "glasses", en: "Glassware set (18 pc)", hi: "काँच के गिलास सेट", icon: "glassware", category: "kitchen", price: 1500 },
  { id: "idli", en: "Wet grinder (idli/dosa)", hi: "वेट ग्राइंडर", icon: "wetGrinder", category: "kitchen", price: 5500 },
  { id: "gasstove", en: "Glass-top gas stove (3 burner)", hi: "गैस चूल्हा (3 बर्नर)", icon: "gasStove", category: "kitchen", price: 5200 },
  { id: "teaset", en: "Tea and coffee mug set", hi: "चाय कप सेट", icon: "teaSet", category: "kitchen", price: 1100 },
  // Appliances
  { id: "airfryer", en: "Air fryer", hi: "एयर फ्रायर", icon: "airFryer", category: "appliances", price: 6500, starter: true },
  { id: "juicer", en: "Juicer mixer", hi: "जूसर मिक्सर", icon: "juicer", category: "appliances", price: 3500 },
  { id: "microwave", en: "Microwave oven", hi: "माइक्रोवेव ओवन", icon: "microwave", category: "appliances", price: 9500 },
  { id: "purifier", en: "Water purifier (RO)", hi: "वॉटर प्यूरीफायर (RO)", icon: "purifier", category: "appliances", price: 12000 },
  { id: "induction", en: "Induction cooktop", hi: "इंडक्शन चूल्हा", icon: "cooktop", category: "appliances", price: 2800 },
  { id: "kettle", en: "Electric kettle", hi: "इलेक्ट्रिक केतली", icon: "kettle", category: "appliances", price: 1200 },
  { id: "toaster", en: "Sandwich maker", hi: "सैंडविच मेकर", icon: "sandwichMaker", category: "appliances", price: 1800 },
  { id: "iron", en: "Steam iron", hi: "स्टीम प्रेस", icon: "iron", category: "appliances", price: 1700 },
  { id: "vacuum", en: "Vacuum cleaner", hi: "वैक्यूम क्लीनर", icon: "vacuum", category: "appliances", price: 7500 },
  { id: "washing", en: "Washing machine", hi: "वॉशिंग मशीन", icon: "washingMachine", category: "appliances", price: 24000 },
  { id: "tv", en: "Smart TV (43 inch)", hi: "स्मार्ट टीवी (43 इंच)", icon: "tv", category: "appliances", price: 28000 },
  // Bed & bath
  { id: "bedsheets", en: "Cotton bedsheet set (king)", hi: "कॉटन बेडशीट सेट", icon: "bed", category: "bedding", price: 2200, starter: true },
  { id: "comforter", en: "Comforter / quilt", hi: "रज़ाई / कंबल", icon: "quilt", category: "bedding", price: 3500 },
  { id: "towels", en: "Bath towel set", hi: "तौलिया सेट", icon: "towel", category: "bedding", price: 1800 },
  { id: "pillows", en: "Pillows (set of 4)", hi: "तकिया (4 का सेट)", icon: "pillow", category: "bedding", price: 1600 },
  { id: "mattress", en: "Orthopedic mattress", hi: "गद्दा (मैट्रेस)", icon: "mattress", category: "bedding", price: 16000 },
  // Home
  { id: "curtains", en: "Curtains (set of 4)", hi: "पर्दे (4 का सेट)", icon: "curtains", category: "home", price: 2400 },
  { id: "lamp", en: "Table lamp", hi: "टेबल लैंप", icon: "lamp", category: "home", price: 1500 },
  { id: "wallclock", en: "Wall clock", hi: "दीवार घड़ी", icon: "clock", category: "home", price: 1200 },
  { id: "carpet", en: "Carpet / dhurrie", hi: "कालीन / दरी", icon: "rug", category: "home", price: 4500 },
  { id: "plants", en: "Indoor plants with planters", hi: "गमलों के साथ पौधे", icon: "plants", category: "home", price: 1500 },
  // Travel
  { id: "luggage", en: "Luggage set (cabin + check-in)", hi: "ट्रॉली बैग सेट", icon: "luggage", category: "travel", price: 7500 },
  // Faith & prayer: only offered for the matching ceremony style
  { id: "thali", en: "Brass pooja thali set", hi: "पीतल की पूजा थाली", icon: "tray", category: "faith", price: 1800, traditions: ["hindu"] },
  { id: "mandir", en: "Wooden home mandir", hi: "लकड़ी का मंदिर", icon: "shrine", category: "faith", price: 6500, traditions: ["hindu"] },
  { id: "diya", en: "Brass diya pair", hi: "पीतल के दीये (जोड़ी)", icon: "oilLamp", category: "faith", price: 1400, traditions: ["hindu", "jain"] },
  { id: "silvercoin", en: "Silver coin", hi: "चाँदी का सिक्का", icon: "savings", category: "faith", price: 1500, traditions: ["hindu", "jain", "sikh"] },
  { id: "janamaz", en: "Prayer mat (janamaz)", hi: "जानमाज़", icon: "prayerMat", category: "faith", price: 1500, traditions: ["muslim"] },
  { id: "rehal", en: "Wooden Quran stand (rehal)", hi: "लकड़ी की रहल", icon: "bookStand", category: "faith", price: 1200, traditions: ["muslim"] },
  { id: "calligraphy", en: "Calligraphy wall art", hi: "कैलिग्राफ़ी वॉल आर्ट", icon: "frame", category: "faith", price: 2500, traditions: ["muslim"] },
  { id: "bible", en: "Family Bible", hi: "पारिवारिक बाइबल", icon: "book", category: "faith", price: 1500, traditions: ["christian"] },
  { id: "cross", en: "Wooden cross for the wall", hi: "दीवार के लिए लकड़ी का क्रॉस", icon: "cross", category: "faith", price: 1200, traditions: ["christian"] },
  { id: "candles", en: "Candle stand set", hi: "कैंडल स्टैंड सेट", icon: "candle", category: "faith", price: 1600, traditions: ["christian", "parsi"] },
  { id: "rumala", en: "Rumala sahib", hi: "रुमाला साहिब", icon: "cloth", category: "faith", price: 2100, traditions: ["sikh"] },
  { id: "gutka", en: "Gutka sahib with cover", hi: "गुटका साहिब (कवर सहित)", icon: "book", category: "faith", price: 800, traditions: ["sikh"] },
];

/** Items offered for a ceremony style: everyday items plus that style's faith items. */
export function catalogFor(tradition: string | null | undefined): CatalogItem[] {
  return CATALOG.filter((c) => !c.traditions || c.traditions.includes(tradition as Tradition));
}

export type FundTemplate = { id: string; en: string; hi: string; icon: string; target: number | null; descEn: string; descHi: string };

export const FUND_TEMPLATES: FundTemplate[] = [
  { id: "blessings", en: "Gifts & blessings", hi: "उपहार और आशीर्वाद", icon: "blessing", target: null, descEn: "Your blessings, in any amount.", descHi: "आपका आशीर्वाद, किसी भी राशि में।" },
  { id: "honeymoon", en: "Honeymoon fund", hi: "हनीमून फंड", icon: "honeymoon", target: 150000, descEn: "Help us make memories on our first trip together.", descHi: "हमारी पहली यात्रा को यादगार बनाने में साथ दें।" },
  { id: "home", en: "New home setup", hi: "नए घर की तैयारी", icon: "home", target: 200000, descEn: "For everything that turns a house into our home.", descHi: "हमारे घर को घर बनाने के लिए।" },
  { id: "fridge", en: "Fridge fund", hi: "फ्रिज फंड", icon: "fridge", target: 45000, descEn: "Chip in for our refrigerator.", descHi: "हमारे फ्रिज के लिए थोड़ा योगदान।" },
  { id: "furniture", en: "Furniture fund", hi: "फर्नीचर फंड", icon: "sofa", target: 100000, descEn: "A sofa and a dining table for hosting you.", descHi: "आपकी मेज़बानी के लिए सोफ़ा और डाइनिंग टेबल।" },
  { id: "gold", en: "Gold & savings", hi: "सोना और बचत", icon: "gold", target: null, descEn: "A little put away for a long future.", descHi: "लंबे भविष्य के लिए थोड़ी बचत।" },
  { id: "charity", en: "Donate in our name", hi: "हमारे नाम से दान", icon: "blessing", target: 51000, descEn: "We'll give this to a cause close to our hearts.", descHi: "यह राशि हम एक नेक काम में देंगे।" },
];

/** The "Gifts & blessings" fund takes the couple's own word for gift money, e.g. "Shagun & blessings". */
export function fundTitle(f: FundTemplate, lang: "en" | "hi", giftWord: string | null): string {
  if (f.id !== "blessings" || !giftWord) return lang === "hi" ? f.hi : f.en;
  return lang === "hi" ? `${giftWord} और आशीर्वाद` : `${giftWord} & blessings`;
}

const STORES: [RegExp, string][] = [
  [/amazon\.|amzn\./, "Amazon"],
  [/flipkart\.|fkrt\./, "Flipkart"],
  [/myntra\./, "Myntra"],
  [/pepperfry\./, "Pepperfry"],
  [/croma\./, "Croma"],
  [/ajio\./, "AJIO"],
  [/nykaa/, "Nykaa"],
  [/tatacliq\./, "Tata CLiQ"],
  [/reliancedigital\./, "Reliance Digital"],
  [/ikea\./, "IKEA"],
  [/urbanladder\./, "Urban Ladder"],
  [/meesho\./, "Meesho"],
  [/jiomart\./, "JioMart"],
  [/fabindia\./, "Fabindia"],
];

export function storeFromHost(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, "");
  for (const [re, name] of STORES) if (re.test(h)) return name;
  const base = h.split(".").slice(-2, -1)[0] || h;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
