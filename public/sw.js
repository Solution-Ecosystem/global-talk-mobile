// APP TDC service worker: mantém uma verificação periódica do status
// da live no TikTok e dispara notificação quando o streamer entra ao vivo.

const USERNAME = "caiquevieira_";
const CHECK_URL = `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(USERNAME)}`;
const STATE_CACHE = "tdc-live-state-v1";
const STATE_REQ = new Request("/__tdc_live_state__");

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function readState() {
  try {
    const cache = await caches.open(STATE_CACHE);
    const res = await cache.match(STATE_REQ);
    if (!res) return { isLive: false, roomId: null };
    return await res.json();
  } catch {
    return { isLive: false, roomId: null };
  }
}

async function writeState(state) {
  const cache = await caches.open(STATE_CACHE);
  await cache.put(
    STATE_REQ,
    new Response(JSON.stringify(state), { headers: { "Content-Type": "application/json" } }),
  );
}

async function checkLive() {
  try {
    const res = await fetch(CHECK_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return;
    const json = await res.json();
    const liveStatus = json?.data?.liveRoom?.status;
    const userStatus = json?.data?.user?.status;
    const isLive = liveStatus === 2 || userStatus === 2;
    const roomId = json?.data?.user?.roomId ?? null;

    const prev = await readState();
    await writeState({ isLive, roomId });

    if (isLive && (!prev.isLive || prev.roomId !== roomId)) {
      await self.registration.showNotification("APP TDC — Streamer ao vivo!", {
        body: "O streamer está ao vivo agora no TikTok. Toque para assistir.",
        icon: "/app-icon.png",
        badge: "/app-icon.png",
        tag: `tdc-live-${roomId ?? "live"}`,
        renotify: true,
        data: { url: `https://www.tiktok.com/@${USERNAME}/live` },
      });
    }
  } catch {
    // silencioso
  }
}

self.addEventListener("message", (event) => {
  if (event.data === "check-live") {
    event.waitUntil(checkLive());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "tdc-live-check") {
    event.waitUntil(checkLive());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "tdc-live-check") {
    event.waitUntil(checkLive());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || `https://www.tiktok.com/@${USERNAME}/live`;
  event.waitUntil(self.clients.openWindow(url));
});
