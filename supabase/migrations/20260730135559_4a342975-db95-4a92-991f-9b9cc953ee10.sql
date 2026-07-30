ALTER TABLE public.gift_items
  ADD COLUMN IF NOT EXISTS sponsor_id text,
  ADD COLUMN IF NOT EXISTS sponsor_name text;