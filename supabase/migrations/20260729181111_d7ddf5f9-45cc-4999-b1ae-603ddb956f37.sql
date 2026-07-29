ALTER TABLE public.gift_items
  ADD COLUMN IF NOT EXISTS tiktok_gift_id text,
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_url text;

CREATE UNIQUE INDEX IF NOT EXISTS gift_items_tiktok_unique
  ON public.gift_items (gallery, tiktok_gift_id)
  WHERE tiktok_gift_id IS NOT NULL;