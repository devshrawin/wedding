import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { storeFromHost } from "./catalog";

export type LinkPreview = {
  url: string;
  store: string;
  title: string | null;
  image: string | null;
  price: number | null;
  /** false when the store blocked us and we only guessed from the URL */
  fetched: boolean;
};

const UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 7000;

// ── SSRF guard ────────────────────────────────────────────────────────

export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    if (x.startsWith("::ffff:")) return isPrivateIp(x.slice(7));
    return x === "::" || x === "::1" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") ||
      x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb") || x.startsWith("ff");
  }
  return true;
}

export function parseSafeUrl(raw: string): URL | null {
  let s = raw.trim();
  // People paste "Check this out https://amzn.in/…" straight from the share sheet.
  const m = s.match(/https?:\/\/[^\s]+/i);
  if (m) s = m[0];
  else if (/^[\w-]+(\.[\w-]+)+/.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const host = u.hostname.replace(/^\[|\]$/g, "");
    if (isIP(host) && isPrivateIp(host)) return null;
    if (!host.includes(".") || /(^|\.)(localhost|local|internal|lan|home|corp)$/i.test(host)) return null;
    return u;
  } catch {
    return null;
  }
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("blocked");
    return;
  }
  const addrs = await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked");
}

async function safeFetch(start: URL): Promise<{ html: string; finalUrl: URL }> {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(url.hostname);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      const next = loc ? parseSafeUrl(new URL(loc, url).toString()) : null;
      if (!next) throw new Error("bad redirect");
      url = next;
      continue;
    }
    if (!res.ok) throw new Error("http " + res.status);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) throw new Error("not html");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("no body");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    reader.cancel().catch(() => {});
    return { html: Buffer.concat(chunks).toString("utf8"), finalUrl: url };
  }
  throw new Error("too many redirects");
}

