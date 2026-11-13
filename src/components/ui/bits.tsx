"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTr } from "@/components/lang";

// ── Switch ────────────────────────────────────────────────────────────

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 py-2 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{label}</span>
        {hint && <span className="block text-[15px] leading-snug text-muted">{hint}</span>}
      </span>
      <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-line")}>
        <span className={cn("absolute top-1 size-6 rounded-full bg-white shadow transition-[left]", checked ? "left-7" : "left-1")} />
      </span>
    </button>
  );
}

// ── Progress ──────────────────────────────────────────────────────────

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-primary-soft", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-marigold to-primary transition-[width] duration-500" style={{ width: `${Math.max(v, v > 0 ? 4 : 0)}%` }} />
    </div>
  );
}

// ── Toasts ────────────────────────────────────────────────────────────

type ToastItem = { id: number; text: string; kind: "ok" | "error" };
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, kind: "ok" | "error" = "ok") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, text, kind }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const empty: ToastItem[] = [];

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => empty);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto max-w-sm animate-rise rounded-2xl px-4 py-3 text-[15px] font-semibold text-white shadow-lg",
            t.kind === "ok" ? "bg-ink" : "bg-red-700",
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────

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

export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const tr = useTr();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      onClick={async () => setDone(await copyText(text))}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[15px] font-semibold hover:bg-sand", className)}
    >
      {done ? <Check className="size-4 text-leaf" /> : <Copy className="size-4" />}
      {done ? tr("Copied", "कॉपी हो गया") : (label ?? tr("Copy", "कॉपी करें"))}
    </button>
  );
}

// ── Field ─────────────────────────────────────────────────────────────

export function Field({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  const tr = useTr();
  return (
    <label className="block">
      <span className="label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">({tr("optional", "वैकल्पिक")})</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-sm leading-snug text-muted">{hint}</span>}
    </label>
  );
}
