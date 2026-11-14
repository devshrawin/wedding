import Link from "next/link";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { ArrowRight, BookOpenText, Check, EyeOff, Languages, Link2, MessageCircle, QrCode, ShieldCheck, Smartphone, Users } from "lucide-react";
import { Logo, Mark, Toran } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { getUser } from "@/lib/auth";
import { getTr } from "@/lib/i18n";

export default async function Landing() {
  const [{ tr }, user] = await Promise.all([getTr(), getUser()]);
  const cta = user ? "/dashboard" : "/new";

  const steps = [
    { n: "1", t: tr("Create", "बनाइए"), d: tr("Names, date, city. Ready in about a minute.", "नाम, तारीख़, शहर। लगभग एक मिनट में तैयार।") },
    { n: "2", t: tr("Add wishes", "पसंद जोड़िए"), d: tr("Paste an Amazon or Flipkart link, tick essentials, or open a shagun fund.", "Amazon या Flipkart का लिंक डालें, ज़रूरी सामान चुनें, या शगुन फंड खोलें।") },
    { n: "3", t: tr("Share on WhatsApp", "WhatsApp पर भेजिए"), d: tr("Guests reserve a gift or send shagun by UPI. No app, no login.", "मेहमान तोहफ़ा चुनें या UPI से शगुन भेजें। न ऐप, न लॉगिन।") },
  ];

  const features = [
    { icon: ShieldCheck, t: tr("Private by default", "शुरू से निजी"), d: tr("Guests never see who gave what, or how much. Add a password or go invite-only.", "मेहमान नहीं देख सकते कि किसने क्या या कितना दिया। पासवर्ड लगाएँ या सिर्फ़ आमंत्रितों के लिए रखें।") },
    { icon: Smartphone, t: tr("Shagun by UPI", "UPI से शगुन"), d: tr("Money goes straight to your UPI ID through PhonePe, GPay, Paytm or any app. Zero fees.", "पैसा सीधे आपकी UPI ID पर, PhonePe, GPay, Paytm, कोई भी ऐप। कोई शुल्क नहीं।") },
    { icon: Link2, t: tr("Paste any link", "कोई भी लिंक डालें"), d: tr("Amazon, Flipkart, Myntra, Pepperfry, Croma… or add a gift with your own photo.", "Amazon, Flipkart, Myntra, Pepperfry, Croma… या अपनी फ़ोटो के साथ तोहफ़ा जोड़ें।") },
    { icon: EyeOff, t: tr("No more duplicates", "डुप्लिकेट तोहफ़े बंद"), d: tr("Once a gift is reserved, nobody else can pick it. Three mixers, never again.", "तोहफ़ा चुन लिया गया तो कोई और नहीं चुन सकता। तीन-तीन मिक्सर अब नहीं।") },
    { icon: BookOpenText, t: tr("The family vahi", "परिवार की बही"), d: tr("Every shagun, online or in an envelope, in one tidy printable ledger.", "हर शगुन, ऑनलाइन हो या लिफ़ाफ़े में, एक साफ़, छपने लायक बही में।") },
    { icon: Users, t: tr("Family mode", "फ़ैमिली मोड"), d: tr("Let Mummy-Papa help manage the registry from their own phone.", "मम्मी-पापा अपने फ़ोन से रजिस्ट्री सँभालने में मदद कर सकते हैं।") },
    { icon: MessageCircle, t: tr("Thank-you notes", "धन्यवाद संदेश"), d: tr("Warm notes written for you in Hindi or English. One tap to WhatsApp.", "हिंदी या अंग्रेज़ी में आत्मीय संदेश, एक टैप में WhatsApp पर।") },
    { icon: QrCode, t: tr("Card with QR", "QR वाला कार्ड"), d: tr("A beautiful card for your invitation and the shagun counter.", "निमंत्रण पत्र और शगुन काउंटर के लिए सुंदर कार्ड।") },
    { icon: Languages, t: tr("Hindi + English", "हिंदी + English"), d: tr("Big buttons and plain words, so Dadi and Nani can use it too.", "बड़े बटन और आसान शब्द, ताकि दादी-नानी भी चला सकें।") },
  ];

  return (
    <div className="bg-festive">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <LangToggle />
          <span className="hidden sm:block">
            <Button variant="ghost" href={user ? "/dashboard" : "/login"} label={user ? tr("Dashboard", "डैशबोर्ड") : tr("Sign in", "लॉग इन")} />
          </span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pt-14">
          <div>
            <Badge variant="orange" label={tr("Wedding registry + shagun", "शादी की रजिस्ट्री + शगुन")} />
            <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-primary sm:text-[3.6rem]">
              {tr("Gifts you'll actually use.", "तोहफ़े, जो सच में काम आएँ।")}{" "}
              <span className="text-accent">{tr("Shagun without the notebook.", "शगुन, बिना कॉपी-पेन के।")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary">
              {tr(
                "One link for your wedding. Guests pick a gift you really want or send shagun by UPI. You get a tidy record, and nobody sees what anyone else gave.",
                "आपकी शादी के लिए एक लिंक। मेहमान आपकी पसंद का तोहफ़ा चुनें या UPI से शगुन भेजें, आपको मिलता है साफ़ हिसाब, और कोई नहीं जानता कि किसने क्या दिया।",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                href={cta}
                label={user ? tr("Open my registry", "मेरी रजिस्ट्री खोलें") : tr("Create your free registry", "अपनी मुफ़्त रजिस्ट्री बनाएँ")}
                endContent={<ArrowRight className="size-5" aria-hidden />}
              />
              {!user && (
                <span className="sm:hidden">
                  <Button size="lg" width="100%" href="/login" label={tr("I already have one, sign in", "पहले से है, लॉग इन करें")} />
                </span>
              )}
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-secondary">
              {[tr("About 60 seconds", "लगभग 60 सेकंड"), tr("No app to download", "कोई ऐप नहीं"), tr("Free for couples", "जोड़ों के लिए मुफ़्त")].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Check className="size-4 text-leaf" aria-hidden /> {x}
                </li>
              ))}
            </ul>
          </div>

          {/* Phone-like preview of a guest page */}
          <div className="relative mx-auto w-full max-w-[22rem]" aria-hidden>
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(242,163,27,0.25),transparent)]" />
            <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-lg">
              <div className="bg-dots relative bg-[var(--color-accent)] px-6 pb-8 pt-6 text-center text-white">
                <Toran className="mx-auto h-5 w-44 text-white" />
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-white/75">{tr("Shubh Vivah", "॥ शुभ विवाह ॥")}</p>
                <p className="mt-1 font-display text-[2rem] font-semibold leading-tight text-white">{tr("Ananya & Rohan", "अनन्या & रोहन")}</p>
                <p className="mt-1 text-[15px] text-white/80">{tr("12 Feb 2027 · Jaipur", "12 फ़र. 2027 · जयपुर")}</p>
              </div>
              <div className="space-y-2.5 p-4">
                {[
                  { e: "✈️", t: tr("Honeymoon Fund", "हनीमून फंड"), s: tr("Send shagun", "शगुन भेजें"), done: false },
                  { e: "🌀", t: tr("Mixer Grinder", "मिक्सर ग्राइंडर"), s: tr("Reserved", "चुन लिया गया"), done: true },
                  { e: "🍟", t: tr("Air Fryer", "एयर फ्रायर"), s: "₹6,500", done: false },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                    <div className="grid size-11 place-items-center rounded-lg bg-brand-soft text-2xl">{r.e}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-primary">{r.t}</p>
                      <p className={r.done ? "text-sm font-semibold text-leaf" : "text-sm text-secondary"}>{r.s}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  {["₹501", "₹1,101", "₹2,101"].map((a, i) => (
                    <span key={a} className={i === 1 ? "flex-1 rounded-lg bg-[var(--color-accent)] py-2 text-center text-sm font-semibold text-white" : "flex-1 rounded-lg border border-border py-2 text-center text-sm font-semibold text-primary"}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <p className="text-5xl" aria-hidden>
              🌀🌀🌀
            </p>
            <Heading level={2} justify="center" textWrap="balance">
              {tr("Three mixers. Four dinner sets. Zero fridge.", "तीन मिक्सर। चार डिनर सेट। फ्रिज एक भी नहीं।")}
            </Heading>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary">
              {tr(
                "Everyone wants to give you something useful. They just don't know what. Giftr tells them gently, and keeps the chandlo notebook for you.",
                "हर कोई आपको काम की चीज़ देना चाहता है, बस पता नहीं होता क्या। Giftr प्यार से बता देता है, और चांदलो की कॉपी भी सँभाल लेता है।",
              )}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <Heading level={2} justify="center">
            {tr("Three steps. That's it.", "बस तीन कदम।")}
          </Heading>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n}>
                <Card padding={6}>
                  <span className="grid size-11 place-items-center rounded-full bg-[var(--color-accent)] font-display text-xl font-semibold text-white">{s.n}</span>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-primary">{s.t}</h3>
                  <p className="mt-2 text-secondary">{s.d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-muted">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <p className="text-center text-[13px] font-bold uppercase tracking-[0.14em] text-gold">{tr("Made for Indian weddings", "भारतीय शादियों के लिए बना")}</p>
            <div className="mt-2">
              <Heading level={2} justify="center">
                {tr("Everything a shaadi needs", "शादी के लिए जो भी चाहिए")}
              </Heading>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.t}>
                  <Card padding={5} minHeight="100%">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-accent">
                      <f.icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-primary">{f.t}</h3>
                    <Text as="p" type="supporting" display="block">
                      {f.d}
                    </Text>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="font-display text-7xl font-semibold text-accent">₹501</p>
          <div className="mt-3">
            <Heading level={2} justify="center">
              {tr("We remember the extra rupee.", "वो एक रुपया हमें याद है।")}
            </Heading>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-lg text-secondary">
            {tr(
              "Shagun never ends in zero. The extra rupee means the blessing continues. Giftr suggests ₹501, ₹1,101, ₹2,101 by default.",
              "शगुन कभी शून्य पर खत्म नहीं होता, वह एक रुपया बताता है कि आशीर्वाद चलता रहे। Giftr अपने आप ₹501, ₹1,101, ₹2,101 सुझाता है।",
            )}
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="primary" size="lg" href={cta} label={tr("Start your registry", "रजिस्ट्री शुरू करें")} endContent={<ArrowRight className="size-5" aria-hidden />} />
          </div>
          <p className="mt-4 text-[15px] text-secondary">{tr("Free for couples. Direct UPI shagun has zero fees.", "जोड़ों के लिए मुफ़्त। सीधे UPI शगुन पर कोई शुल्क नहीं।")}</p>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 text-[15px] text-secondary sm:flex-row sm:px-6">
          <span className="inline-flex items-center gap-2">
            <Mark className="size-7" /> Giftr
          </span>
          <p>{tr("Made with love in India 🇮🇳", "भारत में प्यार से बना 🇮🇳")}</p>
          <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
            {tr("Sign in", "लॉग इन")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
