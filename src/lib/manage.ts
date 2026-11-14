import "server-only";
import { getManagedRegistry, getUser } from "./auth";
import { CATALOG, FUND_TEMPLATES, fundTitle } from "./catalog";
import { newId } from "./ids";

/** Resolves the signed-in user's right to manage a registry (owner or family). */
export async function manage(slug: string) {
  const user = await getUser();
  if (!user) return null;
  const m = await getManagedRegistry(slug, user);
  return m ? { user, ...m } : null;
}

export function seedRows(registryId: string, catalogIds: string[], fundIds: string[], lang: "en" | "hi", giftWord: string | null, startAt = 0) {
  let position = startAt;
  const funds = FUND_TEMPLATES.filter((f) => fundIds.includes(f.id)).map((f) => ({
    id: newId(),
    registryId,
    kind: "fund",
    title: fundTitle(f, lang, giftWord),
    description: lang === "hi" ? f.descHi : f.descEn,
    icon: f.icon,
    category: "fund",
    price: f.target,
    position: position++,
  }));
  const products = CATALOG.filter((c) => catalogIds.includes(c.id)).map((c) => ({
    id: newId(),
    registryId,
    kind: "product",
    title: lang === "hi" ? c.hi : c.en,
    icon: c.icon,
    category: c.category,
    price: c.price,
    position: position++,
  }));
  return [...funds, ...products];
}
