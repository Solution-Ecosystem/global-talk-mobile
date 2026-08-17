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
  remaining: number;
  is_gallery: boolean;
  sponsor_id: string | null;
  sponsor_name: string | null;
};

export const getGifts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: items }, { data: state }, { data: names }] = await Promise.all([
    supabaseAdmin
      .from("gift_items")
      .select(
        "id, gallery, name, lit, position, coins, icon_url, tiktok_gift_id, remaining, is_gallery, sponsor_id, sponsor_name",
      )
      .order("gallery", { ascending: true })
      .order("position", { ascending: true }),
    supabaseAdmin.from("gift_state").select("current_gallery, league, updated_at").eq("id", 1).single(),
    supabaseAdmin.from("tiktok_user_names").select("uid, name"),
  ]);
  // Substitui o ID do presenteador pelo nome real sempre que ele for conhecido.
  const nameByUid = new Map((names ?? []).map((n) => [n.uid, n.name] as const));
  const resolved = ((items ?? []) as GiftItem[]).map((i) => ({
    ...i,
    sponsor_name: i.sponsor_name ?? (i.sponsor_id ? (nameByUid.get(i.sponsor_id) ?? null) : null),
  }));
  return {
    items: resolved,
    currentGallery: (state?.current_gallery ?? "D") as Gallery,
    league: (state?.league ?? null) as string | null,
    updatedAt: state?.updated_at ?? null,
  };
});


/**
 * Sincroniza a galeria de presentes real da live do TikTok.
 * Lê `gifts_info.gift_gallery_info` (liga atual do streamer) e
 * `panel_refresh_data.gallery_data` (quantos presentes ainda faltam
 * para iluminar cada item da galeria).
 */
export const syncGiftsFromTikTok = createServerFn({ method: "POST" })
  .inputValidator((data?: { pin?: string }) => data ?? {})
  .handler(async () => {
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
          image?: { url_list?: string[] };
          icon?: { url_list?: string[] };
        }>;
        gifts_info?: {
          gift_gallery_info?: {
            anchor_ranking_league?: string;
            gallery_ranking_league?: string;
          };
        };
        panel_refresh_data?: {
          gallery_data?: Array<{
            gift_id?: number;
            left_count_to_sponsor?: number;
            is_gallery_available?: boolean;
            sponsor_id?: number | string;
          }>;
        };
      };
    };

    const catalog = new Map(
      (giftJson?.data?.gifts ?? [])
        .filter((g) => g.id != null)
        .map((g) => [String(g.id), g] as const),
    );
    const galleryData = (giftJson?.data?.panel_refresh_data?.gallery_data ?? []).filter(
      (e) => e.gift_id != null,
    );
    if (galleryData.length === 0) {
      return { ok: false as const, error: "galeria_indisponivel" };
    }

    const info = giftJson?.data?.gifts_info?.gift_gallery_info;
    const league = info?.anchor_ranking_league ?? info?.gallery_ranking_league ?? null;
    const letter = (info?.gallery_ranking_league ?? league ?? "D").charAt(0).toUpperCase();
    const gallery = (["A", "B", "C", "D"].includes(letter) ? letter : "D") as Gallery;

    const rows = galleryData
      .map((e) => {
        const g = catalog.get(String(e.gift_id));
        const remaining = Math.max(0, Number(e.left_count_to_sponsor ?? 0));
        const sponsorId = String(e.sponsor_id ?? "0");
        const sponsored = sponsorId !== "0" && sponsorId !== "";
        return {
          tiktok_gift_id: String(e.gift_id),
          name: String(g?.name ?? `Presente ${e.gift_id}`),
          coins: Number(g?.diamond_count ?? 0),
          icon_url: g?.image?.url_list?.[0] ?? g?.icon?.url_list?.[0] ?? null,
          remaining,
          sponsor_id: sponsored ? sponsorId : null,
          lit: sponsored || remaining === 0,
        };
      })
      .sort((a, b) => a.coins - b.coins);

    const payload = rows.map((r, i) => ({
      ...r,
      gallery,
      is_gallery: true,
      position: i + 1,
    }));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Itens já existentes da galeria (para preservar nomes de presenteadores
    // preenchidos manualmente e itens que o TikTok já removeu por estarem completos)
    const { data: existing } = await supabaseAdmin
      .from("gift_items")
      .select("id, gallery, tiktok_gift_id, sponsor_name")
      .eq("is_gallery", true);

    const nameById = new Map(
      (existing ?? [])
        .filter((e) => e.tiktok_gift_id && e.sponsor_name)
        .map((e) => [e.tiktok_gift_id as string, e.sponsor_name as string] as const),
    );

    // A galeria mostrada é sempre um espelho exato da API do TikTok:
    // qualquer item que não venha na resposta atual é removido
    // (galerias antigas ou presentes que saíram da galeria).
    const currentIds = new Set(payload.map((p) => p.tiktok_gift_id));
    const staleIds = (existing ?? [])
      .filter((e) => e.gallery !== gallery || !e.tiktok_gift_id || !currentIds.has(e.tiktok_gift_id))
      .map((e) => e.id);
    if (staleIds.length > 0) {
      await supabaseAdmin.from("gift_items").delete().in("id", staleIds);
    }

    const { error } = await supabaseAdmin.from("gift_items").upsert(
      payload.map((p) => ({ ...p, sponsor_name: nameById.get(p.tiktok_gift_id) ?? null })),
      { onConflict: "gallery,tiktok_gift_id", ignoreDuplicates: false },
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }

    await supabaseAdmin.from("gift_state").upsert({
      id: 1,
      current_gallery: gallery,
      league,
      updated_at: new Date().toISOString(),
    });

    return {
      ok: true as const,
      imported: payload.length,
      gallery,
      league,
      lit: payload.filter((p) => p.lit).length,
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
      sponsorName?: { id: string; name: string };
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
    if (data.sponsorName) {
      let name = data.sponsorName.name.trim().slice(0, 60);

      // Se o admin informar um @, buscamos o nome real do perfil no TikTok.
      if (name.startsWith("@")) {
        const username = name.slice(1).replace(/\/+$/, "");
        if (/^[\w.\-]{2,24}$/.test(username)) {
          try {
            const res = await fetch(
              `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(username)}`,
              {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  Referer: "https://www.tiktok.com/",
                },
              },
            );
            if (res.ok) {
              const json = (await res.json()) as {
                data?: { user?: { id?: string; nickname?: string; uniqueId?: string } };
              };
              const user = json?.data?.user;
              if (user?.nickname) name = user.nickname.slice(0, 60);
              if (user?.id && user?.nickname) {
                await supabaseAdmin
                  .from("tiktok_user_names")
                  .upsert({ uid: String(user.id), name: user.nickname }, { onConflict: "uid" });
              }
            }
          } catch {
            /* mantém o texto digitado */
          }
        }
      }

      const { data: item } = await supabaseAdmin
        .from("gift_items")
        .select("sponsor_id")
        .eq("id", data.sponsorName.id)
        .maybeSingle();

      await supabaseAdmin
        .from("gift_items")
        .update({ sponsor_name: name || null })
        .eq("id", data.sponsorName.id);

      // Guarda o nome para esse ID de presenteador, para aparecer
      // automaticamente nos próximos presentes que ele iluminar.
      if (name && item?.sponsor_id) {
        await supabaseAdmin
          .from("tiktok_user_names")
          .upsert({ uid: item.sponsor_id, name }, { onConflict: "uid" });
      }
    }

    return { ok: true as const };
  });
