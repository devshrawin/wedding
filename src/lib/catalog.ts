export type Category = { key: string; en: string; hi: string; emoji: string };

export const CATEGORIES: Category[] = [
  { key: "kitchen", en: "Kitchen", hi: "रसोई", emoji: "🍳" },
  { key: "appliances", en: "Appliances", hi: "उपकरण", emoji: "🔌" },
  { key: "home", en: "Home & Decor", hi: "घर और सजावट", emoji: "🏡" },
  { key: "bedding", en: "Bed & Bath", hi: "बिस्तर और स्नान", emoji: "🛏️" },
  { key: "pooja", en: "Pooja", hi: "पूजा", emoji: "🪔" },
  { key: "travel", en: "Travel", hi: "यात्रा", emoji: "🧳" },
  { key: "fund", en: "Shagun Funds", hi: "शगुन फंड", emoji: "💝" },
  { key: "other", en: "Other", hi: "अन्य", emoji: "🎁" },
];

export function categoryOf(key: string): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export type CatalogItem = {
  id: string;
  en: string;
  hi: string;
  emoji: string;
  category: string;
  price: number; // typical price in rupees — couples can edit
  starter?: boolean;
};

/** Curated Indian wedding essentials — the things every new home actually needs. */
export const CATALOG: CatalogItem[] = [
  // Kitchen
  { id: "mixer", en: "Mixer Grinder (750W)", hi: "मिक्सर ग्राइंडर (750W)", emoji: "🌀", category: "kitchen", price: 4500, starter: true },
  { id: "cooker", en: "Pressure Cooker Set", hi: "प्रेशर कुकर सेट", emoji: "🍲", category: "kitchen", price: 3200, starter: true },
  { id: "steel", en: "Stainless Steel Utensil Set (51 pc)", hi: "स्टील बर्तन सेट (51 पीस)", emoji: "🥘", category: "kitchen", price: 6500, starter: true },
  { id: "dinner", en: "Dinner Set (Opalware, 33 pc)", hi: "डिनर सेट (33 पीस)", emoji: "🍽️", category: "kitchen", price: 3800, starter: true },
  { id: "nonstick", en: "Non-stick Cookware Set", hi: "नॉन-स्टिक कुकवेयर सेट", emoji: "🍳", category: "kitchen", price: 2800 },
  { id: "casserole", en: "Insulated Casserole Set", hi: "कैसरोल सेट", emoji: "🥣", category: "kitchen", price: 1600 },
  { id: "masala", en: "Masala Dabba (Spice Box)", hi: "मसाला डब्बा", emoji: "🧂", category: "kitchen", price: 900 },
  { id: "glasses", en: "Glassware Set (18 pc)", hi: "काँच के गिलास सेट", emoji: "🥛", category: "kitchen", price: 1500 },
  { id: "idli", en: "Wet Grinder (Idli/Dosa)", hi: "वेट ग्राइंडर", emoji: "🫓", category: "kitchen", price: 5500 },
  { id: "gasstove", en: "Glass-top Gas Stove (3 burner)", hi: "गैस चूल्हा (3 बर्नर)", emoji: "🔥", category: "kitchen", price: 5200 },
  { id: "teaset", en: "Tea / Coffee Mug Set", hi: "चाय कप सेट", emoji: "☕", category: "kitchen", price: 1100 },
  // Appliances
  { id: "airfryer", en: "Air Fryer", hi: "एयर फ्रायर", emoji: "🍟", category: "appliances", price: 6500, starter: true },
  { id: "juicer", en: "Juicer Mixer", hi: "जूसर मिक्सर", emoji: "🧃", category: "appliances", price: 3500 },
  { id: "microwave", en: "Microwave Oven", hi: "माइक्रोवेव ओवन", emoji: "📟", category: "appliances", price: 9500 },
  { id: "purifier", en: "Water Purifier (RO)", hi: "वॉटर प्यूरीफायर (RO)", emoji: "💧", category: "appliances", price: 12000 },
  { id: "induction", en: "Induction Cooktop", hi: "इंडक्शन चूल्हा", emoji: "♨️", category: "appliances", price: 2800 },
  { id: "kettle", en: "Electric Kettle", hi: "इलेक्ट्रिक केतली", emoji: "🫖", category: "appliances", price: 1200 },
  { id: "toaster", en: "Sandwich Maker", hi: "सैंडविच मेकर", emoji: "🥪", category: "appliances", price: 1800 },
  { id: "iron", en: "Steam Iron", hi: "स्टीम प्रेस", emoji: "👔", category: "appliances", price: 1700 },
  { id: "vacuum", en: "Vacuum Cleaner", hi: "वैक्यूम क्लीनर", emoji: "🧹", category: "appliances", price: 7500 },
  { id: "washing", en: "Washing Machine", hi: "वॉशिंग मशीन", emoji: "🧺", category: "appliances", price: 24000 },
  { id: "tv", en: "Smart TV (43 inch)", hi: "स्मार्ट टीवी (43 इंच)", emoji: "📺", category: "appliances", price: 28000 },
  // Bedding
  { id: "bedsheets", en: "Cotton Bedsheet Set (King)", hi: "कॉटन बेडशीट सेट", emoji: "🛏️", category: "bedding", price: 2200, starter: true },
  { id: "comforter", en: "Comforter / Razai", hi: "रज़ाई / कंबल", emoji: "🧣", category: "bedding", price: 3500 },
  { id: "towels", en: "Bath Towel Set", hi: "तौलिया सेट", emoji: "🧖", category: "bedding", price: 1800 },
  { id: "pillows", en: "Pillows (Set of 4)", hi: "तकिया (4 का सेट)", emoji: "💤", category: "bedding", price: 1600 },
  { id: "mattress", en: "Orthopedic Mattress", hi: "गद्दा (मैट्रेस)", emoji: "🛌", category: "bedding", price: 16000 },
  // Home
  { id: "curtains", en: "Curtains (Set of 4)", hi: "पर्दे (4 का सेट)", emoji: "🪟", category: "home", price: 2400 },
  { id: "lamp", en: "Table Lamp", hi: "टेबल लैंप", emoji: "💡", category: "home", price: 1500 },
  { id: "wallclock", en: "Wall Clock", hi: "दीवार घड़ी", emoji: "🕰️", category: "home", price: 1200 },
  { id: "carpet", en: "Carpet / Dhurrie", hi: "कालीन / दरी", emoji: "🧶", category: "home", price: 4500 },
  { id: "plants", en: "Indoor Plants with Planters", hi: "गमलों के साथ पौधे", emoji: "🪴", category: "home", price: 1500 },
  // Pooja
  { id: "thali", en: "Brass Pooja Thali Set", hi: "पीतल की पूजा थाली", emoji: "🪔", category: "pooja", price: 1800, starter: true },
  { id: "mandir", en: "Wooden Home Mandir", hi: "लकड़ी का मंदिर", emoji: "🛕", category: "pooja", price: 6500 },
  { id: "diya", en: "Brass Diya / Samai (Pair)", hi: "पीतल के दीये (जोड़ी)", emoji: "🕯️", category: "pooja", price: 1400 },
  { id: "silvercoin", en: "Silver Coin (Lakshmi-Ganesh)", hi: "चाँदी का सिक्का (लक्ष्मी-गणेश)", emoji: "🪙", category: "pooja", price: 1500 },
  // Travel
  { id: "luggage", en: "Luggage Set (Cabin + Check-in)", hi: "ट्रॉली बैग सेट", emoji: "🧳", category: "travel", price: 7500 },
];

