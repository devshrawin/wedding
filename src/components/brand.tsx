import Link from "next/link";
import { cn } from "@/lib/utils";

/** Lotus-in-a-gift-knot mark. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <path d="M20 30c-5.5 0-9.5-3.2-10.5-8 3 .2 5.4 1.2 7 3-.9-3.6-.2-7.4 3.5-12 3.7 4.6 4.4 8.4 3.5 12 1.6-1.8 4-2.8 7-3-1 4.800-5 8-10.5 8Z" fill="#fff9f1" />
      <circle cx="20" cy="9.5" r="1.7" fill="#f2a31b" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Giftr">
      <Mark />
      <span className="font-display text-[26px] font-semibold tracking-tight text-ink">Giftr</span>
    </Link>
  );
}

/** A toran-style garland divider. */
export function Toran({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 28" className={cn("h-7 w-60 text-primary", className)} aria-hidden>
      <path d="M0 3h240" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 10 + i * 20;
        const long = i % 2 === 0;
        return (
          <g key={i}>
            <path d={`M${x} 3v${long ? 12 : 7}`} stroke="currentColor" strokeWidth="1" opacity=".4" />
            <circle cx={x} cy={long ? 18 : 12} r={long ? 4.5 : 3.5} fill={long ? "#f2a31b" : "currentColor"} opacity={long ? 1 : 0.75} />
          </g>
        );
      })}
    </svg>
  );
}
