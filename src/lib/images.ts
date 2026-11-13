import "server-only";
import { and, count, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { newId } from "./ids";

export const MAX_IMAGE_BYTES = 400_000;
const MAX_IMAGES_PER_REGISTRY = 400;

/** Identify the real file type from its first bytes; never trust the declared one. */
export function sniffMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Accepts a browser-compressed `data:image/...;base64,...` string. Returns "/img/<id>" or null. */
export async function saveImage(registryId: string, kind: "couple" | "item" | "proof", dataUrl: string): Promise<string | null> {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
  const mime = sniffMime(buf);
  if (!mime) return null;
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.images).where(eq(schema.images.registryId, registryId));
  if (n >= MAX_IMAGES_PER_REGISTRY) return null;
  const id = newId(20);
  await db.insert(schema.images).values({ id, registryId, kind, mime, bytes: buf.length, data: buf });
  return `/img/${id}`;
}

export function imageIdFromPath(path: string | null | undefined): string | null {
  const m = /^\/img\/([a-z0-9]{16,24})$/.exec(path ?? "");
  return m ? m[1] : null;
}

/** Deletes an image that belonged to this registry (ignores anything else). */
export async function deleteImage(registryId: string, path: string | null | undefined) {
  const id = imageIdFromPath(path);
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.images).where(and(eq(schema.images.id, id), eq(schema.images.registryId, registryId)));
}
