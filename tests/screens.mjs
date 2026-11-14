// Captures a curated set of phone screens with realistic demo data.
// Usage: BASE=http://localhost:3000 OUT=./screens node tests/screens.mjs   (server in demo mode, fresh database)
import { createRequire } from "node:module";
import fs from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "screens";
fs.mkdirSync(OUT, { recursive: true });

const PHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
};
const browser = await chromium.launch();
const shots = [];
const settle = (p) => p.waitForTimeout(450);
async function shot(page, id, title, note, opts = {}) {
  await settle(page);
  await page.screenshot({ path: `${OUT}/${id}.jpg`, type: "jpeg", quality: 82, fullPage: !!opts.full });
  shots.push({ id, title, note, group: opts.group ?? "Couple" });
  console.log("•", id);
}
let phoneSeq = 0;
const nextPhone = () => `98${String(70000000 + ++phoneSeq * 1371).padStart(8, "0")}`;

async function login(page, next = "/new") {
  await page.goto(`${BASE}/login?next=${encodeURIComponent(next)}`);
  await page.getByPlaceholder("98765 43210").fill(nextPhone());
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByRole("button", { name: "Use code" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

async function pickStyle(page, name) {
  await page.getByRole("combobox", { name: "Ceremony style" }).click();
  await page.getByRole("option", { name }).click();
  await page.getByRole("listbox", { name: "Ceremony style" }).waitFor({ state: "hidden" });
}

let samplePhoto = null;
async function makeSamplePhoto() {
  // A soft golden-hour abstract stands in for a couple photo in the demo.
  const p = await browser.newPage({ viewport: { width: 720, height: 720 } });
  await p.setContent(`<body style="margin:0;width:720px;height:720px;background:
    radial-gradient(260px 260px at 30% 35%, rgba(255,214,140,.95), transparent 70%),
    radial-gradient(200px 200px at 72% 30%, rgba(255,170,120,.8), transparent 70%),
    radial-gradient(320px 220px at 50% 85%, rgba(160,40,70,.75), transparent 70%),
    linear-gradient(160deg,#f6c27a,#d9705a 55%,#7a2440)">
    ${Array.from({ length: 26 }, (_, i) => `<i style="position:absolute;left:${(i * 137) % 700}px;top:${(i * 89) % 700}px;width:${18 + (i % 5) * 9}px;height:${18 + (i % 5) * 9}px;border-radius:50%;background:rgba(255,240,210,${0.18 + (i % 4) * 0.08})"></i>`).join("")}</body>`);
  samplePhoto = await p.screenshot({ type: "jpeg", quality: 88 });
  await p.close();
}

async function createRegistry(page, { one, two, date, city, colour, style, word, capture, photo }) {
  await page.getByPlaceholder("Ananya").fill(one);
  await page.getByPlaceholder("Rohan").fill(two);
  await page.locator('input[type="date"]').fill(date);
  await page.getByPlaceholder("Jaipur").fill(city);
  if (colour) await page.getByRole("radio", { name: colour }).click();
  if (photo) {
    await page.locator('input[type="file"]').first().setInputFiles({ name: "couple.jpg", mimeType: "image/jpeg", buffer: samplePhoto });
    await page.waitForTimeout(700);
  }
  if (style) await pickStyle(page, style);
  if (word) await page.getByLabel("Your word for gift money").fill(word);
  if (capture) await capture("wizard-1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  if (capture) await capture("wizard-2");
  await page.getByText("Honeymoon fund", { exact: true }).click();
  await page.getByRole("button", { name: /Create registry with/ }).click({ timeout: 8000 }).catch(async (e) => {
    await page.screenshot({ path: `${OUT}/DEBUG-create.png` });
    throw e;
  });
  await page.waitForURL(/\/dashboard\/[a-z0-9-]+/);
  return new URL(page.url()).pathname.split("/")[2];
}

async function setUpi(page, slug, id) {
  await page.goto(`${BASE}/dashboard/${slug}/settings`);
  await page.getByPlaceholder("ananya@okhdfcbank").fill(id);
  await page.getByRole("button", { name: "Save UPI details" }).click();
  await page.getByText("Saved").first().waitFor();
}

async function guestGives(browserCtx, slug, { reserve, name, phone, message, amount, anonymous }) {
  const g = await browserCtx.newPage();
  await g.goto(`${BASE}/r/${slug}`);
  if (reserve) {
    await g.getByRole("button", { name: reserve }).first().click();
    await g.getByRole("button", { name: /I'll gift this/ }).click();
    await g.getByPlaceholder(/Sunita Sharma/).fill(name);
    if (phone) await g.getByPlaceholder("98765 43210").fill(phone);
    if (message) await g.getByLabel("Blessing for the couple").fill(message);
    await g.getByRole("button", { name: /Confirm/ }).click();
    await g.getByRole("heading", { name: /yours to gift/ }).waitFor();
  }
  if (amount) {
    await g.goto(`${BASE}/r/${slug}`);
    await g.getByRole("button", { name: /^Send / }).first().click();
    await g.getByLabel(/Other amount/).fill(String(amount));
    if (anonymous) await g.getByLabel("Give anonymously").check();
    else {
      await g.getByPlaceholder(/Sunita Sharma/).fill(name);
      if (phone) await g.getByPlaceholder("98765 43210").fill(phone);
    }
    if (message) await g.getByLabel("Blessing for the couple").fill(message);
    await g.getByRole("button", { name: /by UPI/ }).first().click();
    await g.getByRole("button", { name: /I've paid/ }).click();
    await g.getByRole("heading", { name: /Thank you/ }).waitFor();
  }
  await g.close();
}

await makeSamplePhoto();

// ── 1. Neutral couple: the default experience ─────────────────────────
const coupleCtx = await browser.newContext(PHONE);
const cp = await coupleCtx.newPage();
await cp.goto(BASE);
await shot(cp, "01-landing", "Landing page", "Neutral promise: a gift registry for any Indian wedding.", { group: "Start" });
await cp.goto(`${BASE}/login`);
await shot(cp, "02-login", "Sign in with phone", "One-time code; demo mode shows it on screen.", { group: "Start" });
await login(cp);
const slug = await createRegistry(cp, {
  one: "Ananya",
  two: "Rohan",
  date: "2027-02-12",
  city: "Pune",
  colour: "Peacock",
  photo: true,
  capture: async (id) => {
    if (id === "wizard-1") {
      await cp.getByRole("combobox", { name: "Ceremony style" }).scrollIntoViewIfNeeded();
      await shot(cp, "03-wizard-names", "Step 1: who's getting married", "Ceremony style is optional and set to None by default.", { group: "Start" });
    } else await shot(cp, "04-wizard-wishes", "Step 2: pick wishes", "Line icons for every essential. No faith items unless a style is chosen.", { group: "Start" });
  },
});
await setUpi(cp, slug, "ananya.rohan@okhdfcbank");

// Own gift with an icon, in a section the couple names
await cp.goto(`${BASE}/dashboard/${slug}/gifts`);
await cp.getByRole("button", { name: "Add", exact: true }).click();
await shot(cp, "07-add-menu", "Add to the wishlist", "Paste a link, add your own gift, pick essentials, or open a cash fund.");
await cp.getByText("Add a gift yourself").click();
await cp.getByLabel("Gift name").fill("Handmade bookshelf");
await cp.getByLabel("Price (₹)").fill("8999");
await cp.getByRole("radio", { name: "Education" }).click();
await cp.getByRole("combobox", { name: "Section" }).click();
await cp.getByRole("option", { name: /New section/ }).click();
await cp.getByRole("listbox", { name: "Section" }).waitFor({ state: "hidden" });
await cp.getByLabel("New section name").fill("Reading corner");
await cp.getByRole("button", { name: "Use", exact: true }).click();
await cp.getByRole("radio", { name: "Education" }).scrollIntoViewIfNeeded();
await shot(cp, "08-own-gift", "Your own gift", "Pick an icon (or upload a photo) and file it under a section you name.");
await cp.getByRole("button", { name: "Add to wishlist" }).click();
await cp.getByText("Added to your wishlist").first().waitFor();
await cp.getByText("Air fryer", { exact: true }).click();
await cp.getByLabel("Let guests chip in").check();
await cp.getByRole("button", { name: "Save changes" }).click();
await cp.getByText("Saved").first().waitFor();
await cp.reload();
await shot(cp, "06-wishlist", "The wishlist", "Funds and gifts, each with a consistent line icon.");

// Guests
const guestCtx = await browser.newContext(PHONE);
const gp = await guestCtx.newPage();
await gp.goto(`${BASE}/r/${slug}`);
await shot(gp, "10-guest-top", "Guest page", "Neutral greeting by default: \"We're getting married\".", { group: "Guest" });
await gp.getByRole("heading", { name: "Gift wishlist" }).scrollIntoViewIfNeeded();
await gp.evaluate(() => window.scrollBy(0, -80));
await shot(gp, "11-guest-list", "Gift wishlist", "Filters, chip-in badges and line icons.", { group: "Guest" });
await gp.getByRole("button", { name: /Pressure cooker/ }).first().click();
await shot(gp, "12-guest-gift", "Reserve a gift", "One tap marks it as yours, so nobody brings the same thing.", { group: "Guest" });
await gp.getByRole("button", { name: /I'll gift this/ }).click();
await gp.getByPlaceholder(/Sunita Sharma/).fill("Sunita Bua");
await gp.getByPlaceholder("98765 43210").fill("9812345678");
await gp.getByLabel("Blessing for the couple").fill("Khush raho!");
await gp.getByRole("button", { name: /Confirm/ }).click();
await gp.getByRole("heading", { name: /yours to gift/ }).waitFor();
await gp.waitForTimeout(150);
await gp.screenshot({ path: `${OUT}/12b-guest-reserved.jpg`, type: "jpeg", quality: 82 });
shots.push({ id: "12b-guest-reserved", title: "Gift reserved", note: "The gift box opens and marigold petals burst (caught mid-animation).", group: "Moments" });
console.log("• 12b-guest-reserved");
await gp.getByRole("button", { name: "Done" }).click();
await gp.getByRole("button", { name: "Send gift" }).first().click();
await gp.getByRole("button", { name: "₹1,101" }).click();
await gp.getByPlaceholder(/Sunita Sharma/).fill("Meera Kulkarni");
await shot(gp, "13-guest-amount", "Send a cash gift", "Suggested amounts, any amount, or give anonymously.", { group: "Guest" });
await gp.getByRole("button", { name: /Pay ₹1,101 by UPI/ }).click();
await gp.getByAltText("UPI QR code").waitFor();
await shot(gp, "14-guest-upi", "Pay by UPI", "Opens any UPI app, or scan the QR. Optional screenshot for the couple.", { group: "Guest" });
await gp.getByRole("button", { name: /I've paid/ }).click();
await gp.getByRole("heading", { name: /Thank you/ }).waitFor();
await gp.waitForTimeout(250);
await gp.screenshot({ path: `${OUT}/15-guest-done.jpg`, type: "jpeg", quality: 82 });
shots.push({ id: "15-guest-done", title: "Gift sent", note: "A tick draws itself and petals shower for about a second.", group: "Moments" });
console.log("• 15-guest-done");

const g2 = await browser.newContext(PHONE);
await guestGives(g2, slug, { amount: 2100, anonymous: true, message: "Many blessings to you both" });

// Couple sees it
await cp.goto(`${BASE}/dashboard/${slug}`);
await shot(cp, "05-dashboard", "Couple dashboard", "Totals, days to go, and gifts waiting for confirmation.");
await cp.goto(`${BASE}/dashboard/${slug}/received`);
await cp.getByRole("button", { name: "Yes, received" }).first().click();
await cp.getByText("Confirmed").first().waitFor();
await cp.reload();
await shot(cp, "16-received", "Everything received", "Confirm UPI gifts, add cash envelopes, send thank-yous.");
await cp.getByRole("button", { name: "Say thank you" }).first().click();
await shot(cp, "17-thank-you", "Thank-you note", "Warm, respectful or playful; English or Hindi; one tap to WhatsApp.");
await cp.keyboard.press("Escape");
await cp.goto(`${BASE}/dashboard/${slug}/ledger`);
await shot(cp, "18-ledger", "Gift ledger", "Plain by default; print or save as PDF, or export CSV.", { full: true });
await cp.goto(`${BASE}/dashboard/${slug}/share`);
const studio = async (name, key, id, title, note) => {
  await cp.getByRole("radio", { name: new RegExp(`^${name}`) }).click();
  await cp.locator(`canvas[data-ready="1"][data-design="${key}"]`).waitFor({ timeout: 15000 });
  await cp.locator("canvas[data-design]").scrollIntoViewIfNeeded();
  await cp.evaluate(() => window.scrollBy(0, -140));
  await shot(cp, id, title, note, { group: "QR cards" });
};
await studio("Seal", "seal", "30-qr-seal", "Seal", "Your names run around a round seal; initials in the centre of the code.");
await studio("Arch", "arch", "31-qr-arch", "Arch", "Under an arch with a string of lights.");
await studio("Floral", "floral", "32-qr-floral", "Floral", "Marigold sprigs in the corners.");
await studio("Garden art", "garden", "33-qr-garden", "Garden art", "Code in rounded blocks, faint flowers in the gaps.");
await studio("Photo art", "photo", "34-qr-photo", "Photo art", "Your photo across the top and woven faintly under the code (sample photo shown).");
await cp.getByRole("radio", { name: "Status", exact: true }).click();
await cp.getByRole("radio", { name: /^Seal/ }).click();
await cp.locator('canvas[data-ready="1"][data-design="seal"][data-format="status"]').waitFor({ timeout: 15000 });
await cp.locator("canvas[data-design]").scrollIntoViewIfNeeded();
await cp.evaluate(() => window.scrollBy(0, -140));
await shot(cp, "35-qr-status", "WhatsApp Status size", "Tall format; also exports as a 5-second animated video.", { group: "QR cards" });
// Full-resolution exports of each design, for the gallery
for (const [name, key] of [["Seal", "seal"], ["Arch", "arch"], ["Floral", "floral"], ["Minimal", "minimal"], ["Garden art", "garden"], ["Photo art", "photo"]]) {
  await cp.getByRole("radio", { name: "Post", exact: true }).click();
  await cp.getByRole("radio", { name: new RegExp(`^${name}`) }).click();
  const sel = `canvas[data-ready="1"][data-design="${key}"][data-format="card"]`;
  await cp.locator(sel).waitFor({ timeout: 15000 });
  const url = await cp.evaluate((sel) => {
    const src = document.querySelector(sel);
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 900;
    c.getContext("2d").drawImage(src, 0, 0, 720, 900);
    return c.toDataURL("image/jpeg", 0.86);
  }, sel);
  fs.writeFileSync(`${OUT}/card-${key}.jpg`, Buffer.from(url.split(",")[1], "base64"));
}
await cp.goto(`${BASE}/dashboard/${slug}/settings#ceremony`);
await pickStyle(cp, "Sikh (Anand Karaj)");
await cp.getByLabel("Greeting above your names").scrollIntoViewIfNeeded();
await shot(cp, "20-settings-style", "Ceremony style & wording", "A style only suggests words. Every field can be edited or cleared.");

// ── 2. Nikah ──────────────────────────────────────────────────────────
const nikahCtx = await browser.newContext(PHONE);
const np = await nikahCtx.newPage();
await login(np);
const nikah = await createRegistry(np, {
  one: "Zoya",
  two: "Arman",
  date: "2027-01-24",
  city: "Lucknow",
  colour: "Emerald",
  style: "Muslim (Nikah)",
  word: "Salami",
  capture: async (id) => {
    if (id === "wizard-2") {
      await np.getByText("Faith & prayer").scrollIntoViewIfNeeded();
      await shot(np, "21-nikah-catalog", "Faith items for a Nikah", "Only shown because the couple picked this style.", { group: "Ceremony styles" });
    }
  },
});
await setUpi(np, nikah, "zoya.arman@okicici");
await np.goto(`${BASE}/dashboard/${nikah}/settings`);
await np.getByLabel("Gentle sparkle on your page").check();
await np.getByLabel("Gentle sparkle on your page").scrollIntoViewIfNeeded();
await shot(np, "36-sparkle-setting", "Gentle sparkle (optional)", "Off by default. Turns on drifting petals and twinkling lights for guests.", { group: "Moments" });
await np.getByRole("button", { name: "Save details" }).click();
await np.getByText("Saved").first().waitFor();
const ng = await (await browser.newContext(PHONE)).newPage();
await ng.goto(`${BASE}/r/${nikah}`);
await ng.waitForTimeout(2500);
await shot(ng, "22-nikah-guest", "Nikah registry", "\"Nikah Mubarak\", \"Send salami\", and the optional sparkle (petals drifting in the header).", { group: "Ceremony styles" });

// ── 3. Christian ──────────────────────────────────────────────────────
const chCtx = await browser.newContext(PHONE);
const chp = await chCtx.newPage();
await login(chp);
const church = await createRegistry(chp, { one: "Maria", two: "Joel", date: "2026-12-28", city: "Kochi", colour: "Plum", style: "Christian" });
const chg = await (await browser.newContext(PHONE)).newPage();
await chg.goto(`${BASE}/r/${church}`);
await shot(chg, "23-christian-guest", "Christian wedding", "\"Holy Matrimony\" greeting, plain \"Send gift\".", { group: "Ceremony styles" });

// ── 4. Hindu, in Hindi, with a ledger heading ─────────────────────────
const hCtx = await browser.newContext(PHONE);
const hp = await hCtx.newPage();
await login(hp);
const hindu = await createRegistry(hp, { one: "Priya", two: "Arjun", date: "2027-02-05", city: "Jaipur", colour: "Ruby", style: "Hindu" });
await setUpi(hp, hindu, "priya.arjun@okaxis");
const hg = await hCtx.newPage();
await guestGives(await browser.newContext(PHONE), hindu, { amount: 5101, name: "Gupta Uncle", message: "Sada khush raho" });
await hp.goto(`${BASE}/dashboard/${hindu}/received`);
await hp.getByRole("button", { name: "Yes, received" }).first().click();
await hp.getByText("Confirmed").first().waitFor();
await hp.getByRole("radio", { name: "हिं" }).first().click();
await hp.waitForTimeout(800);
await hp.goto(`${BASE}/dashboard/${hindu}/ledger`);
await shot(hp, "24-hindu-ledger-hi", "Hindu ledger, in Hindi", "The couple's heading (॥ श्री गणेशाय नमः ॥) appears only because they chose it.", { group: "Ceremony styles", full: true });
await hg.goto(`${BASE}/r/${hindu}`);
await shot(hg, "25-hindu-guest-hi", "Hindu registry, in Hindi", "\"॥ शुभ विवाह ॥\" and \"शगुन भेजें\" when the couple picks this style.", { group: "Ceremony styles" });

fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(shots.sort((a, b) => a.id.localeCompare(b.id)), null, 2));
await browser.close();
console.log(`Saved ${shots.length} screens to ${OUT}`);
