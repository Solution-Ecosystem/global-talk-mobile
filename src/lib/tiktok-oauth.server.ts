import { createHmac, timingSafeEqual } from "node:crypto";

/** Assina o deviceId para usar como `state` do OAuth do TikTok. */
export function signState(deviceId: string, secret: string) {
  const ts = Date.now().toString();
  const payload = `${deviceId}.${ts}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Valida o `state` devolvido pelo TikTok e retorna o deviceId. */
export function verifyState(state: string, secret: string): string | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [deviceId, ts, sig] = parts as [string, string, string];
  const expected = createHmac("sha256", secret).update(`${deviceId}.${ts}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(ts) > 15 * 60 * 1000) return null;
  return deviceId;
}
