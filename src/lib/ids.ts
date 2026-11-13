import { randomBytes, randomInt } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l)

export function newId(len = 16): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function newOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
