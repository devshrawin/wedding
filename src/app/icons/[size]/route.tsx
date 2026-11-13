import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }, { size: "maskable" }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const maskable = raw === "maskable";
  const size = maskable ? 512 : [180, 192, 512].includes(Number(raw)) ? Number(raw) : 192;
  const inner = Math.round(size * (maskable ? 0.5 : 0.62));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#8c1d2f", borderRadius: maskable ? 0 : size * 0.22 }}>
        <svg width={inner} height={inner} viewBox="6 5 28 28">
          <path d="M20 30c-5.500 0-9.500-3.200-10.500-8 3 .2 5.400 1.200 7 3-.9-3.600-.2-7.400 3.500-12 3.700 4.600 4.400 8.400 3.500 12 1.600-1.800 4-2.800 7-3-1 4.800-5 8-10.500 8Z" fill="#fff9f1" />
          <circle cx="20" cy="9.500" r="1.700" fill="#f2a31b" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
