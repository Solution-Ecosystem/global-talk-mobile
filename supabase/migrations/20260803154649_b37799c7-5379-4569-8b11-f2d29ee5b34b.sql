DROP POLICY IF EXISTS "chat_profiles public read" ON public.chat_profiles;
DROP POLICY IF EXISTS "chat_messages public read" ON public.chat_messages;

CREATE POLICY "chat_profiles deny client access"
ON public.chat_profiles AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "chat_messages deny client access"
ON public.chat_messages AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

REVOKE ALL ON public.chat_profiles FROM anon, authenticated;
REVOKE ALL ON public.chat_messages FROM anon, authenticated;
GRANT ALL ON public.chat_profiles TO service_role;
GRANT ALL ON public.chat_messages TO service_role;