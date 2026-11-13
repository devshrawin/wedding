import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { Mark, Toran } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { checkAccess, getGuestKey } from "@/lib/auth";
import { getRegistryBySlug, loadRegistryData, razorpayEnabled } from "@/lib/data";
import { getTr } from "@/lib/i18n";
import { daysUntil, formatDate, themeOf } from "@/lib/utils";
import { GuestRegistry, type GuestItem } from "./guest-registry";
import { UnlockForm } from "./unlock-form";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const registry = await getRegistryBySlug((await params).slug);
  if (!registry) return { title: "Registry not found" };
  // Private registries reveal nothing in link previews.
  const open = registry.visibility === "link";
  const title = open ? `${registry.partnerOne} & ${registry.partnerTwo} — Wedding Registry` : "Private wedding registry";
  return {
    title,
    description: "Bless the couple: pick a gift they'll love, or send shagun by UPI.",
    robots: { index: false, follow: false },
    openGraph: { title, description: "Pick a gift they'll love, or send shagun by UPI.", type: "website" },
  };
}

export default async function GuestPage({ params }: Params) {
  const { slug } = await params;
  const registry = await getRegistryBySlug(slug);
  if (!registry) notFound();
  const [{ tr, lang }, access] = await Promise.all([getTr(), checkAccess(registry)]);
  const theme = themeOf(registry.theme);
  const style = { "--primary": theme.primary, "--primary-soft": theme.soft, "--primary-deep": theme.deep } as React.CSSProperties;

  if (!access.allowed) {
    return (
      <div style={style} className="bg-festive min-h-dvh">
        <div className="mx-auto flex max-w-md justify-end px-5 pt-4">
          <LangToggle />
        </div>
        <main className="mx-auto max-w-md px-5 pb-16 pt-10 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
            <Lock className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold">{tr("This registry is private", "यह रजिस्ट्री निजी है")}</h1>
          {registry.visibility === "password" ? (
            <>
              <p className="mt-2 text-muted">{tr("Enter the password the couple shared with you.", "जोड़े का बताया हुआ पासवर्ड डालें।")}</p>
              <UnlockForm slug={slug} />
            </>
          ) : (
            <p className="mt-2 text-muted">
              {tr("It opens only with a personal invite link. Please use the link the couple sent you on WhatsApp.", "यह सिर्फ़ निजी आमंत्रण लिंक से खुलती है। कृपया जोड़े का WhatsApp पर भेजा हुआ लिंक खोलें।")}
            </p>
          )}
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
        emoji: i.emoji,
        url: i.url,
        store: i.store,
        category: i.category,
        price: i.price,
        quantity: i.quantity,
        remainingQty: i.remainingQty,
        state,
        canReserve: i.kind === "product" && !i.fulfilled && !hasChipIns,
        canChipIn: i.kind === "fund" || (i.allowChipIn && !i.fulfilled && i.reservedQty === 0),
        progress: registry.showAmounts && i.target ? i.progress : null,
        raised: registry.showAmounts ? i.raised : null,
        target: i.kind === "fund" || i.allowChipIn ? i.target : null,
        mine: mine ? { id: mine.id, status: mine.status as "reserved" | "purchased", quantity: mine.quantity } : null,
      };
    })
    .filter((i) => !(registry.hideReserved && i.state !== "available" && i.state !== "open" && !i.mine));

  const days = daysUntil(registry.weddingDate);

  return (
    <div style={style} className="min-h-dvh bg-cream">
      {isManager && (
        <div className="bg-ink px-4 py-2.5 text-center text-[15px] text-white">
          {tr("You're viewing your page as guests see it.", "आप अपना पेज वैसे देख रहे हैं जैसे मेहमान देखते हैं।")}{" "}
          <Link href={`/dashboard/${slug}`} className="font-semibold underline">
            {tr("Back to dashboard", "डैशबोर्ड पर लौटें")}
          </Link>
        </div>
      )}

      <header className="relative overflow-hidden bg-primary px-5 pb-10 pt-4 text-center text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1.5px, transparent 0)", backgroundSize: "22px 22px" }} aria-hidden />
        <div className="relative mx-auto flex max-w-2xl justify-end">
          <LangToggle className="border-white/30 bg-white/95" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <Toran className="mx-auto mt-2 h-6 w-52 text-white" />
          {registry.photo ? (
            <img src={registry.photo} alt="" className="mx-auto mt-5 size-32 rounded-full border-4 border-white/90 object-cover shadow-lg" />
          ) : null}
          <p className="mt-5 text-[13px] font-bold uppercase tracking-[0.22em] text-white/75">{tr("Shubh Vivah", "॥ शुभ विवाह ॥")}</p>
          <h1 className="mt-2 text-[2.5rem] font-semibold leading-tight sm:text-5xl">
            {registry.partnerOne} <span className="text-marigold">&</span> {registry.partnerTwo}
          </h1>
          {(registry.weddingDate || registry.city) && (
            <p className="mt-2 text-lg text-white/85">{[formatDate(registry.weddingDate, lang), registry.city].filter(Boolean).join(" · ")}</p>
          )}
          {days != null && days > 0 && (
            <p className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-[15px] font-semibold">
              {tr(`${days} day${days > 1 ? "s" : ""} to go`, `${days} दिन बाकी`)}
            </p>
          )}
          {access.inviteName && (
            <p className="mt-4 text-[17px] text-white/90">
              {tr(`Welcome, ${access.inviteName}`, `${access.inviteName}, आपका स्वागत है`)} 🙏
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <div className="card relative -mt-5 p-5 text-center">
          <p className="text-[17px] leading-relaxed text-ink">
            {registry.note ||
              tr(
                "Your presence is the greatest gift. If you'd still like to bless us, here are a few things that would help us start our new home.",
                "आपका आना ही सबसे बड़ा तोहफ़ा है। फिर भी अगर आप आशीर्वाद देना चाहें, तो ये कुछ चीज़ें हमारे नए घर की शुरुआत में काम आएँगी।",
              )}
          </p>
        </div>

        <GuestRegistry
          slug={slug}
          couple={`${registry.partnerOne} & ${registry.partnerTwo}`}
          items={items}
          upi={registry.upiId ? { id: registry.upiId, name: registry.upiName || registry.partnerOne } : null}
          razorpay={razorpayEnabled()}
          guestName={access.inviteName ?? null}
        />
      </main>

      <footer className="border-t border-line px-5 py-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-[15px] text-muted">
          <Mark className="size-6" />
          {tr("Made with Giftr — create your own registry, free", "Giftr से बना — अपनी रजिस्ट्री मुफ़्त बनाएँ")}
        </Link>
      </footer>
    </div>
  );
}
