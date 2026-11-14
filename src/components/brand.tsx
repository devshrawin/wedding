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

/** Toran (door garland) — a festive divider. */
export function Toran({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 30" className={cn("h-7 w-60", className)} aria-hidden>
      <path d="M0 3q120 10 240 0" stroke="currentColor" strokeWidth="1.5" fill="none" opacity=".45" />
      {Array.from({ length: 11 }).map((_, i) => {
        const x = 20 + i * 20;
        const sag = 3 + 5 * Math.sin((Math.PI * x) / 240);
        const long = i % 2 === 0;
        return (
          <g key={i}>
            <path d={`M${x} ${sag}v${long ? 9 : 5}`} stroke="currentColor" strokeWidth="1" opacity=".45" />
            {long ? (
              <path d={`M${x} ${sag + 9}c4 3 4 9 0 13c-4-4-4-10 0-13Z`} fill="#F2A31B" />
            ) : (
              <circle cx={x} cy={sag + 8.5} r="3.2" fill="currentColor" opacity=".8" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
