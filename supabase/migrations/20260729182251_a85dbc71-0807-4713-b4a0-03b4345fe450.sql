ALTER TABLE public.gift_items ADD COLUMN IF NOT EXISTS remaining integer NOT NULL DEFAULT 0;
ALTER TABLE public.gift_items ADD COLUMN IF NOT EXISTS is_gallery boolean NOT NULL DEFAULT false;
ALTER TABLE public.gift_state ADD COLUMN IF NOT EXISTS league text;
CREATE UNIQUE INDEX IF NOT EXISTS gift_items_gallery_tiktok_id_key ON public.gift_items (gallery, tiktok_gift_id) WHERE tiktok_gift_id IS NOT NULL;