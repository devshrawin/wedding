import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }, { size: "maskable" }];
}

const INK = "#FFF8EE";
const TILE = "#9B1C31";

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const maskable = raw === "maskable";
  const size = maskable ? 512 : [180, 192, 512].includes(Number(raw)) ? Number(raw) : 192;
  // Maskable icons get cropped to a circle by Android, so the glyph sits in the inner 60%.
  const glyph = Math.round(size * (maskable ? 0.62 : 1));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: TILE }}>
        <svg width={glyph} height={glyph} viewBox="0 0 48 48">
          {!maskable && <rect width="48" height="48" fill={TILE} />}
          <path d="M24 17.5c-2.2-4.6-8.4-6.4-9.6-3.2-1 2.7 3.6 4.2 9.6 3.2Z" fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 17.5c2.2-4.6 8.4-6.4 9.6-3.2 1 2.7-3.6 4.2-9.6 3.2Z" fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="11.5" y="18.5" width="25" height="7" rx="2" fill={INK} />
          <path d="M13.5 27.5h21v8.5a2.5 2.5 0 0 1-2.5 2.5H16a2.5 2.5 0 0 1-2.5-2.5v-8.5Z" fill={INK} />
          <rect x="22.25" y="18.5" width="3.5" height="20" fill={TILE} />
          <circle cx="24" cy="17.6" r="2.6" fill="#F2A31B" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
