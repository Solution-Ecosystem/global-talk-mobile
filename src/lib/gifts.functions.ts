import { createServerFn } from "@tanstack/react-start";

export type GiftItem = {
  id: string;
  gallery: "D" | "C" | "B" | "A";
  name: string;
  lit: boolean;
  position: number;
};

export const getGifts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: items }, { data: state }] = await Promise.all([
    supabaseAdmin
      .from("gift_items")
      .select("id, gallery, name, lit, position")
      .order("gallery", { ascending: true })
      .order("position", { ascending: true }),
    supabaseAdmin.from("gift_state").select("current_gallery").eq("id", 1).single(),
  ]);
  return {
    items: (items ?? []) as GiftItem[],
    currentGallery: (state?.current_gallery ?? "D") as GiftItem["gallery"],
  };
});

export const updateGifts = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      pin: string;
      currentGallery?: "D" | "C" | "B" | "A";
      toggle?: { id: string; lit: boolean };
      add?: { gallery: "D" | "C" | "B" | "A"; name: string };
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
