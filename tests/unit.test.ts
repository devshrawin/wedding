import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { CATALOG, CATEGORIES, FUND_TEMPLATES, catalogFor, categoryOf, fundTitle } from "../src/lib/catalog";
import { TRADITIONS, giftWordFor, greetingFor, traditionOf } from "../src/lib/traditions";
import { ICONS, PICKER_ICONS, iconLabel } from "../src/components/icons";
import { computeItems, computeStats, thankYouNote } from "../src/lib/compute";
import type { Contribution, Item, Reservation } from "../src/lib/db/schema";
import { extractFromHtml, isPrivateIp, parsePrice, parseSafeUrl, titleFromUrl } from "../src/lib/link-preview";
import { platformFeePaise, verifyPaymentSignature, verifyWebhookSignature } from "../src/lib/razorpay";
import { buildUpiLink, inr, isValidUpiId, normalizePhone, shagunSuggestions, slugify, toShagunAmount } from "../src/lib/utils";

const now = new Date();
const item = (p: Partial<Item>): Item => ({
  id: "i1", registryId: "r", kind: "product", title: "Mixer", description: null, imageUrl: null, icon: null, url: null, store: null,
  category: "kitchen", price: 4000, quantity: 1, allowChipIn: false, hidden: false, position: 0, createdAt: now, ...p,
});
const res = (p: Partial<Reservation>): Reservation => ({
  id: "x", registryId: "r", itemId: "i1", guestKey: "g1", guestName: "A", guestPhone: null, message: null, anonymous: false,
  quantity: 1, status: "reserved", thankedAt: null, createdAt: now, ...p,
});
const con = (p: Partial<Contribution>): Contribution => ({
  id: "c", registryId: "r", itemId: "f1", itemTitle: "Fund", guestKey: "g2", guestName: "B", guestPhone: null, guestPlace: null, message: null,
  anonymous: false, amount: 1101, fee: 0, method: "upi", status: "confirmed", utr: null, proofImage: null, razorpayOrderId: null, razorpayPaymentId: null,
  thankedAt: null, createdAt: now, ...p,
});

test("phone numbers normalise to +91", () => {
  assert.equal(normalizePhone("98765 43210"), "+919876543210");
  assert.equal(normalizePhone("+91-9876543210"), "+919876543210");
  assert.equal(normalizePhone("09876543210"), "+919876543210");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone("5876543210"), null);
});

test("shagun amounts end in 1", () => {
  assert.equal(toShagunAmount(1000), 1001);
  assert.equal(toShagunAmount(501), 501);
  assert.equal(toShagunAmount(50), 50);
  for (const a of shagunSuggestions(null)) assert.equal(a % 10, 1);
  assert.ok(shagunSuggestions(900).every((a) => a <= 900));
});

test("indian formatting, slugs, upi", () => {
  assert.equal(inr(123456), "₹1,23,456");
  assert.equal(slugify("Priya Sharma"), "priya-sharma");
  assert.equal(slugify("प्रिया"), "");
  assert.ok(isValidUpiId("priya.s@okhdfcbank"));
  assert.ok(!isValidUpiId("priya@"));
  assert.ok(!isValidUpiId("not an id"));
  assert.equal(buildUpiLink({ pa: "a@upi", pn: "Priya S", am: 501, tn: "Shagun for A & B" }), "upi://pay?pa=a%40upi&pn=Priya%20S&cu=INR&am=501.00&tn=Shagun%20for%20A%20%26%20B");
});

test("a reserved item is fulfilled; cancelled reservations don't count", () => {
  const [v] = computeItems([item({})], [res({ status: "cancelled" })], []);
  assert.equal(v.fulfilled, false);
  const [w] = computeItems([item({})], [res({})], []);
  assert.equal(w.fulfilled, true);
  assert.equal(w.remainingQty, 0);
});

test("quantity items track remaining", () => {
  const [v] = computeItems([item({ quantity: 4 })], [res({ quantity: 1 }), res({ id: "y", quantity: 2 })], []);
  assert.equal(v.remainingQty, 1);
  assert.equal(v.fulfilled, false);
  assert.equal(v.progress, 75);
});

