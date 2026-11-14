"use client";

import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { useToast } from "@astryxdesign/core/Toast";
import { Check, Copy } from "lucide-react";
import { useTr } from "@/components/lang";

// ── Toasts: call toast("Saved") from anywhere; Astryx renders them. ─────

type Pending = { text: string; kind: "ok" | "error" };
const queue: Pending[] = [];
const listeners = new Set<() => void>();

export function toast(text: string, kind: "ok" | "error" = "ok") {
  queue.push({ text, kind });
  listeners.forEach((l) => l());
}

export function ToastBridge() {
  const showToast = useToast();
  useEffect(() => {
    const flush = () => {
      while (queue.length) {
        const t = queue.shift()!;
        showToast({ body: t.text, type: t.kind === "error" ? "error" : "info", isAutoHide: true, autoHideDuration: 3500 });
      }
    };
    listeners.add(flush);
    flush();
    return () => {
      listeners.delete(flush);
    };
  }, [showToast]);
  return null;
}

// ── Clipboard ─────────────────────────────────────────────────────────

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label, size = "md", width }: { text: string; label?: string; size?: "sm" | "md" | "lg"; width?: string }) {
  const tr = useTr();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <Button
      size={size}
      width={width}
      variant="secondary"
      label={done ? tr("Copied", "कॉपी हो गया") : (label ?? tr("Copy", "कॉपी करें"))}
      icon={<Icon icon={done ? Check : Copy} />}
      onClick={async () => setDone(await copyText(text))}
    />
  );
}
