import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppProfile = {
  id: string;
  name: string;
  tiktok_username: string | null;
  tiktok_display_name: string | null;
  tiktok_avatar_url: string | null;
  terms_accepted_at: string | null;
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

/** Perfil do usuário logado (nome + @ do TikTok vinculado). */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("app_profiles")
      .select(
        "id, name, tiktok_username, tiktok_display_name, tiktok_avatar_url, terms_accepted_at",
      )
      .eq("id", context.userId)
      .maybeSingle();
    return { profile: (data ?? null) as AppProfile | null };
  });

/** Vincula o @ do TikTok à conta logada (valida a conta no TikTok). */
export const linkTikTok = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { username: string }) => {
    const username = cleanUsername(String(data?.username ?? ""));
    if (!/^[\w.\-]{2,24}$/.test(username)) throw new Error("@ inválido");
    return { username };
  })
  .handler(async ({ data, context }) => {
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

    const { error } = await context.supabase
      .from("app_profiles")
      .update({
        tiktok_username: user.uniqueId,
        tiktok_display_name: user.nickname ?? user.uniqueId,
        tiktok_avatar_url: user.avatarMedium ?? null,
      })
      .eq("id", context.userId);
    if (error) {
      return {
        ok: false as const,
        error: error.code === "23505" ? "ja_vinculado" : error.message,
      };
    }

    if (user.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("tiktok_user_names")
        .upsert({ uid: String(user.id), name: user.nickname ?? user.uniqueId }, { onConflict: "uid" });
    }
    return { ok: true as const };
  });

/** Atualiza o nome exibido no chat. */
export const updateMyName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string }) => {
    const name = String(data?.name ?? "").trim();
    if (name.length < 2 || name.length > 40) throw new Error("nome inválido");
    return { name };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("app_profiles")
      .update({ name: data.name })
      .eq("id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
