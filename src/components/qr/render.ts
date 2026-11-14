/**
 * Draws Giftr share cards on a canvas. One function, renderCard(), draws any design in any
 * format at any animation progress t (0 → 1). The on-screen preview animates t, the
 * downloads draw t = 1, and the video records the same frames.
 */
import { type QrMatrix } from "@/lib/qr-art";

export type Design = "seal" | "arch" | "floral" | "minimal" | "garden" | "photo";
export type Format = "card" | "square" | "status" | "stand";

export const FORMATS: Record<Format, { w: number; h: number }> = {
  card: { w: 1080, h: 1350 }, // WhatsApp / Instagram post
  square: { w: 1080, h: 1080 }, // printed invitation insert
  status: { w: 1080, h: 1920 }, // WhatsApp Status / story
  stand: { w: 1748, h: 2480 }, // A5 table card at 300 dpi
};

export type CardData = {
  names: [string, string];
  greeting: string;
  dateLine: string; // "12 February 2027 · Pune"
  scanLine: string; // "Scan to see our wishlist"
  footer: string; // "Gift wishlist & UPI gifts · Giftr"
  monogram: string;
  colors: { primary: string; deep: string; soft: string };
  photo?: HTMLImageElement | null;
};

const IVORY = "#FFFDF9";
const GOLD = "#E9B649";
const MARIGOLD = "#F2A31B";
const INK = "#2B1A14";
const SANS = "Mukta, 'Noto Sans Devanagari', sans-serif";
const SERIF = "Fraunces, Mukta, Georgia, serif";

// ── easing helpers ────────────────────────────────────────────────────
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const back = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

// ── QR ────────────────────────────────────────────────────────────────

/**
 * Module shapes. Every style uses connected "liquid" modules (rounded, merging with dark
 * neighbours): separate dots, petal shapes and halftone dots all failed the scan test.
 * "garden" adds faint flowers on the light modules (10% tint); "photo" lays the couple's
 * photo under the code, lightened by 55%.
 */
type ModuleStyle = "liquid" | "garden" | "photo" | "square";

/**
 * Draws the QR with its quiet zone into the square (x, y, size).
 * t: 0 → 1 animation progress (modules ripple out from the centre, finders settle last).
 */
