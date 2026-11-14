# Giftr: wedding gift registry + shagun, made for India

> Gifts you'll actually use. Shagun without the notebook.

Giftr gives a couple one link for their wedding. Guests open it on any phone (no app, no login), **reserve a gift** the couple really wants or **send shagun by UPI**, and the couple gets a tidy, private record. It is the chandlo notebook, digitised.

- **60-second setup:** names, date, city, with wedding essentials and a shagun fund already ticked.
- **Paste any product link:** Amazon, Flipkart, Myntra, Pepperfry, Croma and more. Title, photo and price are fetched on the server. When a store blocks that, the couple adds the price and a photo from their own gallery.
- **Shagun the Indian way:** odd-amount suggestions (₹501, ₹1,101, ₹2,101) and a "+₹1 for good luck" nudge.
- **Chip-in gifts:** several guests can share a big gift. Guests see how much is still needed, and pledges can never add up to more than the price.
- **Private by default:** guests never see who gave what or how much. Link-only, password or invite-only access; hide individual items; hide reserved gifts.
- **UPI native:** money goes straight to the couple's UPI ID (deep link + QR). Zero fees. Guests can attach a payment screenshot. Optional Razorpay checkout.
- **Family mode:** parents help manage the registry from their own phone. Only the couple can change where money goes.
- **Thank-you notes:** generated in Hindi or English, three tones, one tap to WhatsApp.
- **The vahi:** a traditional, print-ready ledger (Save as PDF) plus CSV for Excel, including cash envelopes entered at the venue.
- **Share card + QR:** drawn in the browser, so Hindi names render properly.
- **Hindi + English**, large touch targets, installable PWA, light on low-end Android.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

With no configuration the app uses an **embedded Postgres (PGlite)** stored in `./.data` and runs in **demo mode**, where the login code is shown on screen instead of being sent by SMS.

```bash
npm test             # 19 unit tests: money maths, link parser, SSRF guard, signatures,
                     # OTP resend/lockout, shared rate limits, image checks (in-memory Postgres)
npm run build && INSECURE_COOKIES=1 DEMO_MODE=true AUTH_SECRET=some-long-secret npm start
npm run test:e2e     # full browser walkthrough + axe accessibility audit of 11 screens
npm run typecheck && npm run lint
```

## Going to production

Copy `.env.example` to `.env.local` (or set these in your host):

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | **Required.** Long random string that signs sessions and access grants. |
| `NEXT_PUBLIC_APP_URL` | Public origin, e.g. `https://giftr.in`. |
| `DATABASE_URL` | Any Postgres. **Supabase** works out of the box (use the pooler URI). Migrations in `drizzle/` run on boot; set `DB_AUTO_MIGRATE=false` to run them yourself. |
| `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` | Real SMS login codes via MSG91. Without these, set `DEMO_MODE=true` only for demos. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Optional gateway checkout. Point a Razorpay webhook (`payment.captured`, `order.paid`, `payment.failed`) at `/api/razorpay/webhook`. |
| `PLATFORM_FEE_PERCENT` | Fee recorded on Razorpay contributions (default 2.5). |

Deploy anywhere Node runs (Vercel, Railway, Fly, a VPS). On serverless hosts you must set `DATABASE_URL`, because the embedded database needs a persistent disk. Your proxy must set `X-Real-IP` (or append to `X-Forwarded-For`) for rate limits to see the real client.

## Design system

