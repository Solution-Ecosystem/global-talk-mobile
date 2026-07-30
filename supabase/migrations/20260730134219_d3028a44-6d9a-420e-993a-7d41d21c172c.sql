-- live_state: public read (non-sensitive live status), writes only by backend
GRANT SELECT ON public.live_state TO anon, authenticated;
GRANT ALL ON public.live_state TO service_role;

DROP POLICY IF EXISTS "live_state public read" ON public.live_state;
CREATE POLICY "live_state public read"
ON public.live_state
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "live_state service manage" ON public.live_state;
CREATE POLICY "live_state service manage"
ON public.live_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- push_subscriptions: private credentials, backend-only access
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

DROP POLICY IF EXISTS "push_subscriptions service manage" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions service manage"
ON public.push_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "push_subscriptions deny client access" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions deny client access"
ON public.push_subscriptions
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);