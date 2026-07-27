// APP TDC service worker — recebe Web Push nativo enviado pelo backend
// e mostra a notificação mesmo com o app fechado.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "APP TDC", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "APP TDC";
  const options = {
    body: payload.body || "",
    icon: "/app-icon.png",
    badge: "/app-icon.png",
    tag: payload.tag || "tdc-live",
    renotify: true,
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          try {
            await c.navigate(url);
            return c.focus();
          } catch {}
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
