DROP INDEX IF EXISTS public.gift_items_gallery_tiktok_id_key;
ALTER TABLE public.gift_items ADD CONSTRAINT gift_items_gallery_tiktok_id_key UNIQUE (gallery, tiktok_gift_id);