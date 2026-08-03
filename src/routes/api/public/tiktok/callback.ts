import { createFileRoute } from "@tanstack/react-router";
import { verifyState } from "@/lib/tiktok-oauth.server";

const TIKTOK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
};

function back(origin: string, status: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: `${origin}/chat?login=${status}` },
  });
}

export const Route = createFileRoute("/api/public/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const clientKey = process.env["TIKTOK_CLIENT_KEY"];
        const clientSecret = process.env["TIKTOK_CLIENT_SECRET"];
        if (!clientKey || !clientSecret) return back(origin, "nao_configurado");

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state") ?? "";
        if (!code) return back(origin, "cancelado");
        const deviceId = verifyState(state, clientSecret);
        if (!deviceId) return back(origin, "estado_invalido");

        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: `${origin}/api/public/tiktok/callback`,
          }),
        });
        const tokenJson = (await tokenRes.json()) as { access_token?: string };
        if (!tokenRes.ok || !tokenJson.access_token) return back(origin, "falha_token");

        const infoRes = await fetch(
          "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username",
          { headers: { Authorization: `Bearer ${tokenJson.access_token}` } },
        );
        const infoJson = (await infoRes.json()) as {
          data?: {
            user?: {
              open_id?: string;
              display_name?: string;
              avatar_url?: string;
              username?: string;
            };
          };
        };
        const user = infoJson?.data?.user;
        if (!user?.open_id) return back(origin, "falha_perfil");

        const username = user.username ?? user.display_name ?? user.open_id;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("chat_profiles").upsert(
          {
            device_id: deviceId,
            tiktok_username: username,
            display_name: user.display_name ?? username,
            avatar_url: user.avatar_url ?? null,
          },
          { onConflict: "device_id" },
        );
        if (error) return back(origin, "falha_salvar");

        // Descobre o ID numérico do TikTok para que a galeria possa mostrar
        // o nome de quem iluminou o presente em vez do ID.
        try {
          const res = await fetch(
            `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(username)}`,
            { headers: TIKTOK_HEADERS },
          );
          if (res.ok) {
            const json = (await res.json()) as {
              data?: { user?: { id?: string; nickname?: string } };
            };
            const uid = json?.data?.user?.id;
            const nickname = json?.data?.user?.nickname ?? user.display_name ?? username;
            if (uid) {
              await supabaseAdmin
                .from("tiktok_user_names")
                .upsert({ uid: String(uid), name: nickname }, { onConflict: "uid" });
            }
          }
        } catch {
          /* opcional */
        }

        return back(origin, "ok");
      },
    },
  },
});
