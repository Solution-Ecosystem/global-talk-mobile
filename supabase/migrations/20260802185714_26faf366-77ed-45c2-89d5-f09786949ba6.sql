CREATE TABLE public.chat_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  tiktok_username text NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_profiles TO anon, authenticated;
GRANT ALL ON public.chat_profiles TO service_role;
ALTER TABLE public.chat_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_profiles public read" ON public.chat_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat_profiles service manage" ON public.chat_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  tiktok_username text NOT NULL,
  display_name text,
  avatar_url text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_created_at_idx ON public.chat_messages (created_at DESC);
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages public read" ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat_messages service manage" ON public.chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.live_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool text NOT NULL,
  holder_name text NOT NULL,
  note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_tools TO anon, authenticated;
GRANT ALL ON public.live_tools TO service_role;
ALTER TABLE public.live_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_tools public read" ON public.live_tools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "live_tools service manage" ON public.live_tools FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.tiktok_user_names (
  uid text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tiktok_user_names TO anon, authenticated;
GRANT ALL ON public.tiktok_user_names TO service_role;
ALTER TABLE public.tiktok_user_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiktok_user_names public read" ON public.tiktok_user_names FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tiktok_user_names service manage" ON public.tiktok_user_names FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_chat_profiles_updated_at BEFORE UPDATE ON public.chat_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_live_tools_updated_at BEFORE UPDATE ON public.live_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tiktok_user_names_updated_at BEFORE UPDATE ON public.tiktok_user_names FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();