"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Download, Eye, Lock, MessageCircle, Share2, Trash2, UserPlus } from "lucide-react";
import { createInvites, deleteInvite } from "@/app/actions/registry";
import { useLang, useTr } from "@/components/lang";
import { Button } from "@/components/ui/button";
import { CopyButton, toast } from "@/components/ui/bits";
import { errorText } from "@/lib/result";
import { whatsappLink } from "@/lib/utils";

type Props = {
  slug: string;
  origin: string;
  registry: {
    partnerOne: string;
    partnerTwo: string;
    dateText: string;
    city: string | null;
    visibility: "link" | "password" | "invite";
    theme: { primary: string; deep: string; soft: string };
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
      ? `${guest ? `${guest} जी, ` : ""}नमस्ते! 🙏\n\nहमारी शादी में आपका आना ही सबसे बड़ा तोहफ़ा है। फिर भी अगर आप आशीर्वाद देना चाहें, तो हमने अपनी पसंद की छोटी-सी सूची बनाई है:\n\n${link}\n\nसप्रेम,\n${couple}`
      : `${guest ? `Dear ${guest}, ` : ""}Namaste! 🙏\n\nYour presence at our wedding is the greatest gift. If you'd still like to bless us, we've put together a small wishlist:\n\n${link}\n\nWith love,\n${couple}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{tr("Share your registry", "रजिस्ट्री शेयर करें")}</h1>

      {inviteOnly ? (
        <InviteManager slug={slug} base={base} invites={invites} message={message} />
      ) : (
        <section className="card p-5">
          <h2 className="text-xl font-semibold">{tr("Your registry link", "आपकी रजिस्ट्री का लिंक")}</h2>
          <p className="mt-3 break-all rounded-2xl bg-sand/70 px-4 py-3 font-mono text-[15px]">{url}</p>
          {registry.visibility === "password" && (
            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted">
              <Lock className="size-4" /> {tr("Guests will need the password — share it with them separately.", "मेहमानों को पासवर्ड चाहिए होगा — उसे अलग से बताएँ।")}
            </p>
          )}
          <div className="mt-4 grid gap-2.5">
            <a href={whatsappLink(message(url))} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp px-6 text-lg font-semibold text-white">
              <MessageCircle className="size-5" /> {tr("Share on WhatsApp", "WhatsApp पर भेजें")}
            </a>
            <div className="grid grid-cols-2 gap-2.5">
              <CopyButton text={url} label={tr("Copy link", "लिंक कॉपी करें")} className="h-12" />
              <CopyButton text={message(url)} label={tr("Copy message", "संदेश कॉपी करें")} className="h-12" />
            </div>
          </div>
        </section>
      )}

      <ShareCard url={url} couple={couple} registry={registry} inviteOnly={inviteOnly} />

      <p className="text-center text-[15px] text-muted">
        {tr("Want more privacy?", "और निजता चाहिए?")}{" "}
        <Link href={`/dashboard/${slug}/settings#privacy`} className="font-semibold text-primary underline">
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
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <Lock className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">{tr("Invite-only", "सिर्फ़ आमंत्रित मेहमान")}</h2>
      </div>
      <p className="mt-1 text-[15px] text-muted">
        {tr("Each guest gets a personal link. Only people with a link can open your registry — delete a link to take access back.", "हर मेहमान को अपना अलग लिंक मिलता है। सिर्फ़ लिंक वाले लोग ही रजिस्ट्री खोल सकते हैं — लिंक हटाते ही पहुँच बंद।")}
      </p>

      <label className="mt-4 block">
        <span className="label">{tr("Guest or family names (one per line)", "मेहमान या परिवार के नाम (हर पंक्ति में एक)")}</span>
        <textarea className="input" rows={3} value={names} onChange={(e) => setNames(e.target.value)} placeholder={tr("Sharma family\nNeha Didi\nOffice friends", "शर्मा परिवार\nनेहा दीदी\nऑफ़िस के दोस्त")} />
      </label>
      <Button block className="mt-3" loading={pending} disabled={!names.trim()} onClick={add}>
        <UserPlus className="size-5" /> {tr("Create invite links", "आमंत्रण लिंक बनाएँ")}
      </Button>

      {invites.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {invites.map((i) => {
            const link = `${base}/i/${i.token}`;
            return (
              <li key={i.id} className="flex items-center gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{i.guestName}</p>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <Eye className="size-3.5" />
                    {i.opens > 0 ? tr(`Opened ${i.opens}×`, `${i.opens} बार खोला`) : tr("Not opened yet", "अभी नहीं खोला")}
                  </p>
                </div>
                <a href={whatsappLink(message(link, i.guestName))} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-xl bg-whatsapp text-white" aria-label={tr(`Send to ${i.guestName} on WhatsApp`, `${i.guestName} को WhatsApp पर भेजें`)}>
                  <MessageCircle className="size-5" />
                </a>
                <CopyButton text={link} label={tr("Link", "लिंक")} />
                <button type="button" onClick={() => remove(i.id)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700" aria-label={tr(`Delete invite for ${i.guestName}`, `${i.guestName} का आमंत्रण हटाएँ`)}>
                  <Trash2 className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ── Share card (drawn on canvas so Hindi names render with real fonts) ─

const W = 1080;
const H = 1350;

function ShareCard({ url, couple, registry, inviteOnly }: { url: string; couple: string; registry: Props["registry"]; inviteOnly: boolean }) {
  const tr = useTr();
  const lang = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await document.fonts?.ready;
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      const { primary, deep } = registry.theme;
      const display = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").trim() || "Georgia";
      const sans = getComputedStyle(document.documentElement).getPropertyValue("--font-mukta").trim() || "sans-serif";
      const serif = `${display}, ${sans}, serif`;

      // Backdrop
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, primary);
      g.addColorStop(1, deep);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Double gold frame
      ctx.strokeStyle = "#f2c76b";
      ctx.lineWidth = 4;
      roundRect(ctx, 40, 40, W - 80, H - 80, 36);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      roundRect(ctx, 58, 58, W - 116, H - 116, 26);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Toran
      for (let i = 0; i < 17; i++) {
        const x = 150 + i * 48.75;
        const long = i % 2 === 0;
        ctx.strokeStyle = "rgba(255,255,255,.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, long ? 118 : 96);
        ctx.stroke();
        ctx.fillStyle = long ? "#f2a31b" : "#fff3dc";
        ctx.beginPath();
        ctx.arc(x, long ? 132 : 106, long ? 15 : 11, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#f6d998";
      ctx.font = `600 34px ${sans}`;
      drawSpaced(ctx, lang === "hi" ? "॥ शुभ विवाह ॥" : "SHUBH VIVAH", W / 2, 240, lang === "hi" ? 2 : 10);

      ctx.fillStyle = "#fff";
      const [a, b] = [registry.partnerOne, registry.partnerTwo];
      const oneLine = `${a} & ${b}`;
      ctx.font = `600 96px ${serif}`;
      if (ctx.measureText(oneLine).width <= W - 200) {
        ctx.fillText(oneLine, W / 2, 380);
      } else {
        fitText(ctx, a, W / 2, 330, W - 200, 96, serif);
        ctx.fillStyle = "#f6d998";
        ctx.font = `500 56px ${serif}`;
        ctx.fillText("&", W / 2, 400);
        ctx.fillStyle = "#fff";
        fitText(ctx, b, W / 2, 490, W - 200, 96, serif);
      }
      const below = ctx.measureText(oneLine).width <= W - 200 ? 450 : 560;
      ctx.font = `500 38px ${sans}`;
      ctx.fillStyle = "rgba(255,255,255,.85)";
      const sub = [registry.dateText, registry.city].filter(Boolean).join("  ·  ");
      if (sub) ctx.fillText(sub, W / 2, below);

      // QR plate
      const size = 440;
      const qx = (W - size) / 2;
      const qy = 640;
      ctx.fillStyle = "#fff9f1";
      roundRect(ctx, qx - 36, qy - 36, size + 72, size + 72, 40);
      ctx.fill();
      const qr = document.createElement("canvas");
      await QRCode.toCanvas(qr, url, { width: size, margin: 0, errorCorrectionLevel: "M", color: { dark: deep, light: "#fff9f1" } });
      if (cancelled) return;
      ctx.drawImage(qr, qx, qy, size, size);

      ctx.fillStyle = "#fff";
      ctx.font = `600 44px ${sans}`;
      ctx.fillText(lang === "hi" ? "स्कैन करें · आशीर्वाद भेजें" : "Scan to bless the couple", W / 2, 1195);
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.font = `500 30px ${sans}`;
      ctx.fillText(lang === "hi" ? "तोहफ़ों की सूची और UPI शगुन · giftr" : "Gift wishlist & UPI shagun · giftr", W / 2, 1250);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [url, lang, registry]);

  const blob = () => new Promise<Blob | null>((res) => canvasRef.current?.toBlob(res, "image/png"));

  const download = async () => {
    const b = await blob();
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `giftr-${couple.replace(/[^\p{L}\p{N}]+/gu, "-")}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const share = async () => {
    const b = await blob();
    if (!b) return;
    const file = new File([b], "giftr-card.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: couple, text: url });
      } catch {
        /* user cancelled */
      }
    } else download();
  };

  return (
    <section className="card p-5">
      <h2 className="text-xl font-semibold">{tr("Card with QR code", "QR कोड वाला कार्ड")}</h2>
      <p className="mt-1 text-[15px] text-muted">
        {inviteOnly
          ? tr("Heads-up: your registry is invite-only, so this QR opens only for people who already used their invite link.", "ध्यान दें: रजिस्ट्री सिर्फ़ आमंत्रितों के लिए है, इसलिए यह QR उन्हीं के लिए खुलेगा जिन्होंने अपना आमंत्रण लिंक खोला है।")
          : tr("Send it on WhatsApp, print it on your invitation, or keep it at the shagun counter.", "WhatsApp पर भेजें, निमंत्रण पत्र पर छापें, या शगुन काउंटर पर रखें।")}
      </p>
      <canvas ref={canvasRef} width={W} height={H} className="mx-auto mt-4 w-full max-w-xs rounded-3xl shadow-soft" role="img" aria-label={tr(`Share card for ${couple} with QR code`, `${couple} का QR कोड वाला कार्ड`)} />
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button onClick={share} disabled={!ready}>
          <Share2 className="size-5" /> {tr("Share card", "कार्ड भेजें")}
        </Button>
        <Button variant="outline" onClick={download} disabled={!ready}>
          <Download className="size-5" /> {tr("Download", "डाउनलोड")}
        </Button>
      </div>
    </section>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, size: number, family: string) {
  let s = size;
  do {
    ctx.font = `600 ${s}px ${family}`;
    s -= 4;
  } while (ctx.measureText(text).width > maxW && s > 36);
  ctx.fillText(text, x, y);
}

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  if ("letterSpacing" in c) c.letterSpacing = "0px";
}
