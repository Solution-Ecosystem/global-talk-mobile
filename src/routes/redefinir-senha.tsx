import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — APP TDC" },
      {
        name: "description",
        content: "Crie uma nova senha para a sua conta do APP TDC e volte a acessar o chat.",
      },
      { property: "og:title", content: "Redefinir senha — APP TDC" },
      {
        property: "og:description",
        content: "Defina uma nova senha para sua conta do APP TDC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/chat", replace: true }), 1200);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-12 flex flex-col gap-5">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/auth"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">Nova senha</h1>
        </header>

        {done ? (
          <p className="rounded-2xl bg-card px-4 py-4 text-sm">
            Senha alterada! Redirecionando para o chat...
          </p>
        ) : !ready ? (
          <p className="rounded-2xl bg-card px-4 py-4 text-[11px] text-muted-foreground">
            Abra esta página pelo link enviado no seu e-mail para redefinir a senha.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">Nova senha</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••"
                className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
              />
            </label>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading || password.length < 6}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar nova senha
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
