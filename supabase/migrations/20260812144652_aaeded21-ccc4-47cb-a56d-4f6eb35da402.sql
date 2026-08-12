ALTER TABLE public.live_tools
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS room_id text,
  ADD COLUMN IF NOT EXISTS holder_uid text;
CREATE UNIQUE INDEX IF NOT EXISTS live_tools_auto_unique
  ON public.live_tools (room_id, tool, holder_uid)
  WHERE source = 'tiktok';