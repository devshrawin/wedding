// End-to-end walkthrough: couple creates → shares → guest reserves + sends shagun → couple confirms.
// Usage: BASE=http://localhost:3000 SHOTS=/tmp/shots node tests/e2e.mjs   (server must run in demo mode)
import { createRequire } from "node:module";
// Resolves a globally installed Playwright too (NODE_PATH), not just a local one.
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import assert from "node:assert/strict";
import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:3000";
const SHOTS = process.env.SHOTS || "";
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const phone = "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0").replace(/^[0-5]/, "8");
const browser = await chromium.launch();
const mobile = { ...devices["Pixel 7"] };
let n = 0;
const shot = async (page, name, full = true) => SHOTS && page.screenshot({ path: `${SHOTS}/${String(++n).padStart(2, "0")}-${name}.png`, fullPage: full });
const step = (s) => console.log("•", s);

// Accessibility: run axe-core on a page and fail on serious/critical WCAG A/AA issues.
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const a11yProblems = [];
async function audit(page, name) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(async () =>
    (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " " + (n.any[0]?.message ?? "") + " " + n.html.slice(0, 120)),
    })),
  );
  const bad = res.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) a11yProblems.push(`${name}: [${v.impact}] ${v.id} — ${v.help} @ ${v.nodes.join(" | ")}`);
  const minor = res.length - bad.length;
  console.log(`  a11y ${name}: ${bad.length} serious/critical${minor ? `, ${minor} minor` : ""}`);
  for (const v of bad) console.log(`    ${v.id}: ${v.help} @ ${v.nodes.join(" | ")}`);
}

