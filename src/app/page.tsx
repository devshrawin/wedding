import Link from "next/link";
import { ArrowRight, BookOpenText, EyeOff, Languages, Link2, MessageCircle, QrCode, ShieldCheck, Smartphone, Users } from "lucide-react";
import { Logo, Toran } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { buttonClass } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { getTr } from "@/lib/i18n";

export default async function Landing() {
  const [{ tr }, user] = await Promise.all([getTr(), getUser()]);
  const cta = user ? "/dashboard" : "/new";

  const steps = [
    { n: "1", t: tr("Create", "बनाइए"), d: tr("Names, date, city. Done in under a minute.", "नाम, तारीख़, शहर। एक मिनट से भी कम में तैयार।") },
    { n: "2", t: tr("Add wishes", "पसंद जोड़िए"), d: tr("Paste any Amazon or Flipkart link, pick essentials, or add a shagun fund.", "Amazon या Flipkart का लिंक डालें, ज़रूरी सामान चुनें, या शगुन फंड बनाएँ।") },
    { n: "3", t: tr("Share on WhatsApp", "WhatsApp पर भेजिए"), d: tr("Guests reserve a gift or send shagun by UPI. No app, no login.", "मेहमान तोहफ़ा चुनें या UPI से शगुन भेजें। न ऐप, न लॉगिन।") },
  ];

  const features = [
    { icon: ShieldCheck, t: tr("Private by default", "शुरू से निजी"), d: tr("Guests never see who gave what, or how much. Add a password or go invite-only.", "मेहमान यह नहीं देख सकते कि किसने क्या या कितना दिया। पासवर्ड लगाएँ या सिर्फ़ आमंत्रितों के लिए रखें।") },
    { icon: Smartphone, t: tr("Shagun by UPI", "UPI से शगुन"), d: tr("Money goes straight to your UPI ID — PhonePe, GPay, Paytm, any app.", "पैसा सीधे आपकी UPI ID पर — PhonePe, GPay, Paytm, कोई भी ऐप।") },
    { icon: Link2, t: tr("Paste any link", "कोई भी लिंक डालें"), d: tr("Amazon, Flipkart, Myntra, Pepperfry, Croma… we fetch the name, photo and price.", "Amazon, Flipkart, Myntra, Pepperfry, Croma… नाम, फ़ोटो और दाम हम ले आते हैं।") },
    { icon: EyeOff, t: tr("No more duplicates", "डुप्लिकेट तोहफ़े बंद"), d: tr("Once a gift is reserved, nobody else can pick it. Three mixers, never again.", "एक बार तोहफ़ा चुन लिया गया, तो कोई और नहीं चुन सकता। तीन-तीन मिक्सर अब नहीं।") },
    { icon: BookOpenText, t: tr("The family ledger", "परिवार का बही-खाता"), d: tr("Every shagun — online or in an envelope — in one tidy, printable vahi.", "हर शगुन — ऑनलाइन हो या लिफ़ाफ़े में — एक साफ़-सुथरी, छपने लायक बही में।") },
    { icon: Users, t: tr("Family mode", "फ़ैमिली मोड"), d: tr("Let Mummy-Papa manage the registry from their own phone.", "मम्मी-पापा अपने फ़ोन से रजिस्ट्री सँभाल सकते हैं।") },
    { icon: MessageCircle, t: tr("Thank-you notes", "धन्यवाद संदेश"), d: tr("Warm, personal notes written for you — one tap to send on WhatsApp.", "आपके लिए लिखे गए आत्मीय संदेश — एक टैप में WhatsApp पर।") },
    { icon: QrCode, t: tr("Cards & QR", "कार्ड और QR"), d: tr("A beautiful card with QR for your invitation and the shagun counter.", "निमंत्रण पत्र और शगुन काउंटर के लिए QR वाला सुंदर कार्ड।") },
    { icon: Languages, t: tr("Hindi + English", "हिंदी + English"), d: tr("Big buttons and simple words, so Dadi and Nani can use it too.", "बड़े बटन और आसान शब्द, ताकि दादी-नानी भी चला सकें।") },
  ];

  return (
    <div className="bg-festive">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LangToggle />
          <Link href={user ? "/dashboard" : "/login"} className={buttonClass({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
            {user ? tr("Dashboard", "डैशबोर्ड") : tr("Sign in", "लॉग इन")}
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div>
            <p className="eyebrow">{tr("Wedding registry + shagun", "शादी की रजिस्ट्री + शगुन")}</p>
            <h1 className="mt-3 text-[2.6rem] font-semibold text-ink sm:text-6xl">
              {tr("Gifts you'll actually use.", "तोहफ़े, जो सच में काम आएँ।")}{" "}
              <span className="text-primary">{tr("Shagun without the notebook.", "शगुन, बिना कॉपी-पेन के।")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              {tr(
                "One simple link for your wedding. Guests pick a gift you really want or send shagun by UPI — you get a tidy record, and nobody sees what anyone else gave.",
                "आपकी शादी के लिए एक आसान लिंक। मेहमान आपकी पसंद का तोहफ़ा चुनें या UPI से शगुन भेजें — आपको मिलता है साफ़ हिसाब, और कोई नहीं जान पाता कि किसने क्या दिया।",
              )}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={cta} className={buttonClass({ size: "lg" })}>
                {user ? tr("Go to my registry", "मेरी रजिस्ट्री खोलें") : tr("Create your registry — free", "अपनी रजिस्ट्री बनाएँ — मुफ़्त")}
                <ArrowRight className="size-5" />
              </Link>
              {!user && (
                <Link href="/login" className={buttonClass({ variant: "outline", size: "lg", className: "sm:hidden" })}>
                  {tr("Sign in", "लॉग इन")}
                </Link>
              )}
            </div>
            <p className="mt-4 text-[15px] text-muted">{tr("Takes about 60 seconds · No app to download", "लगभग 60 सेकंड · कोई ऐप डाउनलोड नहीं")}</p>
          </div>

          {/* Preview card */}
          <div className="relative mx-auto w-full max-w-sm" aria-hidden>
            <div className="card rotate-1 overflow-hidden p-0">
              <div className="bg-primary px-6 pb-7 pt-8 text-center text-white">
                <Toran className="mx-auto h-5 w-44 text-white" />
                <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-white/75">{tr("Shubh Vivah", "शुभ विवाह")}</p>
                <p className="mt-1 font-display text-3xl font-semibold">{tr("Ananya & Rohan", "अनन्या & रोहन")}</p>
                <p className="mt-1 text-[15px] text-white/80">{tr("12 February 2027 · Jaipur", "12 फ़रवरी 2027 · जयपुर")}</p>
              </div>
              <div className="space-y-3 p-4">
                {[
                  { e: "✈️", t: tr("Honeymoon Fund", "हनीमून फंड"), s: tr("Send shagun", "शगुन भेजें"), p: 62 },
                  { e: "🌀", t: tr("Mixer Grinder", "मिक्सर ग्राइंडर"), s: tr("Reserved ✓", "चुन लिया गया ✓"), p: 100 },
                  { e: "🍟", t: tr("Air Fryer", "एयर फ्रायर"), s: "₹6,500", p: 0 },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                    <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-2xl">{r.e}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.t}</p>
                      <p className={`text-sm ${r.p === 100 ? "text-leaf" : "text-muted"}`}>{r.s}</p>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  {["₹501", "₹1,101", "₹2,101", "₹5,101"].map((a, i) => (
                    <span key={a} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${i === 1 ? "border-primary bg-primary text-white" : "border-line"}`}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-white/70">
          <div className="mx-auto max-w-3xl px-5 py-14 text-center">
            <p className="text-5xl" aria-hidden>🌀🌀🌀</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{tr("Three mixers. Four dinner sets. Zero fridge.", "तीन मिक्सर। चार डिनर सेट। फ्रिज एक भी नहीं।")}</h2>
            <p className="mt-4 text-lg text-muted">
              {tr(
                "Everyone wants to give you something useful — they just don't know what. Giftr tells them gently, and keeps the chandlo notebook for you.",
                "हर कोई आपको काम की चीज़ देना चाहता है — बस पता नहीं होता कि क्या। Giftr प्यार से बता देता है, और चांदलो की कॉपी भी सँभाल लेता है।",
              )}
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">{tr("Three steps. That's it.", "बस तीन कदम।")}</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="card p-6">
                <span className="grid size-11 place-items-center rounded-full bg-primary font-display text-xl font-semibold text-white">{s.n}</span>
                <h3 className="mt-4 text-2xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="bg-sand/60">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <p className="eyebrow text-center">{tr("Made for Indian weddings", "भारतीय शादियों के लिए बना")}</p>
            <h2 className="mt-2 text-center text-3xl font-semibold sm:text-4xl">{tr("Everything a shaadi needs", "शादी के लिए जो भी चाहिए")}</h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.t} className="rounded-3xl border border-line bg-white p-5">
                  <f.icon className="size-7 text-primary" aria-hidden />
                  <h3 className="mt-3 text-xl font-semibold">{f.t}</h3>
                  <p className="mt-1.5 text-[16px] text-muted">{f.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* The +1 */}
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="font-display text-6xl font-semibold text-primary">₹501</p>
          <h2 className="mt-3 text-3xl font-semibold">{tr("We remember the extra rupee.", "वो एक रुपया हमें याद है।")}</h2>
          <p className="mt-3 text-lg text-muted">
            {tr(
              "Shagun never ends in zero — the one extra rupee means the blessing continues. Giftr suggests ₹501, ₹1,101, ₹2,101 by default.",
              "शगुन कभी शून्य पर खत्म नहीं होता — वह एक रुपया बताता है कि आशीर्वाद चलता रहे। Giftr अपने आप ₹501, ₹1,101, ₹2,101 सुझाता है।",
            )}
          </p>
          <Link href={cta} className={buttonClass({ size: "lg", className: "mt-8" })}>
            {tr("Start your registry", "रजिस्ट्री शुरू करें")}
            <ArrowRight className="size-5" />
          </Link>
          <p className="mt-4 text-[15px] text-muted">
            {tr("Free for couples. Direct UPI shagun has zero fees.", "जोड़ों के लिए मुफ़्त। सीधे UPI शगुन पर कोई शुल्क नहीं।")}
          </p>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-[15px] text-muted sm:flex-row">
          <Logo />
          <p>{tr("Made with love in India 🇮🇳", "भारत में प्यार से बना 🇮🇳")}</p>
        </div>
      </footer>
    </div>
  );
}
