import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MailCheck, Music2 } from "lucide-react";
import { getMyProfile, updateMyName, linkTikTok, unlinkTikTok } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — APP TDC" },
      {
        name: "description",
        content:
          "Edite seu nome, atualize seu e-mail e troque sua senha no APP TDC sem precisar criar outra conta.",
      },
      { property: "og:title", content: "Minha conta — APP TDC" },
      {
        property: "og:description",
        content: "Gerencie nome, e-mail e senha da sua conta do APP TDC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const qc = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["app-profile"], queryFn: () => getMyProfile() });
  const profile = profileQuery.data?.profile ?? null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? "");
      setEmail(data.user?.email ?? "");
      setEmailConfirmed(Boolean(data.user?.email_confirmed_at));
    });
  }, []);


  function reset() {
    setMsg("");
    setErr("");
  }

  const saveName = useMutation({
    mutationFn: () => updateMyName({ data: { name: name.trim() } }),
    onMutate: reset,
    onSuccess: (res) => {
      if (!res.ok) return setErr("Não foi possível salvar o nome.");
      setMsg("Nome atualizado.");
      qc.invalidateQueries({ queryKey: ["app-profile"] });
    },
    onError: () => setErr("Nome inválido (2 a 40 caracteres)."),
  });

  const saveEmail = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser(
        { email: email.trim() },
        { emailRedirectTo: `${window.location.origin}/conta` },
      );
      if (error) throw error;
    },
    onMutate: reset,
    onSuccess: () => setMsg("Enviamos um link de confirmação para o novo e-mail."),
    onError: (e) => setErr(e instanceof Error ? e.message : "Erro ao atualizar o e-mail."),
  });

  const savePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onMutate: reset,
    onSuccess: () => {
      setPassword("");
      setMsg("Senha atualizada.");
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Erro ao atualizar a senha."),
  });

  const busy = saveName.isPending || saveEmail.isPending || savePassword.isPending;

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-12 flex flex-col gap-4">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/chat"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">Minha conta</h1>
        </header>

        {msg && <p className="text-[11px] text-emerald-400">{msg}</p>}
        {err && <p className="text-[11px] text-destructive">{err}</p>}

        <section className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-4">
          <p className="text-sm font-semibold">Nome exibido no chat</p>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => saveName.mutate()}
            disabled={busy || name.trim().length < 2}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saveName.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nome
          </button>
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-4">
          <p className="text-sm font-semibold">E-mail de login</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
          />
          <p className="text-[11px] text-muted-foreground">
            Você precisa confirmar o novo e-mail pelo link que enviaremos.
          </p>
          <button
            onClick={() => saveEmail.mutate()}
            disabled={busy || !email.trim() || email.trim() === currentEmail}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saveEmail.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Atualizar e-mail
          </button>
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-4">
          <p className="text-sm font-semibold">Nova senha</p>
          <input
            type="password"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••"
            className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => savePassword.mutate()}
            disabled={busy || password.length < 6}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {savePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Trocar senha
          </button>
        </section>

        {profile?.tiktok_username && (
          <p className="text-center text-[11px] text-muted-foreground">
            TikTok vinculado: @{profile.tiktok_username}
          </p>
        )}
      </main>
    </div>
  );
}