async function login(page, number, next = "/new") {
  await page.goto(`${BASE}/login?next=${encodeURIComponent(next)}`);
  await page.getByPlaceholder("98765 43210").fill(number);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByRole("button", { name: "Use code" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

// ── Couple ────────────────────────────────────────────────────────────
const couple = await browser.newContext(mobile);
const cp = await couple.newPage();
cp.on("pageerror", (e) => { console.error("PAGE ERROR", e); process.exitCode = 1; });

step("landing");
await cp.goto(BASE);
await shot(cp, "landing");
await audit(cp, "landing");
await cp.getByRole("link", { name: /Create your free registry/ }).first().click();
await cp.getByRole("button", { name: "Send code" }).waitFor();
await shot(cp, "login");

step("otp login");
const t0 = Date.now();
await login(cp, phone);
await cp.waitForURL(/\/new/);

step("create registry");
await cp.getByPlaceholder("Ananya").fill("Priya");
await cp.getByPlaceholder("Rohan").fill("Arjun");
await cp.locator('input[type="date"]').fill("2027-02-12");
await cp.getByPlaceholder("Jaipur").fill("Udaipur");
await shot(cp, "wizard-1");
await cp.getByRole("button", { name: "Next", exact: true }).click();
await cp.getByText("Honeymoon Fund", { exact: true }).click();
await shot(cp, "wizard-2");
await audit(cp, "wizard");
await cp.getByRole("button", { name: /Create registry with/ }).click();
await cp.getByText("Your registry is ready!").waitFor();
console.log(`  registry created ${((Date.now() - t0) / 1000).toFixed(1)}s after starting login`);
const slug = new URL(cp.url()).pathname.split("/")[2];
await cp.getByText("Your registry is ready!").waitFor();
await shot(cp, "dashboard-welcome");

step("add UPI");
await cp.goto(`${BASE}/dashboard/${slug}/settings`);
await cp.getByPlaceholder("ananya@okhdfcbank").fill("priya@okhdfcbank");
await cp.getByRole("button", { name: "Save UPI details" }).click();
await cp.getByText("Saved").first().waitFor();
await shot(cp, "settings");
await audit(cp, "settings");

step("add gift by hand + chip-in");
await cp.goto(`${BASE}/dashboard/${slug}/gifts`);
await cp.getByRole("button", { name: "Add", exact: true }).click();
await cp.getByText("Paste a product link").waitFor();
await shot(cp, "gifts-add-menu", false);
await cp.getByText("Paste a product link").click();
await cp.getByPlaceholder("https://www.amazon.in/…").fill("https://www.amazon.in/Prestige-Iris-750-Watt-Mixer-Grinder/dp/B0756K5DYZ");
// Pasting a full link fetches straight away; click only if it did not.
await cp.getByRole("button", { name: "Fetch details" }).click({ timeout: 1500 }).catch(() => {});
const nameInput = cp.getByPlaceholder("Prestige Mixer Grinder 750W");
await nameInput.waitFor({ timeout: 20000 });
console.log("  link title →", await nameInput.inputValue());
if (!(await nameInput.inputValue())) await nameInput.fill("Prestige Iris Mixer Grinder");
const price = cp.getByLabel("Price (₹)");
if (!(await price.inputValue())) await price.fill("3499");
await shot(cp, "gifts-link-form", false);
await cp.getByRole("button", { name: "Add to wishlist" }).click();
await cp.getByText("Added to your wishlist").first().waitFor();
await cp.getByText("Air Fryer", { exact: true }).click();
await cp.getByLabel("Let guests chip in").check();
await cp.getByRole("button", { name: "Save changes" }).click();
await cp.getByText("Saved").first().waitFor();
await shot(cp, "gifts");
await audit(cp, "wishlist");

// ── Guest ─────────────────────────────────────────────────────────────
step("guest opens registry");
const guest = await browser.newContext(mobile);
const gp = await guest.newPage();
gp.on("pageerror", (e) => { console.error("GUEST PAGE ERROR", e); process.exitCode = 1; });
await gp.goto(`${BASE}/r/${slug}`);
await gp.getByRole("heading", { name: /Priya & Arjun/ }).waitFor();
await shot(gp, "guest-page");
await audit(gp, "guest-page");
const html = await gp.content();
assert.ok(!html.includes(phone), "couple phone must never reach the guest page");

step("guest reserves a gift");
await gp.getByRole("button", { name: /Pressure Cooker/ }).click();
await shot(gp, "guest-item", false);
await gp.getByRole("button", { name: /I'll gift this/ }).click();
await gp.getByPlaceholder(/Sunita Sharma/).fill("Sunita Bua");
await gp.getByPlaceholder("98765 43210").fill("9812345678");
await gp.getByPlaceholder(/lifetime of happiness/).fill("Khush raho beta!");
await gp.getByRole("button", { name: /Confirm/ }).click();
await gp.getByRole("heading", { name: /yours to gift/ }).waitFor();
await shot(gp, "guest-reserved", false);
await gp.getByRole("button", { name: "Done" }).click();
await gp.getByText("Reserved by you").waitFor();

step("guest sends shagun by UPI");
await gp.getByRole("button", { name: "Send shagun" }).first().click();
await gp.getByRole("button", { name: "₹1,101" }).click();
await shot(gp, "guest-shagun-amount", false);
await gp.getByRole("button", { name: /Pay ₹1,101 by UPI/ }).click();
const upiHref = await gp.getByRole("link", { name: "Open UPI app" }).getAttribute("href");
assert.match(upiHref, /^upi:\/\/pay\?pa=priya%40okhdfcbank&pn=Priya&cu=INR&am=1101\.00/);
await gp.getByAltText("UPI QR code").waitFor();
await shot(gp, "guest-shagun-upi", false);
await audit(gp, "guest-upi-sheet");
await gp.getByRole("button", { name: /I've paid ₹1,101/ }).click();
await gp.getByRole("heading", { name: /Thank you!/ }).waitFor();
await shot(gp, "guest-shagun-done", false);
await gp.getByRole("button", { name: "Done" }).click();

step("chip-in gift shows what's left and refuses over-giving");
await gp.getByRole("button", { name: /Air Fryer/ }).click();
await gp.getByText("₹6,500 still needed").first().waitFor();
await gp.getByRole("button", { name: "Chip in any amount" }).click();
await gp.getByLabel("Other amount (₹)").fill("7000");
await gp.getByText("Only ₹6,500 is still needed").first().waitFor();
assert.ok(await gp.getByRole("button", { name: /Pay ₹7,000 by UPI/ }).isDisabled(), "over-cap chip-in must be blocked");
await gp.keyboard.press("Escape");

step("second guest cannot reserve the same gift, cannot see names/amounts");
const guest2 = await browser.newContext(mobile);
const g2 = await guest2.newPage();
await g2.goto(`${BASE}/r/${slug}`);
const html2 = await g2.content();
assert.ok(!html2.includes("Sunita"), "guest names must not leak to other guests");
assert.ok(!html2.includes("1,101") && !html2.includes("1101"), "amounts must not leak to other guests");
assert.ok(!html2.includes("9812345678"), "guest phone must not leak");
await g2.getByRole("button", { name: /Pressure Cooker/ }).click();
await g2.getByText(/already gifting this/).waitFor();
await g2.keyboard.press("Escape");
step("anonymous pledge");
await g2.getByRole("button", { name: "Send shagun" }).first().click();
await g2.getByLabel("Other amount (₹)").fill("2000");
await g2.getByRole("button", { name: /Make it ₹2,001/ }).click();
await g2.getByLabel("Give anonymously").check();
await g2.getByRole("button", { name: /give it in person/ }).click();
await g2.getByRole("heading", { name: /Thank you!/ }).waitFor();

// ── Couple confirms ───────────────────────────────────────────────────
step("couple confirms shagun");
await cp.goto(`${BASE}/dashboard/${slug}`);
await cp.getByText("Please confirm").waitFor();
await shot(cp, "dashboard-pending");
await audit(cp, "dashboard");
await cp.getByRole("button", { name: "Yes, received" }).first().click();
await cp.getByText("Confirmed").first().waitFor();

step("cash entry");
await cp.goto(`${BASE}/dashboard/${slug}/shagun`);
await cp.getByRole("button", { name: "Add cash entry" }).click();
await cp.getByPlaceholder(/Sharma ji/).fill("Gupta Uncle");
await cp.getByRole("dialog").getByRole("button", { name: "₹2,101" }).click();
await cp.getByPlaceholder("Udaipur").fill("Kota");
await cp.getByRole("button", { name: "Save & add next" }).click();
await cp.getByText("1 entry saved").waitFor();
await cp.keyboard.press("Escape");
await cp.getByText("Gupta Uncle", { exact: true }).first().waitFor();
await shot(cp, "shagun");
await audit(cp, "shagun");

step("thank-you note");
await cp.getByRole("button", { name: "Say thank you" }).first().click();
const note = await cp.getByRole("textbox", { name: "Thank-you note" }).inputValue();
assert.match(note, /Thank you/);
await shot(cp, "thank-you", false);
await cp.getByRole("button", { name: "Mark as thanked" }).last().click();
await cp.getByText("Marked as thanked").first().waitFor();

step("ledger + csv");
await cp.goto(`${BASE}/dashboard/${slug}/ledger`);
await cp.getByRole("heading", { name: "Shagun Ledger" }).waitFor();
assert.ok(await cp.getByText("Gupta Uncle").isVisible());
await shot(cp, "ledger");
await audit(cp, "ledger");
const csv = await (await couple.request.get(`${BASE}/api/ledger/${slug}`)).text();
assert.ok(csv.includes("Gupta Uncle") && csv.includes("2101"), "csv has cash entry");
const anonCsv = await browser.newContext().then((c) => c.request.get(`${BASE}/api/ledger/${slug}`));
assert.equal(anonCsv.status(), 404, "ledger csv must be private");

step("share page");
await cp.goto(`${BASE}/dashboard/${slug}/share`);
await cp.getByRole("button", { name: "Share card" }).waitFor();
await cp.waitForFunction(() => !document.querySelector("canvas")?.closest("section")?.querySelector("button[disabled]"));
await shot(cp, "share");
await audit(cp, "share");

step("password protection");
await cp.goto(`${BASE}/dashboard/${slug}/settings`);
await cp.getByText("Password protected", { exact: true }).click();
await cp.getByPlaceholder("shaadi2027").fill("shaadi2027");
await cp.getByRole("button", { name: "Save privacy" }).click();
await cp.getByText("Saved").first().waitFor();
const guest3 = await browser.newContext(mobile);
const g3 = await guest3.newPage();
await g3.goto(`${BASE}/r/${slug}`);
await g3.getByText("This registry is private").waitFor();
assert.ok(!(await g3.content()).includes("Priya"), "locked page must not reveal the couple");
await shot(g3, "guest-locked");
await audit(g3, "locked");
await g3.getByLabel("Password").fill("wrong");
await g3.getByRole("button", { name: "Open registry" }).click();
await g3.getByText(/Wrong password/).first().waitFor();
await g3.getByLabel("Password").fill("shaadi2027");
await g3.getByRole("button", { name: "Open registry" }).click();
await g3.getByRole("heading", { name: /Priya & Arjun/ }).waitFor();

step("invite-only");
await cp.getByText("Invite-only", { exact: true }).click();
await cp.getByRole("button", { name: "Save privacy" }).click();
await cp.getByText("Saved").first().waitFor();
await g3.reload();
await g3.getByText("This registry is private").waitFor(); // password grant no longer enough
await cp.goto(`${BASE}/dashboard/${slug}/share`);
await cp.getByLabel(/Guest or family names/).fill("Sharma family\nNeha Didi");
await cp.getByRole("button", { name: "Create invite links" }).click();
await cp.getByText("Neha Didi").waitFor();
await shot(cp, "share-invites");
const waHref = await cp.getByRole("link", { name: /Send to Neha Didi/ }).getAttribute("href");
const inviteUrl = decodeURIComponent(waHref).match(/https?:\/\/\S+\/i\/[a-z0-9]+/)[0];
await g3.goto(inviteUrl.replace(/^https?:\/\/[^/]+/, BASE));
await g3.getByText("Welcome, Neha Didi").waitFor();
await cp.getByRole("button", { name: /Delete invite for Neha Didi/ }).click();
await cp.getByText("Neha Didi").waitFor({ state: "detached" });
await g3.reload();
await g3.getByText("This registry is private").waitFor(); // revoked

step("family mode");
const famPhone = "7" + phone.slice(1);
await cp.goto(`${BASE}/dashboard/${slug}/settings`);
await cp.getByPlaceholder("Mummy").fill("Mummy");
await cp.locator("#family").getByPlaceholder("98765 43210").fill(famPhone);
await cp.getByRole("button", { name: "Add family member" }).click();
await cp.getByText("Family member added").first().waitFor();
const fam = await browser.newContext(mobile);
const fp = await fam.newPage();
await login(fp, famPhone, "/dashboard");
await fp.waitForURL(new RegExp(`/dashboard/${slug}`));
await fp.goto(`${BASE}/dashboard/${slug}/settings`);
await fp.getByText("You're helping as family").waitFor();
assert.ok(await fp.getByText(/Only the couple can change this|Only they can add it/).isVisible(), "family sees UPI read-only");
assert.equal(await fp.getByLabel("Your UPI ID").count(), 0, "family cannot edit UPI");
assert.equal(await fp.getByRole("button", { name: "Delete this registry" }).count(), 0, "family cannot delete");
const stranger = await browser.newContext(mobile);
const sp = await stranger.newPage();
await login(sp, "6" + phone.slice(1), "/dashboard");
const res = await sp.goto(`${BASE}/dashboard/${slug}`);
assert.equal(res.status(), 404, "strangers cannot open someone else's dashboard");

step("hindi");
await cp.getByRole("radio", { name: "हिं" }).first().click();
await cp.getByRole("heading", { name: "सेटिंग" }).waitFor();
await cp.goto(`${BASE}/dashboard/${slug}`);
await shot(cp, "dashboard-hindi");
await cp.goto(`${BASE}/dashboard/${slug}/ledger`);
await shot(cp, "ledger-hindi");
await cp.goto(`${BASE}/r/${slug}`);
await shot(cp, "guest-hindi");

await browser.close();
if (a11yProblems.length) {
  console.error("\nACCESSIBILITY PROBLEMS:\n" + a11yProblems.join("\n"));
  process.exitCode = 1;
}
console.log(process.exitCode ? "FAILED" : `\nALL GOOD: registry: ${BASE}/r/${slug}`);
