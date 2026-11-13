# Giftr — wedding gift registry + shagun, made for India

> Gifts you'll actually use. Shagun without the notebook.

Giftr gives a couple one link for their wedding. Guests open it on any phone (no app, no login), **reserve a gift** the couple really wants or **send shagun by UPI**, and the couple gets a tidy, private record — the chandlo notebook, digitised.

- **60-second setup** — names, date, city; pre-ticked wedding essentials and a shagun fund.
- **Paste any product link** — Amazon, Flipkart, Myntra, Pepperfry, Croma… title, photo and price are fetched server-side.
- **Shagun the Indian way** — odd-amount suggestions (₹501, ₹1,101, ₹2,101…) and a "+₹1 for good luck" nudge.
- **Private by default** — guests never see who gave what or how much. Link-only, password, or invite-only access; hide individual items; hide reserved gifts.
- **UPI native** — money goes straight to the couple's UPI ID (deep link + QR). Zero fees. Optional Razorpay checkout.
- **Family mode** — parents manage the registry from their own phone.
- **Thank-you notes** — generated in Hindi or English, three tones, one tap to WhatsApp.
- **The vahi** — a traditional-style, print-ready ledger (Save as PDF) plus CSV for Excel, including cash envelopes entered at the venue.
- **Share card + QR** — drawn in the browser, so Hindi names render properly.
- **Hindi + English**, large touch targets, installable PWA, light on low-end Android.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

That's all. With no configuration the app uses an **embedded Postgres (PGlite)** stored in `./.data` and runs in **demo mode**, where the login OTP is shown on screen instead of being sent by SMS.

```bash
npm test             # unit tests: money maths, link parser, SSRF guard, signatures
npm run build && INSECURE_COOKIES=1 DEMO_MODE=true AUTH_SECRET=some-long-secret npm start
npm run test:e2e     # full browser walkthrough against a running server (needs Playwright)
npm run typecheck && npm run lint
```

## Going to production

Copy `.env.example` to `.env.local` (or set these in your host):

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | **Required.** Long random string that signs sessions and access grants. |
| `NEXT_PUBLIC_APP_URL` | Public origin, e.g. `https://giftr.in`. |
| `DATABASE_URL` | Any Postgres — **Supabase** works out of the box (use the pooler URI). Migrations in `drizzle/` run automatically on boot; set `DB_AUTO_MIGRATE=false` to run them yourself. |
| `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` | Real SMS OTP via MSG91. Without these, set `DEMO_MODE=true` only for demos. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Optional gateway checkout. Point a Razorpay webhook (`payment.captured`, `order.paid`, `payment.failed`) at `/api/razorpay/webhook`. |
| `PLATFORM_FEE_PERCENT` | Fee recorded on Razorpay contributions (default 2.5). |

Deploy anywhere Node runs (Vercel, Railway, Fly, a VPS). On serverless hosts you must set `DATABASE_URL` — the embedded database needs a persistent disk.

## How it works

### The journey

```
Couple                               Guest                               Couple
──────                               ─────                               ──────
/  → /login (phone OTP)
/new  2-step wizard
/dashboard/[slug]                    /r/[slug]   (or /i/[token] invite)
  ├ gifts    paste link / essentials   ├ reserve a gift → buy anywhere
  ├ settings UPI ID, privacy, family   └ send shagun → UPI app / QR
  └ share    WhatsApp, QR card             → "I've paid"            →   Shagun tab: "Did this arrive?"
                                                                        ├ confirm / not received
                                                                        ├ thank-you note → WhatsApp
                                                                        └ ledger (PDF / CSV)
```

### How shagun reaches the couple

**Direct UPI (default, zero fee).** The guest picks an amount and gets a `upi://pay` deep link (on phones) and a QR (for any UPI app). Money moves bank-to-bank; Giftr never holds it. Because a bank transfer between two people can't be observed by a third party, the guest taps **"I've paid"** and the couple confirms it with one tap once they see it in their UPI app. Only confirmed shagun counts in totals and the ledger.

**Pledge.** "I'll give it in person" tells the couple what to expect; they confirm when the envelope arrives.

**Razorpay (optional).** When keys are set, guests also get card / netbanking / wallet checkout. These are verified by signature and by webhook and are confirmed automatically.

### Privacy model

- The guest page is built from an explicit allow-list of fields. Names, phone numbers, messages and amounts of other guests are never sent to a browser.
- Fund progress is hidden from guests unless the couple opts in.
- `link` — unlisted; every registry page is `noindex`. `password` — changing the password invalidates earlier unlocks. `invite` — one personal link per guest; deleting it revokes that guest's access.
- A locked registry reveals nothing: not the couple's names, not even in link previews.
- Anonymous gifts store no name at all.
- Family members can do everything except change the payout UPI ID, manage family, or delete the registry.

### Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, React 19, server components + server actions |
| UI | Tailwind CSS v4, shadcn-style components on Radix primitives, lucide icons |
| Data | Drizzle ORM → Postgres (Supabase/any) in production, PGlite locally — one schema, one set of migrations |
| Auth | Phone OTP (hashed codes, attempt limits), signed JWT session cookie |
| Payments | UPI deep links + QR; Razorpay orders, checkout, webhook |
| i18n | Co-located bilingual strings: `tr("Reserve", "रिज़र्व करें")`, language in a cookie |
| PWA | Web manifest, generated icons, service worker (network-first pages, cached assets, offline page) |

```
src/
  app/
    page.tsx                  landing
    login/  new/              OTP sign-in, creation wizard
    dashboard/[slug]/         overview · gifts · shagun · share · settings · ledger
    r/[slug]/                 guest registry (reserve, shagun, unlock)
    i/[token]/                personal invite link
    actions/                  server actions: auth, registry, items, shagun (couple), guest
    api/                      ledger CSV, Razorpay webhook
  components/                 design system + shared pieces
  lib/
    db/schema.ts              tables            compute.ts     progress, totals, thank-you notes
    auth.ts                   sessions, access  link-preview.ts product parser + SSRF guard
    catalog.ts                essentials, funds razorpay.ts    signatures, orders
drizzle/                      SQL migrations
tests/                        unit tests + Playwright walkthrough
```

### Data model

`users` · `otp_codes` · `registries` (privacy + UPI settings) · `registry_members` (family mode) · `items` (products and funds) · `reservations` · `contributions` (UPI, Razorpay, cash; `initiated → pending → confirmed/rejected`) · `invites`. Amounts are whole rupees.

## Known limits — read before launch

- **Google sign-in is not built.** Phone OTP is the only login.
- **Direct UPI is self-reported** until the couple confirms it (see above). Some UPI apps restrict `upi://` deep links to personal IDs; the QR and "copy UPI ID" fallbacks cover that.
- **Razorpay is untested against live keys** in this repo (signature logic is unit-tested). Gateway money lands in the platform's Razorpay account; paying it out to couples (e.g. Razorpay Route) and the fee collection are not automated.
- **Link fetching is best-effort.** Stores that block servers fall back to a title guessed from the URL, and the couple fills in the price.
- **The ledger PDF is produced by the browser's "Save as PDF"** — chosen so Devanagari always renders correctly.
- **Rate limits are in-memory** (per instance). Use Redis/Upstash when running multiple replicas, and make sure your proxy sets `x-forwarded-for`.
- **Couple photos are stored as compressed data URLs** in Postgres; move to object storage (Supabase Storage) at scale.
- Languages: Hindi and English only. No realtime push — dashboards refresh on navigation.
