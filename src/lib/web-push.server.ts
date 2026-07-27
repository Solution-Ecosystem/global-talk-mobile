// Server-only helper to send Web Push notifications via VAPID.
import webpush from "web-push";

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const prv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT || "mailto:notify@apptdc.local";
  if (!pub || !prv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(sub, pub, prv);
  configured = true;
}

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(
  sub: StoredSubscription,
  payload: Record<string, unknown>,
) {
  configure();
  const pushSub = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    await webpush.sendNotification(pushSub, JSON.stringify(payload), { TTL: 300 });
    return { ok: true as const };
  } catch (err) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : 0;
    return { ok: false as const, statusCode, error: err };
  }
}
