import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — APP TDC" },
      {
        name: "description",
        content:
          "Esqueceu a senha do APP TDC? Informe seu e-mail e receba um link para redefinir sua senha.",
      },
      { property: "og:title", content: "Recuperar senha — APP TDC" },
      {
        property: "og:description",
        content: "Receba por e-mail um link para redefinir a senha da sua conta do APP TDC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (err) setError("Não foi possível enviar o e-mail agora. Tente de novo.");
    else setSent(true);
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
          <h1 className="truncate text-lg font-semibold tracking-tight">Recuperar senha</h1>
        </header>

        {sent ? (
          <div className="rounded-2xl bg-card px-4 py-4">
            <p className="text-sm font-semibold">Verifique seu e-mail</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Enviamos um link para <strong>{email}</strong>. Abra o link para criar uma nova senha.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">E-mail da conta</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@email.com"
                className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
              />
            </label>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar link de recuperação
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