export type FundTemplate = { id: string; en: string; hi: string; emoji: string; target: number | null; descEn: string; descHi: string };

export const FUND_TEMPLATES: FundTemplate[] = [
  { id: "shagun", en: "Shagun & Blessings", hi: "शगुन और आशीर्वाद", emoji: "💝", target: null, descEn: "Your blessings, in any amount.", descHi: "आपका आशीर्वाद, किसी भी राशि में।" },
  { id: "honeymoon", en: "Honeymoon Fund", hi: "हनीमून फंड", emoji: "✈️", target: 150000, descEn: "Help us make memories on our first trip together.", descHi: "हमारी पहली यात्रा को यादगार बनाने में साथ दें।" },
  { id: "home", en: "New Home Setup", hi: "नए घर की तैयारी", emoji: "🏡", target: 200000, descEn: "For everything that turns a house into our home.", descHi: "हमारे घर को घर बनाने के लिए।" },
  { id: "fridge", en: "Fridge Fund", hi: "फ्रिज फंड", emoji: "🧊", target: 45000, descEn: "Chip in for our refrigerator.", descHi: "हमारे फ्रिज के लिए थोड़ा योगदान।" },
  { id: "furniture", en: "Furniture Fund", hi: "फर्नीचर फंड", emoji: "🛋️", target: 100000, descEn: "A sofa and a dining table for hosting you.", descHi: "आपकी मेज़बानी के लिए सोफ़ा और डाइनिंग टेबल।" },
  { id: "gold", en: "Gold & Savings", hi: "सोना और बचत", emoji: "🪙", target: null, descEn: "A little gold for a long future.", descHi: "लंबे भविष्य के लिए थोड़ा सोना।" },
  { id: "charity", en: "Daan in Our Name", hi: "हमारे नाम से दान", emoji: "🙏", target: 51000, descEn: "We'll donate this to a cause close to our hearts.", descHi: "यह राशि हम एक नेक काम में दान करेंगे।" },
];

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
