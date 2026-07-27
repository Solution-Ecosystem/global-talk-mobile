CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Sem policies para anon/authenticated: escritas passam pelo server route com service_role.

CREATE TABLE public.live_state (
  id int PRIMARY KEY DEFAULT 1,
  is_live boolean NOT NULL DEFAULT false,
  room_id text,
  title text,
  last_notified_room_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_state_singleton CHECK (id = 1)
);
GRANT ALL ON public.live_state TO service_role;
ALTER TABLE public.live_state ENABLE ROW LEVEL SECURITY;

INSERT INTO public.live_state (id, is_live) VALUES (1, false);