The UI is built on **[Astryx](https://github.com/meta/astryx)** (`@astryxdesign/core` 0.7.15) with Tailwind for layout.

- **Theme:** `src/themes/vivah/vivahTheme.ts` extends Astryx's "chocolate" theme: sindoor red accent, marigold highlights, ivory paper, **Mukta** body text (Latin + Devanagari on one baseline) and **Fraunces** headings. Secondary text is darkened to meet WCAG AA. Rebuild with `npx astryx theme build src/themes/vivah/vivahTheme.ts`.
- **Per-registry colour:** couples pick Sindoor, Marigold, Mehendi or Peacock; `src/lib/theme-style.ts` re-points the Astryx accent tokens for that registry's pages only.
- **Components used:** Button, IconButton, Card, ClickableCard, SelectableCard, TextInput, TextArea, DateInput, Selector, Switch, ToggleButton, SegmentedControl, Stepper, BottomSheet, Banner, Badge, Avatar, ProgressBar, EmptyState, Heading, Text, Toast.
- **Logo:** a gift tied with a bow on a sindoor tile with a marigold knot (`src/components/brand.tsx`, `public/icon.svg`, generated PWA icons at `/icons/*`).

## How it works

### The journey

```
Couple                               Guest                               Couple
------                               -----                               ------
/  -> /login (phone code)
/new  2-step wizard
/dashboard/[slug]                    /r/[slug]   (or /i/[token] invite)
  ├ wishlist link / own photo / essentials   ├ reserve a gift, buy anywhere
  ├ settings UPI ID, privacy, family         └ send shagun: UPI app / QR
  └ share    WhatsApp, QR card                 + optional screenshot  ->  Shagun tab: "Did this arrive?"
                                                                          ├ confirm / not received
                                                                          ├ thank-you note on WhatsApp
                                                                          └ ledger (PDF / CSV)
```

### How shagun reaches the couple

**Direct UPI (default, zero fee).** The guest picks an amount and gets a `upi://pay` deep link (on phones) and a QR (for any UPI app). Money moves bank to bank and Giftr never holds it. Because a transfer between two people can't be seen by a third party, the guest taps **"I've paid"**, optionally with a screenshot or UTR number, and the couple confirms it with one tap once they see it in their UPI app. Only confirmed shagun counts in totals and the ledger.

**Pledge.** "I'll give it in person" tells the couple what to expect; they confirm when the envelope arrives.

**Razorpay (optional).** When keys are set, guests also get card, netbanking and wallet checkout. These are verified by signature and by webhook and confirm automatically.

### Privacy and security model

- The guest page is built from an explicit allow-list of fields. Other guests' names, numbers, messages and amounts never reach a browser.
- Fund totals are hidden from guests unless the couple turns them on. Chip-in gifts always show the amount still needed, so nobody over-gives.
- `link`: unlisted, every registry page is `noindex`. `password`: changing it invalidates earlier unlocks. `invite`: one personal link per guest; deleting it revokes access, and invite links stop working if the registry switches mode.
- A locked registry reveals nothing, not even the couple's names in link previews.
- Anonymous gifts store no name.
- Login codes: hashed, 10-minute expiry, 5 attempts per phone spent atomically. Resending never cancels a code already received, so a stranger pressing "send" cannot lock you out.
- Rate limits live in Postgres and hold across app instances.
- Uploaded pictures are checked by their bytes (JPEG, PNG, WebP only), stored in an `images` table and served from `/img/[id]` with a sandboxing CSP.
- Product link fetching pins the DNS answer it validated, blocking rebinding tricks against internal addresses.

### Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, React 19, server components + server actions |
| UI | Astryx design system (custom Vivah theme) + Tailwind CSS v4, lucide icons |
| Data | Drizzle ORM on Postgres (Supabase or any) in production, PGlite locally: one schema, one set of migrations |
| Auth | Phone OTP, signed JWT session cookie |
| Payments | UPI deep links + QR; Razorpay orders, checkout, webhook |
| i18n | Co-located bilingual strings, `tr("Reserve", "रिज़र्व करें")`, language in a cookie |
| PWA | Web manifest, generated icons, service worker (network-first pages, cached assets, offline page) |

```
src/
  app/
    page.tsx                  landing
    login/  new/              sign-in, creation wizard
    dashboard/[slug]/         overview · wishlist · shagun · share · settings · ledger
    r/[slug]/                 guest registry (reserve, shagun, unlock)
    i/[token]/  img/[id]/     invite link, uploaded pictures
    actions/                  server actions: auth, registry, items, shagun, guest
    api/                      ledger CSV, Razorpay webhook
  components/                 Astryx-based kit: sheet, photo picker, amount chips, entry list…
  themes/vivah/               Astryx theme source + built CSS
  lib/
    db/schema.ts   tables          compute.ts   totals, chip-in maths, thank-you notes
    auth.ts        sessions        otp.ts       code issue/verify
    limits.ts      rate limits     images.ts    upload checks + storage
    link-preview.ts product parser + SSRF guard
drizzle/                      SQL migrations
tests/                        unit + DB tests, Playwright walkthrough with axe
```

### Data model

`users` · `otp_codes` · `registries` · `registry_members` (family mode) · `items` (products and funds) · `reservations` · `contributions` (UPI, Razorpay, cash; `initiated → pending → confirmed/rejected`; optional proof screenshot) · `invites` · `images` · `rate_limits`. Amounts are whole rupees.

## Known limits

- **Google sign-in is not built.** Phone OTP is the only login.
- **Never tested against live services:** MSG91 SMS, Razorpay keys, real UPI apps, a remote Postgres. All tests use embedded PGlite and on-screen demo codes.
- **Direct UPI is confirmed by the couple,** not by the bank. Some UPI apps restrict `upi://` links to personal IDs; the QR and "copy UPI ID" cover that.
- **Gateway money** lands in the platform's Razorpay account; paying couples out (e.g. Razorpay Route) and fee collection are not automated.
- **Link fetching is best-effort.** Amazon often blocks servers; the fallback is a title guessed from the URL plus the couple's own photo and price. A paid scraping provider would make this reliable.
- **Pictures live in Postgres.** Fine for a pilot; move `lib/images.ts` to Supabase Storage or S3 at scale.
- **OTP send quota can still be used up** by someone who knows your number (5 per hour). Existing codes keep working; a CAPTCHA would close this fully.
- **Accessibility:** automated axe checks pass (no serious or critical WCAG A/AA issues on 11 screens). No screen-reader or manual audit yet. Hindi copy has not had a native-speaker review.
- **Dark mode is off;** the theme defines dark values but the festive palette is tuned for light.
- Languages: Hindi and English only. No realtime push; dashboards refresh on navigation.
