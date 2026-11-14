"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Eye, Lock, MessageCircle, Trash2, UserPlus } from "lucide-react";
import { createInvites, deleteInvite } from "@/app/actions/registry";
import { useLang, useTr } from "@/components/lang";
import { CopyButton, toast } from "@/components/ui/feedback";
import { errorText } from "@/lib/result";
import { whatsappLink } from "@/lib/utils";
import { QrStudio } from "@/components/qr/qr-studio";

function WhatsAppButton({ href, label, size = "lg" }: { href: string; label: string; size?: "md" | "lg" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-element)] bg-whatsapp px-6 font-semibold text-white transition-[filter] hover:brightness-95 ${size === "lg" ? "h-13 text-[17px]" : "h-11"}`}
    >
      <MessageCircle className="size-5" aria-hidden /> {label}
    </a>
  );
}

type Props = {
  slug: string;
  origin: string;
  registry: {
    partnerOne: string;
    partnerTwo: string;
    dateText: string;
    /** line above the names: the couple's greeting or the neutral default */
    greeting: string;
    city: string | null;
    visibility: "link" | "password" | "invite";
    theme: { primary: string; deep: string; soft: string };
    photo: string | null;
  };
  invites: { id: string; token: string; guestName: string; opens: number }[];
};

export function SharePanel({ slug, origin, registry, invites }: Props) {
  const tr = useTr();
  const lang = useLang();
  // Prefer the real origin the couple is on (works on previews and custom domains).
  const [base, setBase] = useState(origin);
  useEffect(() => setBase(window.location.origin), []);
  const url = `${base}/r/${slug}`;
  const couple = `${registry.partnerOne} & ${registry.partnerTwo}`;
  const inviteOnly = registry.visibility === "invite";

  const message = (link: string, guest?: string) =>
    lang === "hi"
      ? `${guest ? `${guest} जी, ` : ""}नमस्ते!\n\nहमारी शादी में आपका आना ही सबसे बड़ा तोहफ़ा है। फिर भी अगर आप आशीर्वाद देना चाहें, तो हमने अपनी पसंद की छोटी-सी सूची बनाई है:\n\n${link}\n\nसप्रेम,\n${couple}`
      : `${guest ? `Dear ${guest}, ` : ""}Hello!\n\nYour presence at our wedding is the greatest gift. If you'd still like to bless us, we've put together a small wishlist:\n\n${link}\n\nWith love,\n${couple}`;

  return (
    <div className="space-y-6">
      <Heading level={1}>{tr("Share your registry", "रजिस्ट्री शेयर करें")}</Heading>

      {inviteOnly ? (
        <InviteManager slug={slug} base={base} invites={invites} message={message} />
      ) : (
        <Card padding={5}>
          <Heading level={2}>{tr("Your registry link", "आपकी रजिस्ट्री का लिंक")}</Heading>
          <p className="mt-3 break-all rounded-lg bg-muted px-4 py-3 font-mono text-[15px] text-primary">{url}</p>
          {registry.visibility === "password" && (
            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-secondary">
              <Lock className="size-4" aria-hidden /> {tr("Guests will need the password. Share it with them separately.", "मेहमानों को पासवर्ड चाहिए होगा, उसे अलग से बताएँ।")}
            </p>
          )}
          <div className="mt-4 grid gap-2.5">
            <WhatsAppButton href={whatsappLink(message(url))} label={tr("Share on WhatsApp", "WhatsApp पर भेजें")} />
            <div className="grid grid-cols-2 gap-2.5">
              <CopyButton text={url} label={tr("Copy link", "लिंक कॉपी करें")} width="100%" />
              <CopyButton text={message(url)} label={tr("Copy message", "संदेश कॉपी करें")} width="100%" />
            </div>
          </div>
        </Card>
      )}

      <QrStudio url={url} registry={registry} inviteOnly={inviteOnly} />

      <p className="text-center text-[15px] text-secondary">
        {tr("Want more privacy?", "और निजता चाहिए?")}{" "}
        <Link href={`/dashboard/${slug}/settings#privacy`} className="font-semibold text-accent underline underline-offset-4">
          {tr("Change who can see your registry", "तय करें कि रजिस्ट्री कौन देख सकता है")}
        </Link>
      </p>
    </div>
  );
}

// ── Invite-only: one personal link per guest ──────────────────────────

function InviteManager({ slug, base, invites, message }: { slug: string; base: string; invites: Props["invites"]; message: (link: string, guest?: string) => string }) {
  const tr = useTr();
  const router = useRouter();
  const [names, setNames] = useState("");
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      const res = await createInvites(slug, names.split(/[\n,]+/));
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      setNames("");
      toast(tr(`${res.created} invite${res.created > 1 ? "s" : ""} created`, `${res.created} आमंत्रण बन गए`));
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteInvite(slug, id);
      router.refresh();
    });

  return (
    <Card padding={5}>
      <div className="flex items-center gap-2">
        <Lock className="size-5 text-accent" aria-hidden />
        <Heading level={2}>{tr("Invite-only", "सिर्फ़ आमंत्रित मेहमान")}</Heading>
      </div>
      <Text as="p" type="supporting" display="block">
        {tr("Each guest gets a personal link. Only people with a link can open your registry. Delete a link to take access back.", "हर मेहमान को अपना अलग लिंक मिलता है। सिर्फ़ लिंक वाले लोग ही रजिस्ट्री खोल सकते हैं, लिंक हटाते ही पहुँच बंद।")}
      </Text>

      <div className="mt-4">
        <TextArea
          label={tr("Guest or family names (one per line)", "मेहमान या परिवार के नाम (हर पंक्ति में एक)")}
          width="100%"
          rows={3}
          value={names}
          onChange={setNames}
          placeholder={tr("Sharma family\nNeha Didi\nOffice friends", "शर्मा परिवार\nनेहा दीदी\nऑफ़िस के दोस्त")}
        />
      </div>
      <div className="mt-3">
        <Button variant="primary" width="100%" isLoading={pending} isDisabled={!names.trim()} label={tr("Create invite links", "आमंत्रण लिंक बनाएँ")} icon={<Icon icon={UserPlus} />} onClick={add} />
      </div>

      {invites.length > 0 && (
        <ul className="mt-5 divide-y divide-[var(--color-border)] border-t border-border">
          {invites.map((i) => {
            const link = `${base}/i/${i.token}`;
            return (
              <li key={i.id} className="flex items-center gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">{i.guestName}</p>
                  <p className="flex items-center gap-1 text-sm text-secondary">
                    <Eye className="size-3.5" aria-hidden />
                    {i.opens > 0 ? tr(`Opened ${i.opens}×`, `${i.opens} बार खोला`) : tr("Not opened yet", "अभी नहीं खोला")}
                  </p>
                </div>
                <a
                  href={whatsappLink(message(link, i.guestName))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-11 place-items-center rounded-[var(--radius-element)] bg-whatsapp text-white"
                  aria-label={tr(`Send to ${i.guestName} on WhatsApp`, `${i.guestName} को WhatsApp पर भेजें`)}
                >
                  <MessageCircle className="size-5" aria-hidden />
                </a>
                <CopyButton text={link} label={tr("Link", "लिंक")} />
                <IconButton variant="ghost" label={tr(`Delete invite for ${i.guestName}`, `${i.guestName} का आमंत्रण हटाएँ`)} icon={<Icon icon={Trash2} />} onClick={() => remove(i.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
