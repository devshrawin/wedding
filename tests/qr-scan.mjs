// Scan test: every QR design × format must decode back to the registry link at three print sizes,
// using jsQR (a strict, phone-like decoder). Also saves a preview of each design.
// Usage: BASE=http://localhost:3000 OUT=./qr-previews node tests/qr-scan.mjs   (demo mode, fresh DB)
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const JSQR = fs.readFileSync(require.resolve("jsqr/dist/jsQR.js"), "utf8");
const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "";
if (OUT) fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["Pixel 7"] });
page.on("pageerror", (e) => {
  console.error("PAGE ERROR", e);
  process.exitCode = 1;
});

await page.goto(`${BASE}/login?next=/new`);
await page.getByPlaceholder("98765 43210").fill("97" + String(Date.now()).slice(-8));
await page.getByRole("button", { name: "Send code" }).click();
await page.getByRole("button", { name: "Use code" }).click();
await page.waitForURL(/\/new/);
await page.getByPlaceholder("Ananya").fill("Venkatalakshmi");
await page.getByPlaceholder("Rohan").fill("Siddharth");
await page.locator('input[type="date"]').fill("2027-02-12");
await page.getByPlaceholder("Jaipur").fill("Hyderabad");
// A busy, colourful photo is the hardest case for "photo art": use a screenshot of the landing page.
const photoPage = await browser.newPage({ viewport: { width: 600, height: 600 } });
await photoPage.goto(BASE);
const photo = await photoPage.screenshot({ type: "jpeg", quality: 85 });
await photoPage.close();
await page.locator('input[type="file"]').first().setInputFiles({ name: "couple.jpg", mimeType: "image/jpeg", buffer: photo });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Next", exact: true }).click();
await page.getByRole("button", { name: /Create registry with/ }).click();
await page.waitForURL(/\/dashboard\/[a-z0-9-]+/);
const slug = new URL(page.url()).pathname.split("/")[2];
await page.goto(`${BASE}/dashboard/${slug}/share`);
await page.addScriptTag({ content: JSQR });
const expected = await page.evaluate(() => `${location.origin}/r/`);

const designs = [["Seal", "seal"], ["Arch", "arch"], ["Floral", "floral"], ["Minimal", "minimal"], ["Garden art", "garden"], ["Photo art", "photo"]];
const formats = [["Post", "card"], ["Invite", "square"], ["Status", "status"], ["Table card", "stand"]];
let checked = 0;
for (const [d, dk] of designs) {
  await page.getByRole("radio", { name: new RegExp(`^${d}`) }).click();
  for (const [f, fk] of formats) {
    await page.getByRole("radio", { name: f, exact: true }).click();
    const sel = `canvas[data-ready="1"][data-design="${dk}"][data-format="${fk}"]`;
    await page.locator(sel).waitFor({ timeout: 15000 });
    // Decode the QR region at three sizes: the full card, a phone-screen size, and a small print.
    const results = await page.evaluate(async (sel) => {
      const src = document.querySelector(sel);
      const out = [];
      for (const width of [src.width, 720, 420]) {
        const h = Math.round((src.height * width) / src.width);
        const c = document.createElement("canvas");
        c.width = width;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(src, 0, 0, width, h);
        const img = ctx.getImageData(0, 0, width, h);
         
        const r = jsQR(img.data, width, h, { inversionAttempts: "dontInvert" });
        out.push({ width, text: r?.data ?? null });
      }
      return out;
    }, sel);
    if (OUT) {
      const url = await page.evaluate((sel) => {
        const src = document.querySelector(sel);
        const c = document.createElement("canvas");
        c.width = 540;
        c.height = Math.round((src.height * 540) / src.width);
        c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", 0.85);
      }, sel);
      fs.writeFileSync(`${OUT}/${dk}-${fk}.jpg`, Buffer.from(url.split(",")[1], "base64"));
    }
    for (const r of results) {
      assert.ok(r.text && r.text.startsWith(expected) && r.text.endsWith(slug), `${d} / ${f} failed to scan at ${r.width}px (got ${r.text})`);
      checked++;
    }
    console.log(`  ✓ ${d} / ${f}: ${results.map((r) => r.width + "px").join(", ")}`);
  }
}
// The printer SVG must scan too.
const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /QR for printers/ }).click()]);
const svg = fs.readFileSync(await dl.path(), "utf8");
for (const width of [1024, 300]) {
  const text = await page.evaluate(
    async ({ svg, width }) => {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = width;
      c.height = width;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, width, width);
       
      return jsQR(ctx.getImageData(0, 0, width, width).data, width, width, { inversionAttempts: "dontInvert" })?.data ?? null;
    },
    { svg, width },
  );
  assert.ok(text && text.endsWith(slug), `printer SVG failed to scan at ${width}px (got ${text})`);
  checked++;
  console.log(`  ✓ printer SVG: ${width}px`);
}
// The animated Status video records and downloads (browsers without MediaRecorder get a message instead).
await page.getByRole("radio", { name: /^Seal/ }).click();
await page.getByRole("radio", { name: "Status", exact: true }).click();
const [video] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.getByRole("button", { name: "Animated video" }).click()]);
const bytes = fs.statSync(await video.path()).size;
assert.ok(bytes > 20_000, `video too small (${bytes} bytes)`);
console.log(`  ✓ animated video: ${video.suggestedFilename()} (${Math.round(bytes / 1024)} KB)`);
await browser.close();
console.log(process.exitCode ? "FAILED" : `ALL ${checked} SCANS OK`);
