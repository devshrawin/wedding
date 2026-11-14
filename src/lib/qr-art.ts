/**
 * QR geometry shared by every Giftr QR design. Pure functions, no DOM: used by the
 * canvas renderer, the SVG export, and the tests.
 *
 * Safety rules every design follows (so codes still scan on cheap phones):
 *  - error correction "H" (≈30% of the code can be covered) for registry links;
 *    payment codes use "M" and stay plain
 *  - a quiet zone of 4 modules is always kept clear
 *  - the three finder squares are never decorated over
 *  - the centre badge covers at most ~6% of modules
 *  - every module's centre is unambiguously dark or light
 */
import QRCode from "qrcode";

export type QrMatrix = {
  size: number;
  isDark: (r: number, c: number) => boolean;
  /** inside one of the three 7×7 finder squares */
  isFinder: (r: number, c: number) => boolean;
  /** side (in modules) of the square kept clear for the centre badge; 0 when none */
  badge: number;
  /** whether a module is covered by the centre badge */
  inBadge: (r: number, c: number) => boolean;
};

export function makeMatrix(text: string, opts: { ecc?: "M" | "H"; badge?: boolean } = {}): QrMatrix {
  const q = QRCode.create(text, { errorCorrectionLevel: opts.ecc ?? "H" });
  const size = q.modules.size;
  const data = q.modules.data;
  // Odd number of modules around the centre, ~24% of the side (≈6% of the area).
  let badge = opts.badge ? Math.floor(size * 0.24) : 0;
  if (badge && badge % 2 === 0) badge += 1;
  const lo = Math.floor((size - badge) / 2);
  const hi = lo + badge;
  const isFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
  return {
    size,
    isDark: (r, c) => data[r * size + c] === 1,
    isFinder,
    badge,
    inBadge: (r, c) => badge > 0 && r >= lo && r < hi && c >= lo && c < hi,
  };
}

/** First letter of a name as the eye reads it (Devanagari clusters like "प्रि" stay whole). */
export function initial(name: string): string {
  const n = name.trim();
  if (!n) return "";
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = seg.segment(n)[Symbol.iterator]().next().value;
    if (first) return first.segment.toUpperCase();
  } catch {
    /* older engines */
  }
  return n.charAt(0).toUpperCase();
}

export function monogram(a: string, b: string): string {
  return `${initial(a)}&${initial(b)}`;
}

/** Standalone SVG of the QR (dots + rounded finders + monogram badge), for printers. */
export function qrSvg(
  m: QrMatrix,
  o: { fg: string; bg: string; monogram?: string; font?: string; px?: number },
): string {
  const q = 4; // quiet zone
  const n = m.size + q * 2;
  const parts: string[] = [];
  parts.push(`<rect width="${n}" height="${n}" fill="${o.bg}"/>`);
  // Connected "liquid" modules: separate dots fail strict scanners, merged ones don't.
  const dark = (r: number, c: number) => r >= 0 && c >= 0 && r < m.size && c < m.size && m.isDark(r, c) && !m.isFinder(r, c) && !m.inBadge(r, c);
  for (let r = 0; r < m.size; r++)
    for (let c = 0; c < m.size; c++) {
      if (!dark(r, c)) continue;
      parts.push(`<circle cx="${c + q + 0.5}" cy="${r + q + 0.5}" r="0.5"/>`);
      if (dark(r, c + 1)) parts.push(`<rect x="${c + q + 0.5}" y="${r + q}" width="1" height="1"/>`);
      if (dark(r + 1, c)) parts.push(`<rect x="${c + q}" y="${r + q + 0.5}" width="1" height="1"/>`);
    }
  const eye = (r: number, c: number) =>
    `<rect x="${c + q + 0.5}" y="${r + q + 0.5}" width="6" height="6" rx="1.6" fill="none" stroke="${o.fg}" stroke-width="1"/>` +
    `<rect x="${c + q + 2}" y="${r + q + 2}" width="3" height="3" rx="0.9"/>`;
  parts.push(eye(0, 0), eye(0, m.size - 7), eye(m.size - 7, 0));
  if (m.badge && o.monogram) {
    const cx = n / 2;
    const rad = m.badge / 2 - 0.4;
    parts.push(`<circle cx="${cx}" cy="${cx}" r="${rad}" fill="${o.bg}" stroke="${o.fg}" stroke-width="0.35"/>`);
    parts.push(
      `<text x="${cx}" y="${cx}" text-anchor="middle" dominant-baseline="central" font-family="${o.font ?? "Georgia, serif"}" font-weight="600" font-size="${(rad * 0.82).toFixed(2)}" fill="${o.fg}">${escapeXml(o.monogram)}</text>`,
    );
  }
  const px = o.px ?? 1024;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${px}" height="${px}" shape-rendering="geometricPrecision"><g fill="${o.fg}">${parts.join("")}</g></svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch]!);
}
