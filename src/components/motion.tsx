"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** True when the person asked their phone for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Counts a rupee total up from zero once, e.g. ₹0 → ₹3,200 over ~0.9s. */
export function CountUp({ value, format, duration = 900 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion() || value === 0) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const base = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(base + (value - base) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

/** A tick in a circle that draws itself. */
export function SuccessMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("draw-check size-16", className)} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="var(--color-success)" />
      <path d="m14.5 24.5 6.5 6.5 13-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Gift box whose lid and bow lift off, with a little sparkle: shown after reserving a gift. */
export function GiftOpen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("gift-open size-20 text-accent", className)} aria-hidden>
      <g className="sparkle" fill="#F2A31B">
        <circle cx="16" cy="14" r="2" />
        <circle cx="48" cy="10" r="2.4" />
        <circle cx="54" cy="24" r="1.6" />
        <circle cx="10" cy="26" r="1.4" />
      </g>
      <rect x="12" y="32" width="40" height="24" rx="3" fill="currentColor" />
      <rect x="29.5" y="32" width="5" height="24" fill="#F2A31B" />
      <g className="lid">
        <rect x="9" y="24" width="46" height="9" rx="2.5" fill="currentColor" />
        <rect x="29.5" y="24" width="5" height="9" fill="#F2A31B" />
      </g>
      <g className="bow" fill="none" stroke="#F2A31B" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M32 23c-3-6-11-8.5-12.5-4.5C18 22 24 24 32 23Z" />
        <path d="M32 23c3-6 11-8.5 12.5-4.5C46 22 40 24 32 23Z" />
      </g>
    </svg>
  );
}

type Petal = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; color: string; kind: 0 | 1; life: number };

/**
 * One short shower of marigold petals and gold dots (about 1.4s), drawn on a canvas
 * that covers the screen and then removes itself. No library, nothing left running.
 */
export function celebrate(origin?: { x: number; y: number }) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "9999" });
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);
  const ox = origin?.x ?? W / 2;
  const oy = origin?.y ?? H * 0.42;
  const colors = ["#F2A31B", "#E8890C", "#FFC94D", "#D9A441", "#F6D998"];
  const petals: Petal[] = Array.from({ length: 46 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 5 + Math.random() * 6;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
      kind: i % 3 === 0 ? 1 : 0,
      life: 1,
    };
  });
  const start = performance.now();
  const frame = (now: number) => {
    const t = (now - start) / 1400;
    ctx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.vy += 0.22;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.globalAlpha = Math.max(0, 1 - t * t);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      if (p.kind === 1) ctx.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
      else ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (t < 1) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** A small heart that rises from where it is placed, then disappears. */
export function HeartRise({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="heart-rise pointer-events-none absolute left-1/2 top-0 -ml-2.5 text-xl text-accent" aria-hidden>
      ♥
    </span>
  );
}
