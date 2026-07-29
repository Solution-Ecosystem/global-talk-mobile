import { createServerFn } from "@tanstack/react-start";

export type Gallery = "D" | "C" | "B" | "A";

export type GiftItem = {
  id: string;
  gallery: Gallery;
  name: string;
  lit: boolean;
  position: number;
  coins: number;
  icon_url: string | null;
  tiktok_gift_id: string | null;
};

export const getGifts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: items }, { data: state }] = await Promise.all([
    supabaseAdmin
      .from("gift_items")
      .select("id, gallery, name, lit, position, coins, icon_url, tiktok_gift_id")
      .order("gallery", { ascending: true })
      .order("position", { ascending: true }),
    supabaseAdmin.from("gift_state").select("current_gallery").eq("id", 1).single(),
  ]);
  return {
    items: (items ?? []) as GiftItem[],
    currentGallery: (state?.current_gallery ?? "D") as Gallery,
  };
});

/**
 * Sincroniza a lista real de presentes da live do TikTok.
 * A TikTok não expõe publicamente o progresso "iluminado" da coleção
 * (é por espectador e exige login), então importamos o catálogo real
 * de presentes e o estado iluminado continua sendo marcado no app.
 */
export const syncGiftsFromTikTok = createServerFn({ method: "POST" })
  .inputValidator((data: { pin: string }) => {
    if (!data || typeof data.pin !== "string" || data.pin.length < 3) {
      throw new Error("PIN inválido");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const expected = process.env.GIFTS_ADMIN_PIN;
    if (!expected || data.pin !== expected) {
      return { ok: false as const, error: "pin_incorreto" };
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://www.tiktok.com/",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    };

    const roomRes = await fetch(
      "https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=caiquevieira_",
      { headers },
    );
    if (!roomRes.ok) {
      return { ok: false as const, error: `tiktok_http_${roomRes.status}` };
    }
    const roomJson = (await roomRes.json()) as {
      data?: { user?: { roomId?: string } };
    };
    const roomId = roomJson?.data?.user?.roomId;
    if (!roomId || roomId === "0") {
      return { ok: false as const, error: "sem_sala_ativa" };
    }

    const giftRes = await fetch(
      `https://webcast.tiktok.com/webcast/gift/list/?aid=1988&app_language=pt-BR&room_id=${encodeURIComponent(roomId)}`,
      { headers },
    );
    if (!giftRes.ok) {
      return { ok: false as const, error: `tiktok_http_${giftRes.status}` };
    }
    const giftJson = (await giftRes.json()) as {
      data?: {
        gifts?: Array<{
          id?: number | string;
          name?: string;
          diamond_count?: number;
          is_displayed_on_panel?: boolean;
          image?: { url_list?: string[] };
          icon?: { url_list?: string[] };
        }>;
      };
    };
    const gifts = giftJson?.data?.gifts ?? [];
    if (gifts.length === 0) {
      return { ok: false as const, error: "lista_vazia" };
    }

    const tierFor = (coins: number): Gallery =>
      coins >= 10000 ? "A" : coins >= 1000 ? "B" : coins >= 100 ? "C" : "D";

    const rows = gifts
      .filter((g) => g.id != null && g.name && g.is_displayed_on_panel !== false)
      .map((g) => ({
        tiktok_gift_id: String(g.id),
        name: String(g.name),
        coins: Number(g.diamond_count ?? 0),
        icon_url: g.image?.url_list?.[0] ?? g.icon?.url_list?.[0] ?? null,
      }))
      .sort((a, b) => a.coins - b.coins);

    const counters: Record<Gallery, number> = { D: 0, C: 0, B: 0, A: 0 };
    const payload = rows.map((r) => {
      const gallery = tierFor(r.coins);
      counters[gallery] += 1;
      return { ...r, gallery, position: counters[gallery] };
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("gift_items")
      .upsert(payload, { onConflict: "gallery,tiktok_gift_id", ignoreDuplicates: false });
    if (error) {
      return { ok: false as const, error: error.message };
    }

    return {
      ok: true as const,
      imported: payload.length,
      byGallery: counters,
    };
  });

export const updateGifts = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      pin: string;
      currentGallery?: Gallery;
      toggle?: { id: string; lit: boolean };
      add?: { gallery: Gallery; name: string };
      remove?: { id: string };
    }) => {
      if (!data || typeof data.pin !== "string" || data.pin.length < 3) {
        throw new Error("PIN inválido");
      }
      if (data.add && (!data.add.name.trim() || data.add.name.length > 60)) {
        throw new Error("Nome inválido");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const expected = process.env.GIFTS_ADMIN_PIN;
    if (!expected || data.pin !== expected) {
      return { ok: false as const, error: "pin_incorreto" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.currentGallery) {
      await supabaseAdmin
        .from("gift_state")
        .upsert({ id: 1, current_gallery: data.currentGallery, updated_at: new Date().toISOString() });
    }
    if (data.toggle) {
      await supabaseAdmin
        .from("gift_items")
        .update({ lit: data.toggle.lit })
        .eq("id", data.toggle.id);
    }
    if (data.add) {
      const { count } = await supabaseAdmin
        .from("gift_items")
        .select("id", { count: "exact", head: true })
        .eq("gallery", data.add.gallery);
      await supabaseAdmin.from("gift_items").insert({
        gallery: data.add.gallery,
        name: data.add.name.trim(),
        position: (count ?? 0) + 1,
      });
    }
    if (data.remove) {
      await supabaseAdmin.from("gift_items").delete().eq("id", data.remove.id);
    }
    return { ok: true as const };
  });
