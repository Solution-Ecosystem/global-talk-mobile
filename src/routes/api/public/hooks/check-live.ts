import { createFileRoute } from "@tanstack/react-router";

const USERNAME = "caiquevieira_";
const CHECK_URL = `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(USERNAME)}`;

async function fetchLive() {
  try {
    const res = await fetch(CHECK_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return { isLive: false as const };
    const json = (await res.json()) as {
      data?: {
        user?: { status?: number; roomId?: string };
        liveRoom?: { status?: number; title?: string };
      };
    };
    const liveStatus = json?.data?.liveRoom?.status;
    const userStatus = json?.data?.user?.status;
    const isLive = liveStatus === 2 || userStatus === 2;
    return {
      isLive,
      roomId: json?.data?.user?.roomId ?? null,
      title: json?.data?.liveRoom?.title ?? null,
    };
  } catch {
    return { isLive: false as const };
  }
}

export const Route = createFileRoute("/api/public/hooks/check-live")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPush } = await import("@/lib/web-push.server");

        const live = await fetchLive();
        const roomId = "roomId" in live ? (live.roomId ?? null) : null;
        const title = "title" in live ? (live.title ?? null) : null;

        const { data: prev } = await supabaseAdmin
          .from("live_state")
          .select("*")
          .eq("id", 1)
          .single();

        const shouldNotify =
          live.isLive &&
          roomId &&
          (!prev?.is_live || prev?.last_notified_room_id !== roomId);

        let notified = 0;
        let removed = 0;

        if (shouldNotify) {
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth");
          const payload = {
            title: "APP TDC — Caique está ao vivo!",
            body: title ? String(title).slice(0, 120) : "Toque para assistir agora no TikTok.",
            url: `https://www.tiktok.com/@${USERNAME}/live`,
            tag: `tdc-live-${roomId}`,
          };
          const toRemove: string[] = [];
          for (const s of subs ?? []) {
            const r = await sendPush(s, payload);
            if (r.ok) {
              notified++;
            } else if (r.statusCode === 404 || r.statusCode === 410) {
              toRemove.push(s.endpoint);
            }
          }
          if (toRemove.length) {
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .in("endpoint", toRemove);
            removed = toRemove.length;
          }
        }

        await supabaseAdmin.from("live_state").upsert({
          id: 1,
          is_live: live.isLive,
          room_id: roomId,
          title,
          last_notified_room_id: shouldNotify ? roomId : (prev?.last_notified_room_id ?? null),
          updated_at: new Date().toISOString(),
        });

        return Response.json({
          isLive: live.isLive,
          roomId,
          notified,
          removed,
          transitioned: !!shouldNotify,
        });
      },
    },
  },
});
