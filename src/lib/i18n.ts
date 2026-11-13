import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./utils";

export const LANG_COOKIE = "giftr_lang";

export async function getLang(): Promise<Lang> {
  return (await cookies()).get(LANG_COOKIE)?.value === "hi" ? "hi" : "en";
}

export type Tr = (en: string, hi: string) => string;

/**
 * Bilingual strings live next to where they're used: tr("Reserve", "रिज़र्व करें").
 * Both languages are type-checked as present at every call site.
 */
export async function getTr(): Promise<{ tr: Tr; lang: Lang }> {
  const lang = await getLang();
  return { lang, tr: (en, hi) => (lang === "hi" ? hi : en) };
}
