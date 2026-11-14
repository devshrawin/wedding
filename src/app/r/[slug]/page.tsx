import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Lock } from "lucide-react";
import { Mark, Lights } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { checkAccess, getGuestKey } from "@/lib/auth";
import { getRegistryBySlug, loadRegistryData, razorpayEnabled } from "@/lib/data";
import { getTr } from "@/lib/i18n";
import { registryThemeStyle } from "@/lib/theme-style";
import { giftWordFor, greetingFor } from "@/lib/traditions";
import { daysUntil, formatDate } from "@/lib/utils";
import { GuestRegistry, type GuestItem } from "./guest-registry";
import { UnlockForm } from "./unlock-form";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const registry = await getRegistryBySlug((await params).slug);
  if (!registry) return { title: "Registry not found" };
  // Private registries reveal nothing in link previews.
  const open = registry.visibility === "link";
  const title = open ? `${registry.partnerOne} & ${registry.partnerTwo}: Wedding Registry` : "Private wedding registry";
  return {
    title,
    description: "Bless the couple: pick a gift they'll love, or send a cash gift by UPI.",
    robots: { index: false, follow: false },
    openGraph: { title, description: "Pick a gift they'll love, or send a cash gift by UPI.", type: "website" },
  };
}

export default async function GuestPage({ params }: Params) {
  const { slug } = await params;
  const registry = await getRegistryBySlug(slug);
  if (!registry) notFound();
  const [{ tr, lang }, access] = await Promise.all([getTr(), checkAccess(registry)]);
  const style = registryThemeStyle(registry.theme);

  if (!access.allowed) {
    return (
      <div style={style} className="bg-festive min-h-dvh">
        <div className="mx-auto flex max-w-md justify-end px-4 pt-4">
          <LangToggle />
        </div>
        <main className="mx-auto max-w-md px-4 pb-16 pt-8">
          <Card padding={6} elevation="low">
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-accent">
                <Lock className="size-7" aria-hidden />
              </span>
              <div className="mt-4">
                <Heading level={1} justify="center">
                  {tr("This registry is private", "यह रजिस्ट्री निजी है")}
                </Heading>
              </div>
              <Text as="p" type="supporting" display="block" justify="center">
                {registry.visibility === "password"
                  ? tr("Enter the password the couple shared with you.", "जोड़े का बताया हुआ पासवर्ड डालें।")
                  : tr("It opens only with a personal invite link. Please use the link the couple sent you on WhatsApp.", "यह सिर्फ़ निजी आमंत्रण लिंक से खुलती है। कृपया जोड़े का WhatsApp पर भेजा हुआ लिंक खोलें।")}
              </Text>
            </div>
            {registry.visibility === "password" && <UnlockForm slug={slug} />}
          </Card>
        </main>
      </div>
    );
  }

  const [data, guestKey] = await Promise.all([loadRegistryData(registry.id), getGuestKey()]);
  const isManager = access.via === "manager";

  // Everything sent to the browser is built here — never raw rows. Guests must not
  // learn who gave what; amounts are included only when the couple opted in.
  const items: GuestItem[] = data.items
    .filter((i) => !i.hidden)
    .map((i) => {
      const mine = guestKey ? data.reservations.find((r) => r.itemId === i.id && r.guestKey === guestKey && r.status !== "cancelled") : undefined;
      const hasChipIns = i.raised > 0;
      const state: GuestItem["state"] = i.kind === "fund" ? "open" : i.fulfilled ? (i.reservedQty > 0 ? "reserved" : "funded") : "available";
      return {
        id: i.id,
        kind: i.kind as "product" | "fund",
        title: i.title,
        description: i.description,
        imageUrl: i.imageUrl,
        icon: i.icon,
        url: i.url,
        store: i.store,
        category: i.category,
        price: i.price,
        quantity: i.quantity,
        remainingQty: i.remainingQty,
        state,
        canReserve: i.kind === "product" && !i.fulfilled && !hasChipIns,
        canChipIn: i.kind === "fund" || (i.allowChipIn && !i.fulfilled && i.reservedQty === 0 && (i.chipInLeft ?? 0) > 0),
        // Chip-in gifts always show what's left, so guests don't over-give.
        chipInLeft: i.kind === "product" && i.allowChipIn ? i.chipInLeft : null,
        progress: registry.showAmounts && i.target ? i.progress : null,
        raised: registry.showAmounts ? i.raised : null,
        target: i.kind === "fund" || i.allowChipIn ? i.target : null,
        mine: mine ? { id: mine.id, status: mine.status as "reserved" | "purchased", quantity: mine.quantity } : null,
      };
    })
    .filter((i) => !(registry.hideReserved && i.state !== "available" && i.state !== "open" && !i.mine));

  const days = daysUntil(registry.weddingDate);
  // Letter-spacing suits Latin capitals but breaks joined scripts (Devanagari, Arabic, Gurmukhi).
  const greeting = greetingFor(registry, lang);

  return (
    <div style={style} className="min-h-dvh bg-body">
      {isManager && (
        <div className="bg-[var(--color-background-inverted)] px-4 py-2.5 text-center text-[15px] text-white">
          {tr("You're viewing your page as guests see it.", "आप अपना पेज वैसे देख रहे हैं जैसे मेहमान देखते हैं।")}{" "}
          <Link href={`/dashboard/${slug}`} className="font-semibold underline underline-offset-4">
            {tr("Back to dashboard", "डैशबोर्ड पर लौटें")}
          </Link>
        </div>
      )}

      <header className="bg-dots relative overflow-hidden bg-[var(--color-accent)] px-4 pb-12 pt-4 text-center text-white">
        {registry.ambient && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {[8, 22, 37, 51, 66, 79, 91].map((left, n) => (
              <span
                key={left}
                className="petal"
                style={{ left: `${left}%`, "--d": `${11 + (n % 3) * 3}s`, "--delay": `${-n * 1.9}s`, "--x": `${n % 2 ? -30 : 34}px` } as React.CSSProperties}
              />
            ))}
          </div>
        )}
        <div className="relative mx-auto flex max-w-2xl justify-end">
          <span className="rounded-full bg-white/95">
            <LangToggle />
          </span>
        </div>
        <div className="relative mx-auto max-w-2xl">
          <Lights className="mx-auto mt-2 h-6 w-56 text-white" mode={registry.ambient ? "loop" : "once"} />
          {registry.photo ? <img src={registry.photo} alt={tr(`${registry.partnerOne} and ${registry.partnerTwo}`, `${registry.partnerOne} और ${registry.partnerTwo}`)} className="mx-auto mt-5 size-32 rounded-full border-4 border-white/90 object-cover shadow-lg" /> : null}
          <p className={/^[\x00-\x7F]*$/.test(greeting) ? "mt-5 text-[13px] font-bold uppercase tracking-[0.24em] text-white/80" : "mt-5 text-[17px] font-semibold text-white/85"}>{greeting}</p>
          <h1 className="anim-page mt-2 font-display text-[2.6rem] font-semibold leading-tight text-white sm:text-5xl">
            {registry.partnerOne} <span className="text-marigold">&</span> {registry.partnerTwo}
          </h1>
          {(registry.weddingDate || registry.city) && <p className="mt-2 text-lg text-white/90">{[formatDate(registry.weddingDate, lang), registry.city].filter(Boolean).join(" · ")}</p>}
          {days != null && days > 0 && (
            <p className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-[15px] font-semibold">{tr(`${days} day${days > 1 ? "s" : ""} to go`, `${days} दिन बाकी`)}</p>
          )}
          {access.inviteName && (
            <p className="mt-4 text-[17px] text-white/95">
              {tr(`Welcome, ${access.inviteName}`, `${access.inviteName}, आपका स्वागत है`)}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <div className="relative -mt-6">
          <Card padding={5} elevation="low">
            <p className="text-center text-[17px] leading-relaxed text-primary">
              {registry.note ||
                tr(
                  "Your presence is the greatest gift. If you'd still like to bless us, here are a few things that would help us start our new home.",
                  "आपका आना ही सबसे बड़ा तोहफ़ा है। फिर भी अगर आप आशीर्वाद देना चाहें, तो ये कुछ चीज़ें हमारे नए घर की शुरुआत में काम आएँगी।",
                )}
            </p>
          </Card>
        </div>

        <GuestRegistry
          slug={slug}
          couple={`${registry.partnerOne} & ${registry.partnerTwo}`}
          items={items}
          upi={registry.upiId ? { id: registry.upiId, name: registry.upiName || registry.partnerOne } : null}
          razorpay={razorpayEnabled()}
          guestName={access.inviteName ?? null}
          giftWord={giftWordFor(registry, lang)}
        />
      </main>

      <footer className="border-t border-border bg-surface px-4 py-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-[15px] text-secondary underline-offset-4 hover:underline">
          <Mark className="size-6" />
          {tr("Made with Giftr. Create your own registry for free", "Giftr से बना। अपनी रजिस्ट्री मुफ़्त बनाएँ")}
        </Link>
      </footer>
    </div>
  );
}
