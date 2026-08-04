import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — APP TDC" },
      {
        name: "description",
        content:
          "Crie sua conta no APP TDC com nome, e-mail e senha, vincule seu @ do TikTok e participe do chat da comunidade.",
      },
      { property: "og:title", content: "Entrar ou criar conta — APP TDC" },
      {
        property: "og:description",
        content: "Login e cadastro do APP TDC para acessar o chat da comunidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/chat", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("Informe seu nome.");
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      }
      navigate({ to: "/chat", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      setError(
        /invalid login/i.test(msg)
          ? "E-mail ou senha incorretos."
          : /already registered|already been/i.test(msg)
            ? "Esse e-mail já tem conta. Faça login."
            : /password/i.test(msg)
              ? "Senha muito fraca ou curta (mínimo 6 caracteres)."
              : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-12 flex flex-col gap-5">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
        </header>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">Nome</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoComplete="name"
                placeholder="Seu nome"
                className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
              />
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">E-mail</span>
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
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••"
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
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Depois de entrar, vincule seu @ do TikTok para poder falar no chat.
          </p>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          Ao continuar você aceita os{" "}
          <Link to="/termos-de-servico" className="text-primary">
            Termos
          </Link>{" "}
          e a{" "}
          <Link to="/politica-de-privacidade" className="text-primary">
            Política de Privacidade
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
