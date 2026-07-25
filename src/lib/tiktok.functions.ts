import { createServerFn } from "@tanstack/react-start";

/**
 * Detecta se um usuário TikTok está ao vivo consultando a página pública /live.
 * Não usa API oficial (o endpoint público não requer autenticação).
 */
export const getTikTokLiveStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => {
    if (!data || typeof data.username !== "string" || !/^[\w.\-]{1,30}$/.test(data.username)) {
      throw new Error("username inválido");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const url = `https://www.tiktok.com/@${data.username}/live`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      if (!res.ok) {
        return { isLive: false, checkedAt: Date.now(), error: `status_${res.status}` as const };
      }

      const html = await res.text();

      // A página /live embute um JSON de hidratação. Quando o streamer está
      // ao vivo há um liveRoom com status 2 (ou 4, em pré-live). Quando offline
      // a página traz "LiveRoom":{...,"liveRoomUserInfo":...} porém sem
      // "status":2 e geralmente exibe recomendações.
      const statusMatch = html.match(/"status"\s*:\s*(\d+)[^}]{0,200}"roomId"/);
      const roomIdMatch = html.match(/"roomId"\s*:\s*"(\d+)"/);
      const liveStatusFlag = html.match(/"liveStatus"\s*:\s*(\d+)/);

      const status = statusMatch ? Number(statusMatch[1]) : null;
      const liveStatus = liveStatusFlag ? Number(liveStatusFlag[1]) : null;
      const roomId = roomIdMatch && roomIdMatch[1] !== "0" ? roomIdMatch[1] : null;

      // status === 2 => ao vivo. liveStatus === 1 também indica live.
      const isLive = status === 2 || liveStatus === 1;

      return {
        isLive,
        roomId,
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