test("only confirmed money counts; pending is tracked separately", () => {
  const fund = item({ id: "f1", kind: "fund", price: 10000 });
  const cs = [con({}), con({ id: "c2", status: "pending", amount: 2101 }), con({ id: "c3", status: "rejected", amount: 5000 })];
  const views = computeItems([fund], [], cs);
  assert.equal(views[0].raised, 1101);
  assert.equal(views[0].pendingAmount, 2101);
  assert.equal(views[0].progress, 11);
  const stats = computeStats(views, [], cs);
  assert.equal(stats.cashReceived, 1101);
  assert.equal(stats.cashPending, 2101);
  assert.equal(stats.pendingCount, 1);
});

test("stats combine gifts and shagun without exceeding 100%", () => {
  const items = [item({}), item({ id: "f1", kind: "fund", price: 1000 })];
  const views = computeItems(items, [res({})], [con({ amount: 5001 })]);
  const s = computeStats(views, [res({})], [con({ amount: 5001 })]);
  assert.equal(s.giftsValue, 4000);
  assert.equal(s.totalReceived, 9001);
  assert.equal(s.fulfilledPct, 100);
  assert.equal(s.guests, 2);
  assert.equal(s.toThank, 2);
});

test("thank-you notes in both languages", () => {
  const en = thankYouNote({ lang: "en", tone: "warm", guest: "Bua ji", gift: null, amount: 1101, fund: "Honeymoon Fund", couple: "P & A" });
  assert.match(en, /Dear Bua ji/);
  assert.match(en, /₹1,101/);
  const hi = thankYouNote({ lang: "hi", tone: "formal", guest: null, gift: "मिक्सर", amount: null, fund: null, couple: "P & A" });
  assert.match(hi, /मिक्सर/);
  assert.match(hi, /नमस्ते/);
});

test("SSRF guard rejects private and odd targets", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.16.5.5", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "::ffff:10.0.0.1", "0.0.0.0"]) assert.ok(isPrivateIp(ip), ip);
  assert.ok(!isPrivateIp("8.8.8.8"));
  for (const u of ["http://localhost/x", "http://127.0.0.1/", "http://169.254.169.254/latest", "ftp://amazon.in/x", "javascript:alert(1)", "http://user:pw@amazon.in/", "http://amazon.in:8080/", "http://intranet/", "http://db.internal/"]) {
    assert.equal(parseSafeUrl(u), null, u);
  }
  assert.equal(parseSafeUrl("Check this out https://amzn.in/d/abc123 !!")?.hostname, "amzn.in");
  assert.equal(parseSafeUrl("flipkart.com/some-product/p/itm123")?.protocol, "https:");
});

test("product metadata: JSON-LD wins, then OpenGraph, then store-specific markup", () => {
  const ld = `<html><head><title>Buy X | Flipkart.com</title>
    <script type="application/ld+json">[{"@type":"BreadcrumbList"},{"@type":"Product","name":"Philips Air Fryer HD9200","image":["https://img.example/a.jpg"],"offers":{"@type":"Offer","price":"6,499.00","priceCurrency":"INR"}}]</script></head></html>`;
  assert.deepEqual(extractFromHtml(ld, new URL("https://www.flipkart.com/x/p/itm1")), { store: "Flipkart", title: "Philips Air Fryer HD9200", image: "https://img.example/a.jpg", price: 6499 });

  const og = `<meta property="og:title" content="Buy Solimo Bedsheet &amp; Pillow Covers Online at Low Prices in India - Amazon.in"><meta content="//m.media-amazon.com/i.jpg" property="og:image"><meta property="product:price:amount" content="899">`;
  const r = extractFromHtml(og, new URL("https://www.amazon.in/dp/B0"));
  assert.equal(r.title, "Solimo Bedsheet & Pillow Covers");
  assert.equal(r.image, "https://m.media-amazon.com/i.jpg");
  assert.equal(r.price, 899);

  const amz = `<span id="productTitle" class="a-size-large">  Prestige Iris Mixer  </span><img id="landingImage" data-old-hires="https://m.media-amazon.com/big.jpg" src="x"><span class="a-price-whole">3,499<span>.</span></span>`;
  const a = extractFromHtml(amz, new URL("https://www.amazon.in/dp/B0"));
  assert.equal(a.title, "Prestige Iris Mixer");
  assert.equal(a.image, "https://m.media-amazon.com/big.jpg");
  assert.equal(a.price, 3499);
});

