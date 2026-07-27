import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/push/subscribe")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async () => {
        return Response.json(
          { vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null },
          { headers: CORS_HEADERS },
        );
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            endpoint?: string;
            keys?: { p256dh?: string; auth?: string };
          };
          if (
            !body?.endpoint ||
            !body.keys?.p256dh ||
            !body.keys?.auth ||
            body.endpoint.length > 2048
          ) {
            return Response.json(
              { error: "invalid subscription" },
              { status: 400, headers: CORS_HEADERS },
            );
          }
          const ua = request.headers.get("user-agent")?.slice(0, 300) ?? null;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("push_subscriptions")
            .upsert(
              {
                endpoint: body.endpoint,
                p256dh: body.keys.p256dh,
                auth: body.keys.auth,
                user_agent: ua,
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "endpoint" },
            );
          if (error) {
            console.error("subscribe error", error);
            return Response.json(
              { error: "db_error" },
              { status: 500, headers: CORS_HEADERS },
            );
          }
          return Response.json({ ok: true }, { headers: CORS_HEADERS });
        } catch (err) {
          console.error("subscribe exception", err);
          return Response.json(
            { error: "bad_request" },
            { status: 400, headers: CORS_HEADERS },
          );
        }
      },
    },
  },
});
