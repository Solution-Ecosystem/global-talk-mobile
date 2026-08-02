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
};

export const getLiveTools = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("live_tools")
    .select("id, tool, holder_name, note, position, updated_at")
    .order("tool", { ascending: true })
    .order("position", { ascending: true });
  return { entries: (data ?? []) as LiveToolEntry[] };
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
