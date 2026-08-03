import { createServerFn } from "@tanstack/react-start";

export type ChatProfile = {
  device_id: string;
  tiktok_username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ChatMessage = {
  id: string;
  tiktok_username: string;
  display_name: string | null;
  avatar_url: string | null;
  body: string;
  created_at: string;
};

const TIKTOK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};

function cleanUsername(raw: string) {
  return raw.trim().replace(/^@/, "").replace(/\/+$/, "");
}

/** Vincula a conta do TikTok do usuário do app (valida o @ no TikTok). */
export const linkTikTokAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { deviceId: string; username: string }) => {
    if (!data?.deviceId || data.deviceId.length < 8 || data.deviceId.length > 64) {
      throw new Error("dispositivo inválido");
    }
    const username = cleanUsername(String(data.username ?? ""));
    if (!/^[\w.\-]{2,24}$/.test(username)) throw new Error("@ inválido");
    return { deviceId: data.deviceId, username };
  })
  .handler(async ({ data }) => {
    const res = await fetch(
      `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(
        data.username,
      )}`,
      { headers: TIKTOK_HEADERS },
    );
    if (!res.ok) return { ok: false as const, error: "tiktok_indisponivel" };
    const json = (await res.json()) as {
      data?: {
        user?: { id?: string; uniqueId?: string; nickname?: string; avatarMedium?: string };
      };
    };
    const user = json?.data?.user;
    if (!user?.uniqueId) return { ok: false as const, error: "conta_nao_encontrada" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = {
      device_id: data.deviceId,
      tiktok_username: user.uniqueId,
      display_name: user.nickname ?? user.uniqueId,
      avatar_url: user.avatarMedium ?? null,
    };
    const { error } = await supabaseAdmin
      .from("chat_profiles")
      .upsert(profile, { onConflict: "device_id" });
    if (error) return { ok: false as const, error: error.message };

    // Guarda o nome do usuário do TikTok pelo ID — usado na galeria
    // para mostrar quem iluminou o presente em vez do ID numérico.
    if (user.id) {
      await supabaseAdmin.from("tiktok_user_names").upsert(
        { uid: String(user.id), name: user.nickname ?? user.uniqueId },
        { onConflict: "uid" },
      );
    }
    return { ok: true as const, profile: profile as ChatProfile };
  });

export const getChatProfile = createServerFn({ method: "GET" })
  .inputValidator((data: { deviceId: string }) => {
    if (!data?.deviceId) throw new Error("dispositivo inválido");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("chat_profiles")
      .select("device_id, tiktok_username, display_name, avatar_url")
      .eq("device_id", data.deviceId)
      .maybeSingle();
    return { profile: (row ?? null) as ChatProfile | null };
  });

export const getChatMessages = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("chat_messages")
    .select("id, device_id, tiktok_username, display_name, avatar_url, body, created_at")
    .order("created_at", { ascending: false })
    .limit(120);
  return { messages: ((data ?? []) as ChatMessage[]).reverse() };
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { deviceId: string; body: string }) => {
    if (!data?.deviceId) throw new Error("dispositivo inválido");
    const body = String(data.body ?? "").trim();
    if (!body || body.length > 500) throw new Error("mensagem inválida");
    return { deviceId: data.deviceId, body };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("chat_profiles")
      .select("device_id, tiktok_username, display_name, avatar_url")
      .eq("device_id", data.deviceId)
      .maybeSingle();
    if (!profile) return { ok: false as const, error: "conta_nao_vinculada" };

    const { error } = await supabaseAdmin.from("chat_messages").insert({
      device_id: profile.device_id,
      tiktok_username: profile.tiktok_username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      body: data.body,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
