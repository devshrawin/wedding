"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { Download, FileCode2, Play, Share2, Video } from "lucide-react";
import { useLang, useTr } from "@/components/lang";
import { prefersReducedMotion } from "@/components/motion";
import { toast } from "@/components/ui/feedback";
import { makeMatrix, monogram, qrSvg } from "@/lib/qr-art";
import { cn } from "@/lib/utils";
import { FORMATS, renderCard, type CardData, type Design, type Format } from "./render";

export type StudioRegistry = {
  partnerOne: string;
  partnerTwo: string;
  greeting: string;
  dateText: string;
  city: string | null;
  photo: string | null;
  theme: { primary: string; deep: string; soft: string };
};

const DURATION = 2200; // ms for the on-screen assemble animation

export function QrStudio({ url, registry, inviteOnly }: { url: string; registry: StudioRegistry; inviteOnly: boolean }) {
  const tr = useTr();
  const lang = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [design, setDesign] = useState<Design>("seal");
  const [format, setFormat] = useState<Format>("card");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  // Which design/format/replay finished drawing; compared below so "ready" is never stale.
  const [doneKey, setDoneKey] = useState("");
  const [recording, setRecording] = useState(false);
  const [replay, setReplay] = useState(0);

  const key = `${design}:${format}:${replay}:${photo ? 1 : 0}`;
  const ready = doneKey === key;

  const matrix = useMemo(() => makeMatrix(url, { ecc: "H", badge: true }), [url]);
  const couple = `${registry.partnerOne} & ${registry.partnerTwo}`;

  useEffect(() => {
    if (!registry.photo) return;
    const img = new Image();
    img.onload = () => setPhoto(img);
    img.src = registry.photo;
  }, [registry.photo]);

  const data: CardData = useMemo(
    () => ({
      names: [registry.partnerOne, registry.partnerTwo],
      greeting: registry.greeting,
      dateLine: [registry.dateText, registry.city].filter(Boolean).join("  ·  "),
      scanLine: lang === "hi" ? "स्कैन करें, हमारी पसंद की सूची देखें" : "Scan to see our wishlist",
      footer: lang === "hi" ? "तोहफ़ों की सूची और UPI से उपहार · Giftr" : "Gift wishlist & UPI gifts · Giftr",
      monogram: monogram(registry.partnerOne, registry.partnerTwo),
      colors: registry.theme,
      photo,
    }),
    [registry, lang, photo],
  );

  const DESIGNS: { k: Design; label: string; hint: string; art?: boolean }[] = [
    { k: "seal", label: tr("Seal", "मुहर"), hint: tr("Names around a round seal", "गोल मुहर के चारों ओर नाम") },
    { k: "arch", label: tr("Arch", "मेहराब"), hint: tr("Under an arch with lights", "लाइटों वाले मेहराब में") },
    { k: "floral", label: tr("Floral", "फूलों वाला"), hint: tr("Marigold corners", "कोनों में गेंदे") },
    { k: "minimal", label: tr("Minimal", "सादा"), hint: tr("Clean and understated", "साफ़ और सादा") },
    { k: "garden", label: tr("Garden art", "बगिया कला"), hint: tr("The code drawn in tiny flowers", "छोटे फूलों से बना कोड"), art: true },
    { k: "photo", label: tr("Photo art", "फ़ोटो कला"), hint: registry.photo ? tr("Your photo woven into the code", "आपकी फ़ोटो कोड में बुनी हुई") : tr("Add a couple photo in Settings first", "पहले सेटिंग में जोड़े की फ़ोटो लगाएँ"), art: true },
  ];

  // Animate on design/format change; draw the final frame straight away for reduced motion.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let cancelled = false;
    (async () => {
      await document.fonts?.ready;
      if (cancelled) return;
      if (prefersReducedMotion()) {
        renderCard(canvas, matrix, design, format, data, 1);
        setDoneKey(key);
        return;
      }
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        renderCard(canvas, matrix, design, format, data, t);
        if (t < 1) raf = requestAnimationFrame(frame);
        else setDoneKey(key);
      };
      raf = requestAnimationFrame(frame);
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [matrix, design, format, data, key]);

  const fileBase = `giftr-${couple.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-${design}-${format}`;

  /** A full-quality still, drawn fresh at t = 1 so exports never catch a mid-animation frame. */
  const still = useCallback(async () => {
    const c = document.createElement("canvas");
    renderCard(c, matrix, design, format, data, 1);
    return new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
  }, [matrix, design, format, data]);

  const save = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const shareOrSave = async (blob: Blob, name: string) => {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: couple, text: url });
        return;
      } catch {
        /* cancelled: fall back to saving */
      }
    }
    save(blob, name);
  };

  const downloadSvg = () => {
    const svg = qrSvg(matrix, { fg: registry.theme.deep, bg: "#FFFDF9", monogram: data.monogram, font: "Fraunces, Georgia, serif" });
    save(new Blob([svg], { type: "image/svg+xml" }), `${fileBase}-qr.svg`);
  };

  /** Records the assemble animation plus a short hold, straight from the canvas. */
  const recordVideo = async () => {
    const c = document.createElement("canvas");
    renderCard(c, matrix, design, format, data, 0);
    if (typeof MediaRecorder === "undefined" || !c.captureStream) {
      toast(tr("This browser can't record video. Try Chrome on Android or a computer.", "यह ब्राउज़र वीडियो नहीं बना सकता। Android या कंप्यूटर पर Chrome आज़माएँ।"), "error");
      return;
    }
    const type = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    setRecording(true);
    try {
      const stream = c.captureStream(30);
      const rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 6_000_000 } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise<void>((res) => (rec.onstop = () => res()));
      rec.start(250);
      const total = 3000;
      const hold = 1800;
      const start = performance.now();
      await new Promise<void>((res) => {
        const frame = (now: number) => {
          const el = now - start;
          renderCard(c, matrix, design, format, data, Math.min(1, el / total));
          if (el < total + hold) requestAnimationFrame(frame);
          else res();
        };
        requestAnimationFrame(frame);
      });
      rec.stop();
      await done;
      const blob = new Blob(chunks, { type: type.split(";")[0] || "video/webm" });
      await shareOrSave(blob, `${fileBase}.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
    } catch {
      toast(tr("Couldn't make the video. Please try again.", "वीडियो नहीं बन सका। दोबारा कोशिश करें।"), "error");
    } finally {
      setRecording(false);
    }
  };

  const { w, h } = FORMATS[format];

  return (
    <Card padding={5}>
      <Heading level={2}>{tr("Your QR card", "आपका QR कार्ड")}</Heading>
      <Text as="p" type="supporting" display="block">
        {tr("For invitations, WhatsApp and the gift table. Every design is checked to scan on ordinary phones.", "निमंत्रण, WhatsApp और उपहार की मेज़ के लिए। हर डिज़ाइन आम फ़ोन पर स्कैन होने के लिए जाँचा गया है।")}
      </Text>
      {inviteOnly && (
        <div className="mt-3">
          <Banner status="info" collapsible={false} title={tr("Your registry is invite-only", "आपकी रजिस्ट्री सिर्फ़ आमंत्रितों के लिए है")} description={tr("This QR opens only for people who already used their invite link.", "यह QR उन्हीं के लिए खुलेगा जिन्होंने अपना आमंत्रण लिंक खोला है।")} />
        </div>
      )}

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label={tr("Design", "डिज़ाइन")}>
        {DESIGNS.map((d) => {
          const disabled = d.k === "photo" && !registry.photo;
          return (
            <button
              key={d.k}
              type="button"
              role="radio"
              aria-checked={design === d.k}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => setDesign(d.k)}
              className={cn(
                "press flex w-36 shrink-0 flex-col items-start rounded-xl border-2 bg-surface p-3 text-left transition-colors disabled:opacity-45",
                design === d.k ? "border-[var(--color-accent)] bg-brand-soft" : "border-border",
              )}
            >
              <span className="flex items-center gap-1.5 font-semibold text-primary">
                {d.label}
                {d.art && <span className="rounded-full bg-[var(--color-background-yellow)] px-1.5 text-[11px] font-bold text-[var(--color-text-warning)]">{tr("Art", "कला")}</span>}
              </span>
              <span className="mt-0.5 text-[13px] leading-snug text-secondary">{d.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <SegmentedControl label={tr("Size", "आकार")} value={format} onChange={(v) => setFormat(v as Format)} layout="fill" size="sm">
          <SegmentedControlItem value="card" label={tr("Post", "पोस्ट")} />
          <SegmentedControlItem value="square" label={tr("Invite", "निमंत्रण")} />
          <SegmentedControlItem value="status" label={tr("Status", "स्टेटस")} />
          <SegmentedControlItem value="stand" label={tr("Table card", "टेबल कार्ड")} />
        </SegmentedControl>
      </div>

      <div className="relative mx-auto mt-4 w-full max-w-xs">
        <canvas
          ref={canvasRef}
          width={w}
          height={h}
          data-ready={ready ? "1" : "0"}
          data-design={design}
          data-format={format}
          className="w-full rounded-2xl shadow-md"
          role="img"
          aria-label={tr(`QR card for ${couple}`, `${couple} का QR कार्ड`)}
        />
        <div className="absolute right-2 top-2">
          <Button size="sm" variant="secondary" label={tr("Replay", "फिर से चलाएँ")} icon={<Icon icon={Play} />} isIconOnly onClick={() => setReplay((r) => r + 1)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="primary" width="100%" isDisabled={!ready} label={tr("Share", "भेजें")} icon={<Icon icon={Share2} />} onClick={async () => { const b = await still(); if (b) await shareOrSave(b, `${fileBase}.png`); }} />
        <Button width="100%" isDisabled={!ready} label={tr("Download PNG", "PNG डाउनलोड")} icon={<Icon icon={Download} />} onClick={async () => { const b = await still(); if (b) save(b, `${fileBase}.png`); }} />
        <Button width="100%" label={tr("QR for printers (SVG)", "प्रिंटर के लिए QR (SVG)")} icon={<Icon icon={FileCode2} />} onClick={downloadSvg} />
        <Button width="100%" isLoading={recording} label={tr("Animated video", "एनिमेटेड वीडियो")} icon={<Icon icon={Video} />} onClick={recordVideo} />
      </div>
      <Text as="p" type="supporting" display="block">
        {format === "stand"
          ? tr("Table card is A5 at print quality. Print it on thick card for the gift table.", "टेबल कार्ड A5, प्रिंट क्वालिटी में है। उपहार की मेज़ के लिए मोटे कार्ड पर छापें।")
          : tr("Video is about 5 seconds, made for WhatsApp Status. Some phones save it as WebM.", "वीडियो लगभग 5 सेकंड का है, WhatsApp स्टेटस के लिए। कुछ फ़ोन इसे WebM में सेव करते हैं।")}
      </Text>
    </Card>
  );
}