test("price parsing and URL title fallback", () => {
  assert.equal(parsePrice("₹ 12,499.00"), 12499);
  assert.equal(parsePrice("Rs. 899"), 899);
  assert.equal(parsePrice("free"), null);
  assert.equal(titleFromUrl(new URL("https://www.amazon.in/Prestige-Iris-750-Watt-Mixer-Grinder/dp/B0756K5DYZ")), "Prestige Iris 750 Watt Mixer Grinder");
  assert.equal(titleFromUrl(new URL("https://www.flipkart.com/philips-hd9200-air-fryer/p/itmabc")), "Philips Hd9200 Air Fryer");
  assert.equal(titleFromUrl(new URL("https://amzn.in/d/abc")), null);
});

test("razorpay signatures", () => {
  const sig = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
  assert.ok(verifyPaymentSignature("order_1", "pay_1", sig, "secret"));
  assert.ok(!verifyPaymentSignature("order_2", "pay_1", sig, "secret"));
  assert.ok(!verifyPaymentSignature("order_1", "pay_1", "", "secret"));
  const body = '{"event":"payment.captured"}';
  const wsig = createHmac("sha256", "whsec").update(body).digest("hex");
  assert.ok(verifyWebhookSignature(body, wsig, "whsec"));
  assert.ok(!verifyWebhookSignature(body + " ", wsig, "whsec"));
  assert.equal(platformFeePaise(1000), 2500); // 2.5% of ₹1000 = ₹25
});

// ── Ceremony styles, catalog, icons ───────────────────────────────────

test("neutral by default: no religious wording unless a style is chosen", () => {
  assert.equal(traditionOf(null).key, "none");
  assert.equal(greetingFor({ greeting: null }, "en"), "We're getting married");
  assert.equal(giftWordFor({ giftWord: null }, "en"), "Gift");
  assert.equal(giftWordFor({ giftWord: "  Salami " }, "en"), "Salami");
  const none = TRADITIONS.find((t) => t.key === "none")!;
  assert.equal(none.greeting, null);
  assert.equal(none.ledgerHeading, null);
});

test("faith items only appear for their own style", () => {
  const ids = (t: string) => catalogFor(t).map((c) => c.id);
  assert.ok(!ids("none").some((id) => ["thali", "mandir", "janamaz", "bible", "rumala"].includes(id)));
  assert.ok(ids("muslim").includes("janamaz") && !ids("muslim").includes("mandir"));
  assert.ok(ids("christian").includes("bible") && !ids("christian").includes("janamaz"));
  assert.ok(ids("hindu").includes("thali"));
  assert.equal(ids("civil").length, ids("none").length);
});

test("every catalog item, category and fund uses a real icon (no emoji)", () => {
  for (const c of CATALOG) assert.ok(c.icon in ICONS, c.id);
  for (const c of CATEGORIES) assert.ok(c.icon in ICONS, c.key);
  for (const f of FUND_TEMPLATES) assert.ok(f.icon in ICONS, f.id);
  for (const k of PICKER_ICONS) assert.ok(k in ICONS, k);
  assert.equal(iconLabel("airFryer"), "Air fryer");
});

test("blessings fund and thank-you notes take the couple's own word", () => {
  const f = FUND_TEMPLATES.find((x) => x.id === "blessings")!;
  assert.equal(fundTitle(f, "en", null), "Gifts & blessings");
  assert.equal(fundTitle(f, "en", "Shagun"), "Shagun & blessings");
  assert.equal(fundTitle(f, "hi", "सलामी"), "सलामी और आशीर्वाद");
  const note = thankYouNote({ lang: "en", tone: "warm", guest: "Ayesha", gift: null, amount: 2100, fund: null, couple: "Z & S", word: "Salami" });
  assert.match(note, /your salami of ₹2,100/);
  assert.match(thankYouNote({ lang: "en", tone: "warm", guest: null, gift: null, amount: 501, fund: null, couple: "A & B" }), /your gift of ₹501/);
});

test("couples can name their own sections", () => {
  assert.equal(categoryOf("c:Wall art").en, "Wall art");
  assert.equal(categoryOf("kitchen").en, "Kitchen");
  assert.equal(categoryOf("nonsense").key, "other");
});
