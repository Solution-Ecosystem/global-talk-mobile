import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChatMessage = {
  id: string;
  tiktok_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  body: string;
  created_at: string;
};

/** Mensagens do chat (somente para usuários logados). */
export const getChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("chat_messages")
      .select("id, tiktok_username, display_name, avatar_url, body, created_at")
      .order("created_at", { ascending: false })
      .limit(120);
    return { messages: ((data ?? []) as ChatMessage[]).reverse() };
  });

/** Envia mensagem — exige conta logada com @ do TikTok vinculado. */
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { body: string }) => {
    const body = String(data?.body ?? "").trim();
    if (!body || body.length > 500) throw new Error("mensagem inválida");
    return { body };
  })
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("app_profiles")
      .select("name, tiktok_username, tiktok_display_name, tiktok_avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.tiktok_username) return { ok: false as const, error: "tiktok_nao_vinculado" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("chat_messages").insert({
      user_id: context.userId,
      tiktok_username: profile.tiktok_username,
      display_name: profile.name || profile.tiktok_display_name || profile.tiktok_username,
      avatar_url: profile.tiktok_avatar_url,
      body: data.body,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
