import { createServerFn } from "@tanstack/react-start";

export const LIVE_TOOLS = ["luva", "martelo", "nevoa", "impulso"] as const;
export type LiveTool = (typeof LIVE_TOOLS)[number];

export type LiveToolEntry = {
  id: string;
  tool: LiveTool;
  holder_name: string;
  note: string | null;
  position: number;
  updated_at: string;
  source: string;
};

/** Palavras usadas pelo TikTok para cada ferramenta da live (pt/en). */
const TOOL_KEYWORDS: Record<LiveTool, string[]> = {
  luva: ["luva", "glove"],
  martelo: ["martelo", "hammer"],
  nevoa: ["nevoa", "névoa", "fog", "mist"],
  impulso: ["impulso", "boost", "impulse"],
};

export const getLiveTools = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("live_tools")
    .select("id, tool, holder_name, note, position, updated_at, source")
    .order("tool", { ascending: true })
    .order("position", { ascending: true });
  return { entries: (data ?? []) as LiveToolEntry[] };
});

/**
 * Lê as ferramentas da live diretamente do TikTok.
 * As ferramentas (luva, martelo, névoa, impulso) são presentes da galeria da
 * liga: o painel da live informa quem patrocinou/iluminou cada uma delas.
 * A cada nova live (novo room_id) a lista automática é recriada.
 */
export const syncLiveToolsFromTikTok = createServerFn({ method: "POST" })
  .inputValidator((data?: Record<string, never>) => data ?? {})
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
    if (!roomRes.ok) return { ok: false as const, error: `tiktok_http_${roomRes.status}` };
    const roomJson = (await roomRes.json()) as { data?: { user?: { roomId?: string } } };
    const roomId = roomJson?.data?.user?.roomId;
    if (!roomId || roomId === "0") return { ok: false as const, error: "sem_sala_ativa" };

    const giftRes = await fetch(
      `https://webcast.tiktok.com/webcast/gift/list/?aid=1988&app_language=pt-BR&room_id=${encodeURIComponent(roomId)}`,
      { headers },
    );
    if (!giftRes.ok) return { ok: false as const, error: `tiktok_http_${giftRes.status}` };
    const giftJson = (await giftRes.json()) as {
      data?: {
        gifts?: Array<{ id?: number | string; name?: string }>;
        panel_refresh_data?: {
          gallery_data?: Array<{
            gift_id?: number;
            sponsor_id?: number | string;
            left_count_to_sponsor?: number;
          }>;
        };
      };
    };

    const nameByGiftId = new Map(
      (giftJson?.data?.gifts ?? [])
        .filter((g) => g.id != null)
        .map((g) => [String(g.id), String(g.name ?? "")] as const),
    );
    const gallery = giftJson?.data?.panel_refresh_data?.gallery_data ?? [];
    if (gallery.length === 0) return { ok: false as const, error: "ferramentas_indisponiveis" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: knownNames } = await supabaseAdmin.from("tiktok_user_names").select("uid, name");
    const nameByUid = new Map((knownNames ?? []).map((n) => [n.uid, n.name] as const));

    type Row = {
      tool: LiveTool;
      holder_name: string;
      holder_uid: string;
      note: string | null;
      room_id: string;
      source: string;
      position: number;
    };
    const rows: Row[] = [];
    for (const entry of gallery) {
      const giftName = (nameByGiftId.get(String(entry.gift_id)) ?? "").toLowerCase();
      const tool = LIVE_TOOLS.find((t) =>
        TOOL_KEYWORDS[t].some((k) => giftName.includes(k)),
      );
      if (!tool) continue;
      const uid = String(entry.sponsor_id ?? "0");
      if (uid === "0" || uid === "") continue;
      rows.push({
        tool,
        holder_uid: uid,
        holder_name: nameByUid.get(uid) ?? `Fã #${uid.slice(-4)}`,
        note: nameByGiftId.get(String(entry.gift_id)) ?? null,
        room_id: roomId,
        source: "tiktok",
        position: rows.length + 1,
      });
    }

    // Cada nova live recomeça a lista automática.
    await supabaseAdmin
      .from("live_tools")
      .delete()
      .eq("source", "tiktok")
      .neq("room_id", roomId);

    if (rows.length > 0) {
      await supabaseAdmin
        .from("live_tools")
        .upsert(rows, { onConflict: "room_id,tool,holder_uid", ignoreDuplicates: false });
    }

    return { ok: true as const, roomId, imported: rows.length };
  });


export const updateLiveTools = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      pin: string;
      add?: { tool: LiveTool; holder_name: string; note?: string };
      remove?: { id: string };
    }) => {
      if (!data || typeof data.pin !== "string" || data.pin.length < 3) {
        throw new Error("PIN inválido");
      }
      if (data.add) {
        if (!LIVE_TOOLS.includes(data.add.tool)) throw new Error("Ferramenta inválida");
        const name = data.add.holder_name?.trim() ?? "";
        if (!name || name.length > 60) throw new Error("Nome inválido");
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

    if (data.add) {
      const { count } = await supabaseAdmin
        .from("live_tools")
        .select("id", { count: "exact", head: true })
        .eq("tool", data.add.tool);
      await supabaseAdmin.from("live_tools").insert({
        tool: data.add.tool,
        holder_name: data.add.holder_name.trim().slice(0, 60),
        note: data.add.note?.trim().slice(0, 120) || null,
        position: (count ?? 0) + 1,
      });
    }
    if (data.remove) {
      await supabaseAdmin.from("live_tools").delete().eq("id", data.remove.id);
    }
    return { ok: true as const };
  });
