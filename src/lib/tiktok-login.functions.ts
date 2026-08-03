import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Login "Entrar com TikTok" (TikTok Login Kit / OAuth v2).
 * O estado é assinado com o client secret para amarrar o retorno
 * ao dispositivo que iniciou o login.
 */
export const startTikTokLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { deviceId: string }) => {
    if (!data?.deviceId || data.deviceId.length < 8 || data.deviceId.length > 64) {
      throw new Error("dispositivo inválido");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const clientKey = process.env["TIKTOK_CLIENT_KEY"];
    const clientSecret = process.env["TIKTOK_CLIENT_SECRET"];
    if (!clientKey || !clientSecret) {
      return { ok: false as const, error: "login_nao_configurado" };
    }
    const { signState } = await import("@/lib/tiktok-oauth.server");
    const request = getRequest();
    const origin = new URL(request!.url).origin;
    const redirectUri = `${origin}/api/public/tiktok/callback`;

    const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key", clientKey);
    url.searchParams.set("scope", "user.info.basic,user.info.profile");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", signState(data.deviceId, clientSecret));

    return { ok: true as const, url: url.toString() };
  });