export function drawQr(
  ctx: CanvasRenderingContext2D,
  m: QrMatrix,
  o: { x: number; y: number; size: number; fg: string; bg: string | null; style: ModuleStyle; t?: number; monogram?: string; photo?: HTMLImageElement | null },
) {
  const t = o.t ?? 1;
  const q = 4;
  const n = m.size + q * 2;
  const s = o.size / n;
  const ox = o.x + q * s;
  const oy = o.y + q * s;

  ctx.save();
  roundRect(ctx, o.x, o.y, o.size, o.size, s * 2);
  ctx.clip();
  ctx.fillStyle = o.bg ?? IVORY;
  ctx.fillRect(o.x, o.y, o.size, o.size);
  if (o.style === "photo" && o.photo) {
    coverImage(ctx, o.photo, ox, oy, m.size * s, m.size * s);
    ctx.fillStyle = "rgba(255,253,249,0.55)";
    ctx.fillRect(ox, oy, m.size * s, m.size * s);
  }
  ctx.restore();

  const c0 = (m.size - 1) / 2;
  const maxD = Math.hypot(c0, c0);
  const assemble = seg(t, 0.15, 0.7);
  const kOf = (r: number, c: number) => easeOut(clamp((assemble - (Math.hypot(r - c0, c - c0) / maxD) * 0.6) / 0.4));
  const dark = (r: number, c: number) => r >= 0 && c >= 0 && r < m.size && c < m.size && m.isDark(r, c) && !m.isFinder(r, c) && !m.inBadge(r, c);

  if (o.style === "garden") {
    ctx.save();
    ctx.globalAlpha = 0.1; // 15% already failed one size in testing; 10% leaves margin
    ctx.fillStyle = o.fg;
    for (let r = 0; r < m.size; r++)
      for (let c = 0; c < m.size; c++) {
        if (m.isDark(r, c) || m.isFinder(r, c) || m.inBadge(r, c)) continue;
        const k = kOf(r, c);
        if (k <= 0) continue;
        const cx = ox + (c + 0.5) * s;
        const cy = oy + (r + 0.5) * s;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + r;
          circle(ctx, cx + Math.cos(a) * s * 0.22 * k, cy + Math.sin(a) * s * 0.22 * k, s * 0.15 * k);
        }
      }
    ctx.restore();
  }

  ctx.fillStyle = o.fg;
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (!dark(r, c)) continue;
      const k = kOf(r, c);
      if (k <= 0) continue;
      const x = ox + c * s;
      const y = oy + r * s;
      if (o.style === "square") {
        const w = s * k;
        ctx.fillRect(x + (s - w) / 2, y + (s - w) / 2, w + 0.5, w + 0.5);
        continue;
      }
      circle(ctx, x + s / 2, y + s / 2, (s / 2) * k);
      // bridge to dark neighbours once both have fully appeared: this is what keeps it scannable
      if (k >= 1) {
        if (dark(r, c + 1) && kOf(r, c + 1) >= 1) ctx.fillRect(x + s / 2, y, s, s);
        if (dark(r + 1, c) && kOf(r + 1, c) >= 1) ctx.fillRect(x, y + s / 2, s, s);
      }
    }
  }

  // finder squares: drop in with a slight overshoot
  const ek = back(seg(t, 0.5, 0.78));
  if (ek > 0) {
    for (const [r, c] of [
      [0, 0],
      [0, m.size - 7],
      [m.size - 7, 0],
    ]) {
      const cx = ox + (c + 3.5) * s;
      const cy = oy + (r + 3.5) * s;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(ek, ek);
      ctx.fillStyle = o.bg ?? IVORY;
      roundRect(ctx, -3.5 * s, -3.5 * s, 7 * s, 7 * s, s * 1.9);
      ctx.fill();
      ctx.strokeStyle = o.fg;
      ctx.lineWidth = s;
      roundRect(ctx, -3 * s, -3 * s, 6 * s, 6 * s, s * 1.6);
      ctx.stroke();
      ctx.fillStyle = o.fg;
      roundRect(ctx, -1.5 * s, -1.5 * s, 3 * s, 3 * s, s * 0.9);
      ctx.fill();
      ctx.restore();
    }
  }

  // centre badge with the couple's initials
  if (m.badge && o.monogram) {
    const bk = back(seg(t, 0.62, 0.86));
    if (bk > 0) {
      const cx = o.x + o.size / 2;
      const cy = o.y + o.size / 2;
      const rad = (m.badge / 2 - 0.35) * s;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(bk, bk);
      ctx.fillStyle = IVORY;
      circle(ctx, 0, 0, rad);
      ctx.strokeStyle = o.fg;
      ctx.lineWidth = s * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, rad - s * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = o.fg;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      fitFont(ctx, o.monogram, rad * 1.5, rad * 0.95, SERIF, 600);
      ctx.fillText(o.monogram, 0, rad * 0.06);
      ctx.restore();
    }
  }
}

// ── cards ─────────────────────────────────────────────────────────────

