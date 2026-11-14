import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Lang = "en" | "hi";

/** ₹1,23,456 — Indian digit grouping. */
export function inr(amount: number | null | undefined): string {
  if (amount == null) return "";
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/** Accepts 9876543210, 09876543210, +91 98765 43210 → +919876543210. Returns null when invalid. */
export function normalizePhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return "+91" + d;
}

export function prettyPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const d = phone.replace(/^\+91/, "");
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export function isValidUpiId(v: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(v.trim());
}

/** Shagun is given in amounts ending in 1 — the extra rupee is a blessing for continuity. */
export const SHAGUN_AMOUNTS = [501, 1101, 2101, 5101, 11001, 21001];

/** Nudges a round amount to the auspicious "+1" (1000 → 1001). Leaves others untouched. */
export function toShagunAmount(n: number): number {
  if (n >= 100 && n % 10 === 0) return n + 1;
  return n;
}

export function shagunSuggestions(target?: number | null): number[] {
  if (!target || target >= 5000) return SHAGUN_AMOUNTS.slice(0, 5);
  return [101, 251, 501, 1101, 2101].filter((a) => a <= Math.max(target, 501));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

/** "Priya Sharma" + "Arjun" → "priya-arjun". Short enough (≤ 29) to leave room for a collision suffix. */
export function slugBase(a: string, b: string): string {
  const part = (n: string) => slugify(n).split("-")[0].slice(0, 14);
  return [part(a), part(b)].filter(Boolean).join("-") || "shaadi";
}

export function formatDate(iso: string | null | undefined, lang: Lang = "en"): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function buildUpiLink(p: { pa: string; pn: string; am?: number; tn?: string; tr?: string }): string {
  const q = new URLSearchParams({ pa: p.pa, pn: p.pn, cu: "INR" });
  if (p.am) q.set("am", p.am.toFixed(2));
  if (p.tn) q.set("tn", p.tn.slice(0, 60));
  if (p.tr) q.set("tr", p.tr);
  return "upi://pay?" + q.toString().replace(/\+/g, "%20");
}

export function whatsappLink(text: string, phone?: string | null): string {
  const to = phone ? phone.replace(/\D/g, "") : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export const THEMES = {
  sindoor: { name: "Sindoor", nameHi: "सिंदूर", primary: "#9B1C31", soft: "#F9E7E6", deep: "#6B1020" },
  marigold: { name: "Marigold", nameHi: "गेंदा", primary: "#A84B06", soft: "#FCEFD9", deep: "#6E3104" },
  mehendi: { name: "Mehendi", nameHi: "मेहंदी", primary: "#1C6B4C", soft: "#E3F1E9", deep: "#0F4430" },
  peacock: { name: "Peacock", nameHi: "मोरपंख", primary: "#1B4F7C", soft: "#E3EDF7", deep: "#0E3150" },
} as const;
export type ThemeKey = keyof typeof THEMES;
export function themeOf(key: string | null | undefined) {
  return THEMES[(key as ThemeKey) in THEMES ? (key as ThemeKey) : "sindoor"];
}
