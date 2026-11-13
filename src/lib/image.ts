/** Shrinks a photo in the browser so it uploads fast on 3G and fits in a DB row. */
export async function compressImage(file: File, maxSide = 720, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("unsupported image");
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  let out = canvas.toDataURL("image/jpeg", quality);
  if (out.length > 350_000) out = canvas.toDataURL("image/jpeg", 0.6);
  if (out.length > 390_000) throw new Error("too large");
  return out;
}