// ── HTML extraction (regex-based; no DOM dependency) ──────────────────

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, names: string[]): string | null {
  for (const name of names) {
    const n = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${n}["'][^>]*?content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:property|name|itemprop)=["']${n}["']`, "i");
    const m = html.match(re1) || html.match(re2);
    if (m?.[1]) return decode(m[1]);
  }
  return null;
}

export function parsePrice(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[₹,\s]|Rs\.?|INR/gi, "");
  const m = s.match(/\d+(\.\d+)?/);
  if (!m) return null;
  const n = Math.round(parseFloat(m[0]));
  return n > 0 && n < 50_000_000 ? n : null;
}

type Json = Record<string, unknown>;

function findProduct(node: unknown, depth = 0): Json | null {
  if (!node || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const p = findProduct(n, depth + 1);
      if (p) return p;
    }
    return null;
  }
  if (typeof node === "object") {
    const o = node as Json;
    const t = o["@type"];
    if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return o;
    if (o["@graph"]) return findProduct(o["@graph"], depth + 1);
    if (o.mainEntity) return findProduct(o.mainEntity, depth + 1);
  }
  return null;
}

function jsonLd(html: string): { title?: string; image?: string; price?: number } {
  const out: { title?: string; image?: string; price?: number } = {};
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const p = findProduct(JSON.parse(m[1].trim()));
      if (!p) continue;
      if (typeof p.name === "string") out.title ??= decode(p.name);
      const img = Array.isArray(p.image) ? p.image[0] : p.image;
      if (typeof img === "string") out.image ??= img;
      else if (img && typeof img === "object" && typeof (img as Json).url === "string") out.image ??= (img as Json).url as string;
      const offers = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as Json | undefined;
      if (offers) {
        const spec = offers.priceSpecification as Json | undefined;
        const price = parsePrice(offers.price ?? offers.lowPrice ?? spec?.price);
        if (price) out.price ??= price;
      }
    } catch {
      /* malformed JSON-LD is common; skip */
    }
  }
  return out;
}

function cleanTitle(title: string, store: string): string {
  let t = title
    .replace(/^(buy|shop)\s+/i, "")
    .replace(/\s*[|:–—-]\s*(amazon|flipkart|myntra|pepperfry|croma|ajio|nykaa|tata ?cliq|ikea|meesho|jiomart)[^|]*$/i, "")
    .replace(/\s+(online )?at (best|low|lowest) prices?.*$/i, "")
    .replace(/\s*:\s*Amazon\.in.*$/i, "")
    .replace(/^Amazon\.in\s*[:|-]\s*/i, "")
    .replace(/\s+online\s*$/i, "");
  if (store) t = t.replace(new RegExp(`\\s*[|–—-]\\s*${store}\\s*$`, "i"), "");
  t = t.trim();
  return t.length > 140 ? t.slice(0, 137).trimEnd() + "…" : t;
}

/** Best-effort title from the URL itself, e.g. /Prestige-Iris-Mixer-Grinder/dp/B0… */
export function titleFromUrl(u: URL): string | null {
  const segs = u.pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
  const skip = /^(dp|gp|p|product|products|buy|itm[a-z0-9]*|[A-Z0-9]{10}|\d+|ref=.*|s|d|in|en)$/;
  const best = segs.filter((s) => !skip.test(s) && /[a-zA-Z]{3,}/.test(s) && s.includes("-")).sort((a, b) => b.length - a.length)[0];
  if (!best) return null;
  const words = best.replace(/\.html?$/, "").split(/[-_]+/).filter(Boolean);
  if (words.length < 2) return null;
  return words.map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ").slice(0, 140);
}

export function extractFromHtml(html: string, url: URL): Omit<LinkPreview, "url" | "fetched"> {
  const store = storeFromHost(url.hostname);
  const ld = jsonLd(html);

  let title =
    ld.title ??
    meta(html, ["og:title", "twitter:title"]) ??
    (html.match(/<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? null) ??
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null);
  title = title ? cleanTitle(decode(title.replace(/<[^>]+>/g, "")), store) : null;

  let image =
    ld.image ??
    meta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]) ??
    html.match(/data-old-hires=["'](https:[^"']+)["']/i)?.[1] ??
    html.match(/id=["']landingImage["'][^>]+src=["'](https:[^"']+)["']/i)?.[1] ??
    null;
  if (image) {
    try {
      const abs = new URL(decode(image), url);
      image = abs.protocol === "https:" || abs.protocol === "http:" ? abs.toString().replace(/^http:/, "https:") : null;
    } catch {
      image = null;
    }
  }

  const price =
    ld.price ??
    parsePrice(meta(html, ["product:price:amount", "og:price:amount", "twitter:data1", "price"])) ??
    parsePrice(html.match(/class=["'][^"']*a-price-whole[^"']*["'][^>]*>\s*([\d,]+)/i)?.[1]) ??
    parsePrice(html.match(/"(?:sellingPrice|finalPrice|discountedPrice|price)"\s*:\s*\{?\s*"?(?:value"?\s*:\s*)?"?(\d[\d,.]*)/i)?.[1]) ??
    null;

  return { store, title: title || null, image, price };
}

export async function fetchLinkPreview(raw: string): Promise<LinkPreview | null> {
  const url = parseSafeUrl(raw);
  if (!url) return null;
  const store = storeFromHost(url.hostname);
  try {
    const { html, finalUrl } = await safeFetch(url);
    const data = extractFromHtml(html, finalUrl);
    // Captcha / bot walls and generic landing pages give useless titles.
    const bare = (data.title ?? "").replace(/\.(in|com|co\.in)$/i, "").trim().toLowerCase();
    const junk =
      !data.title ||
      bare.length < 6 ||
      bare === data.store.toLowerCase() ||
      /robot check|captcha|access denied|are you a human|just a moment|page not found|sign in|something went wrong|online shopping/i.test(data.title);
    if (junk) return { url: finalUrl.toString(), store: data.store, title: titleFromUrl(finalUrl) ?? titleFromUrl(url), image: null, price: null, fetched: false };
    return { url: finalUrl.toString(), ...data, fetched: true };
  } catch {
    return { url: url.toString(), store, title: titleFromUrl(url), image: null, price: null, fetched: false };
  }
}
