import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Giftr mark: a gift tied with a bow, on a sindoor tile, with a marigold knot.
 * Drawn on a 48-unit grid with 2.5-unit strokes so it stays crisp from 16px favicons to 512px icons.
 */
export function MarkGlyph({ tile = "var(--color-accent)", ink = "#FFF8EE", knot = "#F2A31B" }: { tile?: string; ink?: string; knot?: string }) {
  return (
    <>
      <rect width="48" height="48" rx="13" fill={tile} />
      {/* bow loops */}
      <path d="M24 17.5c-2.2-4.6-8.4-6.4-9.6-3.2-1 2.7 3.6 4.2 9.6 3.2Z" fill="none" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 17.5c2.2-4.6 8.4-6.4 9.6-3.2 1 2.7-3.6 4.2-9.6 3.2Z" fill="none" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      {/* lid + box */}
      <rect x="11.5" y="18.5" width="25" height="7" rx="2" fill={ink} />
      <path d="M13.5 27.5h21v8.5a2.5 2.5 0 0 1-2.5 2.5H16a2.5 2.5 0 0 1-2.5-2.5v-8.5Z" fill={ink} />
      {/* ribbon */}
      <rect x="22.25" y="18.5" width="3.5" height="20" fill={tile} />
      <circle cx="24" cy="17.6" r="2.6" fill={knot} />
    </>
  );
}

export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9 shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <MarkGlyph />
    </svg>
  );
}

export function Logo({ href = "/", className, onDark }: { href?: string; className?: string; onDark?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="Giftr home">
      <Mark />
      <span className={cn("font-display text-[26px] font-semibold leading-none tracking-tight", onDark ? "text-white" : "text-primary")}>
        Giftr<span className="text-marigold">.</span>
      </span>
    </Link>
  );
}

/** String of party lights: a festive divider that suits any wedding. */
export function Lights({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 26" className={cn("h-6 w-60", className)} aria-hidden>
      <path d="M0 4q120 14 240 0" stroke="currentColor" strokeWidth="1.25" fill="none" opacity=".5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 10 + i * 20;
        const y = 4 + 7 * Math.sin((Math.PI * x) / 240);
        return (
          <g key={i}>
            <rect x={x - 1.6} y={y} width="3.2" height="3" rx=".6" fill="currentColor" opacity=".6" />
            <ellipse cx={x} cy={y + 8} rx="3.4" ry="4.6" fill={i % 3 === 1 ? "currentColor" : "#F2A31B"} opacity={i % 3 === 1 ? 0.9 : 1} />
          </g>
        );
      })}
    </svg>
  );
}
