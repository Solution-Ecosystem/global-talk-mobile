import { createServerFn } from "@tanstack/react-start";

/**
 * Detecta se um usuário TikTok está ao vivo.
 * Usa o endpoint público não-oficial api-live/user/room que a própria TikTok
 * consome no site web. Retorna status=2 quando ao vivo; 4 = live encerrada.
 */
export const getTikTokLiveStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => {
    if (!data || typeof data.username !== "string" || !/^[\w.\-]{1,30}$/.test(data.username)) {
      throw new Error("username inválido");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const url = `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(
      data.username,
    )}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.tiktok.com/",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });
      if (!res.ok) {
        return { isLive: false, checkedAt: Date.now(), error: `http_${res.status}` };
      }
      const json = (await res.json()) as {
        data?: {
          user?: { status?: number; roomId?: string; nickname?: string };
          liveRoom?: { status?: number; title?: string; liveRoomStats?: { userCount?: number } };
        };
      };
      const liveStatus = json?.data?.liveRoom?.status;
      const userStatus = json?.data?.user?.status;
      // status === 2 => ao vivo agora. 4 => live encerrada. 0/undef => offline.
      const isLive = liveStatus === 2 || userStatus === 2;
      return {
        isLive,
        roomId: json?.data?.user?.roomId ?? null,
        title: json?.data?.liveRoom?.title ?? null,
        viewers: json?.data?.liveRoom?.liveRoomStats?.userCount ?? null,
        checkedAt: Date.now(),
      };
    } catch (err) {
      return {
        isLive: false,
        checkedAt: Date.now(),
        error: err instanceof Error ? err.message : "unknown",
      };
    }
  });