export function renderCard(canvas: HTMLCanvasElement, m: QrMatrix, design: Design, format: Format, d: CardData, t = 1) {
  const { w: W, h: H } = FORMATS[format];
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  const u = W / 1080; // unit: designs are drawn on a 1080-wide grid and scaled
  const fadeIn = easeOut(seg(t, 0, 0.3));
  ctx.globalAlpha = 1;
  const { primary, deep, soft } = d.colors;

  // layout: QR size and vertical rhythm per format
  const tall = H / W;

  const text = (s: string, x: number, y: number, size: number, opts: { font?: string; weight?: number; color?: string; maxW?: number; spacing?: number; alpha?: number } = {}) => {
    ctx.save();
    ctx.globalAlpha = (opts.alpha ?? 1) * fadeIn;
    ctx.fillStyle = opts.color ?? INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    fitFont(ctx, s, opts.maxW ?? W - 160 * u, size, opts.font ?? SANS, opts.weight ?? 500);
    const latin = /^[\x00-\x7F]*$/.test(s);
    if (opts.spacing && latin) setSpacing(ctx, opts.spacing);
    ctx.fillText(s, x, y);
    ctx.restore();
  };
  const names = `${d.names[0]} & ${d.names[1]}`;
  const greet = (y: number, color: string) => {
    const latin = /^[\x00-\x7F]*$/.test(d.greeting);
    text(latin ? d.greeting.toUpperCase() : d.greeting, W / 2, y, (latin ? 30 : 38) * u, { color, weight: 600, spacing: 9 * u });
  };

  // Vertical rhythm: a heading block (greeting, names, date) then the code, then the scan line.
  // Every size is derived from the space this format actually has, so nothing collides.
  const HEAD = 230 * u; // greeting + names + date
  const TAIL = 190 * u; // scan line + footer

  if (design === "seal") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, primary);
    g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    dotsPattern(ctx, W, H, u);
    frameLines(ctx, W, H, u, GOLD);
    lights(ctx, W, 70 * u, u, t);
    const top = 205 * u + Math.max(0, (H - W * 1.25) * 0.18);
    greet(top, "#F6D998");
    text(names, W / 2, top + 105 * u, 88 * u, { font: SERIF, weight: 600, color: "#fff" });
    // seal: ivory disc with the QR inside, names and date running around the rim
    const room = H - (top + 150 * u) - TAIL;
    const R = Math.min(W * 0.41, room / 2);
    const cy = top + 150 * u + room / 2;
    const sq = R * 1.18; // QR side: its corners (0.83R) stay clear of the lettering ring
    const sk = easeOut(seg(t, 0.05, 0.35));
    ctx.save();
    ctx.globalAlpha = sk;
    ctx.fillStyle = IVORY;
    circle(ctx, W / 2, cy, R);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5 * u;
    ctx.beginPath();
    ctx.arc(W / 2, cy, R - 12 * u, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const ring = seg(t, 0.55, 0.92);
    ctx.fillStyle = deep;
    const ringR = R - 12 * u - R * 0.07;
    arcText(ctx, `${d.names[0]}  ·  ${d.names[1]}`, W / 2, cy, ringR, true, Math.min(32 * u, R * 0.07), SERIF, ring);
    arcText(ctx, d.dateLine, W / 2, cy, ringR, false, Math.min(24 * u, R * 0.055), SANS, ring);
    drawQr(ctx, m, { x: (W - sq) / 2, y: cy - sq / 2, size: sq, fg: deep, bg: IVORY, style: "liquid", t, monogram: d.monogram });
    text(d.scanLine, W / 2, cy + R + 80 * u, 40 * u, { color: "#fff", weight: 600 });
    text(d.footer, W / 2, H - 72 * u, 24 * u, { color: "rgba(255,255,255,.7)" });
  } else if (design === "arch") {
    ctx.fillStyle = soft;
    ctx.fillRect(0, 0, W, H);
    const ax = 90 * u;
    const aw = W - 180 * u;
    const ay = 60 * u;
    const ah = H - ay - 70 * u;
    const r = aw / 2;
    // shorter formats get a flatter dome so the code keeps a scannable size
    const dh = Math.min(r, ah * 0.22);
    const ak = easeOut(seg(t, 0, 0.3));
    ctx.save();
    ctx.globalAlpha = ak;
    archPath(ctx, ax, ay, aw, ah, dh);
    ctx.fillStyle = IVORY;
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4 * u;
    ctx.stroke();
    archPath(ctx, ax + 18 * u, ay + 18 * u, aw - 36 * u, ah - 36 * u, dh - 18 * u);
    ctx.strokeStyle = primary;
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();
    ctx.restore();
    // content sits in the straight part of the arch; lights hang just below the dome's widest point
    const qrSize = Math.min(W * 0.52, ah - dh * 0.7 - HEAD - TAIL - 60 * u);
    const block = HEAD + qrSize + TAIL;
    // centre the content below the top of the dome, so tall formats don't leave it empty
    const ty = ay + dh * 0.6 + Math.max(0, (ah - dh * 0.6 - block) / 2) + 70 * u;
    const ly = ty - 120 * u;
    const half = ly < ay + dh ? r * Math.sqrt(Math.max(0, 1 - ((ay + dh - ly) / dh) ** 2)) : r;
    lights(ctx, W, ly, u * 0.8, t, primary, W / 2 - half + 40 * u);
    greet(ty, primary);
    text(names, W / 2, ty + 100 * u, 80 * u, { font: SERIF, weight: 600, color: INK, maxW: aw - 120 * u });
    text(d.dateLine, W / 2, ty + 155 * u, 30 * u, { color: "#6E5548" });
    const qy = ty + HEAD - 30 * u;
    drawQr(ctx, m, { x: (W - qrSize) / 2, y: qy, size: qrSize, fg: deep, bg: IVORY, style: "liquid", t, monogram: d.monogram });
    text(d.scanLine, W / 2, qy + qrSize + 65 * u, 38 * u, { color: primary, weight: 600 });
    text(d.footer, W / 2, H - 28 * u, 22 * u, { color: "#6E5548" });
  } else if (design === "floral" || design === "minimal" || design === "garden" || design === "photo") {
    ctx.fillStyle = IVORY;
    ctx.fillRect(0, 0, W, H);
    let top0 = 0;
    if (design === "photo") {
      const ph = H * (tall > 1.5 ? 0.3 : 0.24);
      if (d.photo) {
        ctx.save();
        ctx.globalAlpha = fadeIn;
        coverImage(ctx, d.photo, 0, 0, W, ph);
        const g = ctx.createLinearGradient(0, ph * 0.35, 0, ph);
        g.addColorStop(0, "rgba(255,253,249,0)");
        g.addColorStop(1, IVORY);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, ph);
        ctx.restore();
      } else {
        ctx.fillStyle = soft;
        ctx.fillRect(0, 0, W, ph);
      }
      top0 = ph - 90 * u;
    }
    if (design === "minimal") {
      ctx.save();
      ctx.globalAlpha = fadeIn;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 3 * u;
      ctx.strokeRect(48 * u, 48 * u, W - 96 * u, H - 96 * u);
      ctx.restore();
    }
    if (design === "floral") {
      const k = easeOut(seg(t, 0.05, 0.45));
      sprig(ctx, 0, 0, 1, 1, u, k, primary);
      sprig(ctx, W, 0, -1, 1, u, k, primary);
      sprig(ctx, 0, H, 1, -1, u, k, primary);
      sprig(ctx, W, H, -1, -1, u, k, primary);
    }
    const pad = 120 * u;
    const avail = H - top0 - pad * 2;
    const qrSize = Math.min(W * 0.6, avail - HEAD - TAIL);
    const block = HEAD + qrSize + TAIL;
    const top = top0 + pad + Math.max(0, (avail - block) / 2) + 40 * u;
    greet(top, primary);
    text(names, W / 2, top + 105 * u, design === "minimal" ? 96 * u : 88 * u, { font: SERIF, weight: 600, color: INK });
    text(d.dateLine, W / 2, top + 160 * u, 32 * u, { color: "#6E5548" });
    const qy = top + HEAD - 30 * u;
    const qx2 = (W - qrSize) / 2;
    if (design === "garden") {
      // Faint flowers fill the card but keep well away from the code: a busy background next to
      // the code made strict scanners pick up false corner squares.
      gardenPattern(ctx, W, H, u, primary, { x: qx2 - 110 * u, y: qy - 110 * u, w: qrSize + 220 * u, h: qrSize + 220 * u });
      // a soft panel keeps the code's background light and even
      ctx.save();
      ctx.globalAlpha = fadeIn;
      ctx.fillStyle = IVORY;
      // no outline: a border this close to the code confused the scan test
      ctx.shadowColor = "rgba(107,16,32,0.12)";
      ctx.shadowBlur = 30 * u;
      roundRect(ctx, qx2 - 24 * u, qy - 24 * u, qrSize + 48 * u, qrSize + 48 * u, 40 * u);
      ctx.fill();
      ctx.restore();
    }
    const style = design === "garden" ? "garden" : design === "photo" && d.photo ? "photo" : "liquid";
    drawQr(ctx, m, { x: qx2, y: qy, size: qrSize, fg: deep, bg: IVORY, style, t, monogram: d.monogram, photo: d.photo });
    text(d.scanLine, W / 2, qy + qrSize + 75 * u, 38 * u, { color: primary, weight: 600 });
    text(d.footer, W / 2, H - (design === "minimal" ? 78 : 50) * u, 22 * u, { color: "#6E5548" });
  }

  // a gold glint passes across once at the end
  const sh = seg(t, 0.86, 1);
  if (sh > 0 && sh < 1) {
    const x = -W * 0.4 + sh * W * 1.8;
    const g = ctx.createLinearGradient(x - 160 * u, 0, x + 160 * u, H * 0.25);
    g.addColorStop(0, "rgba(255,236,190,0)");
    g.addColorStop(0.5, "rgba(255,236,190,0.35)");
    g.addColorStop(1, "rgba(255,236,190,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// ── drawing helpers ───────────────────────────────────────────────────

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  if (r <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Arch with an elliptical dome of height dh (a full semicircle when dh = w / 2). */
function archPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dh = w / 2) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + dh);
  ctx.ellipse(x + r, y + dh, r, dh, 0, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/** Fills the box with the image like CSS object-fit: cover, cropped to the box. */
function coverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = `${px}px`;
}

function fitFont(ctx: CanvasRenderingContext2D, s: string, maxW: number, size: number, family: string, weight: number) {
  let f = size;
  ctx.font = `${weight} ${f}px ${family}`;
  while (ctx.measureText(s).width > maxW && f > size * 0.45) {
    f -= Math.max(1, size * 0.04);
    ctx.font = `${weight} ${f}px ${family}`;
  }
}

/** Text running along the top (clockwise) or bottom (readable, counter-clockwise) of a circle. reveal: 0 → 1 writes it in. */
function arcText(ctx: CanvasRenderingContext2D, s: string, cx: number, cy: number, r: number, top: boolean, size: number, family: string, reveal: number) {
  if (reveal <= 0) return;
  ctx.save();
  ctx.font = `600 ${size}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = Array.from(s);
  const widths = chars.map((ch) => ctx.measureText(ch).width + size * 0.12);
  const total = widths.reduce((a, b) => a + b, 0);
  const maxArc = Math.PI * 0.9;
  const scale = Math.min(1, (maxArc * r) / total);
  let angle = (top ? -Math.PI / 2 : Math.PI / 2) + ((top ? -1 : 1) * (total * scale)) / (2 * r);
  const shown = Math.ceil(chars.length * reveal);
  for (let i = 0; i < chars.length; i++) {
    const a = (widths[i] * scale) / r;
    angle += top ? a / 2 : -a / 2;
    if (i < shown) {
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.rotate(top ? angle + Math.PI / 2 : angle - Math.PI / 2);
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
    }
    angle += top ? a / 2 : -a / 2;
  }
  ctx.restore();
}

function dotsPattern(ctx: CanvasRenderingContext2D, W: number, H: number, u: number) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 10 * u; y < H; y += 26 * u) for (let x = 10 * u; x < W; x += 26 * u) circle(ctx, x, y, 1.6 * u);
  ctx.restore();
}

function frameLines(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4 * u;
  roundRect(ctx, 40 * u, 40 * u, W - 80 * u, H - 80 * u, 36 * u);
  ctx.stroke();
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.5 * u;
  roundRect(ctx, 58 * u, 58 * u, W - 116 * u, H - 116 * u, 26 * u);
  ctx.stroke();
  ctx.restore();
}

/** String of lights across the top; bulbs light up one after another during the animation. */
function lights(ctx: CanvasRenderingContext2D, W: number, y0: number, u: number, t: number, wire = "rgba(255,255,255,.45)", inset = 150 * u) {
  const x0 = inset;
  const x1 = W - inset;
  ctx.save();
  ctx.strokeStyle = wire;
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(W / 2, y0 + 70 * u, x1, y0);
  ctx.stroke();
  const n = 15;
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    const x = x0 + k * (x1 - x0);
    const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * (y0 + 70 * u) + k * k * y0;
    const on = clamp((t - 0.1 - i * 0.025) / 0.12);
    ctx.globalAlpha = 0.35 + 0.65 * on;
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.fillRect(x - 5 * u, y, 10 * u, 9 * u);
    ctx.fillStyle = i % 3 === 1 ? "#FFF3DC" : MARIGOLD;
    ctx.beginPath();
    ctx.ellipse(x, y + 24 * u, 10 * u, 14 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A sprig of marigolds and leaves growing out of a corner. (sx, sy) point it inwards. */
function sprig(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number, u: number, k: number, leafTint: string) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx * k, sy * k);
  ctx.strokeStyle = "#5C7A3A";
  ctx.lineWidth = 4 * u;
  ctx.beginPath();
  ctx.moveTo(10 * u, 10 * u);
  ctx.quadraticCurveTo(120 * u, 40 * u, 230 * u, 150 * u);
  ctx.stroke();
  const leaf = (lx: number, ly: number, a: number) => {
    ctx.save();
    ctx.translate(lx * u, ly * u);
    ctx.rotate(a);
    ctx.fillStyle = "#6E8F45";
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 * u, 10 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  leaf(70, 40, 0.7);
  leaf(130, 60, -0.3);
  leaf(170, 110, 1.1);
  const bloom = (bx: number, by: number, r: number) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? MARIGOLD : "#E8890C";
      circle(ctx, (bx + Math.cos(a) * r * 0.55) * u, (by + Math.sin(a) * r * 0.55) * u, r * 0.5 * u);
    }
    ctx.fillStyle = "#C25E06";
    circle(ctx, bx * u, by * u, r * 0.35 * u);
  };
  bloom(60, 70, 34);
  bloom(150, 30, 26);
  bloom(205, 125, 30);
  ctx.fillStyle = leafTint;
  circle(ctx, 110 * u, 105 * u, 9 * u);
  circle(ctx, 30 * u, 140 * u, 7 * u);
  ctx.restore();
}

/** Generative background of tiny flowers in a faint tint: the artwork behind the "garden" code. */
function gardenPattern(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, tint: string, keepClear: { x: number; y: number; w: number; h: number }) {
  ctx.save();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = (6 + rnd() * 14) * u;
    // ≤9% opacity: below the contrast a scanner reads as "dark", so the pattern can never pose as code
    const a = 0.05 + rnd() * 0.04;
    if (x > keepClear.x - r && x < keepClear.x + keepClear.w + r && y > keepClear.y - r && y < keepClear.y + keepClear.h + r) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = i % 3 === 0 ? MARIGOLD : tint;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + i;
      circle(ctx, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.5);
    }
  }
  ctx.restore();
}
