import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Send, UserCheck, UserCog } from "lucide-react";
import { getChatMessages, sendChatMessage, type ChatMessage } from "@/lib/chat.functions";
import { getMyProfile, linkTikTok, acceptTerms } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat da Comunidade — APP TDC" },
      {
        name: "description",
        content:
          "Converse com outros fãs do streamer no chat do APP TDC. Faça login e vincule seu @ do TikTok para participar.",
      },
      { property: "og:title", content: "Chat da Comunidade — APP TDC" },
      {
        property: "og:description",
        content: "Chat coletivo para quem tem conta no APP TDC com @ do TikTok vinculado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [handle, setHandle] = useState("");
  const [linkError, setLinkError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const profileQuery = useQuery({ queryKey: ["app-profile"], queryFn: () => getMyProfile() });
  const profile = profileQuery.data?.profile ?? null;
  const linked = !!profile?.tiktok_username;
  const termsOk = !!profile?.terms_accepted_at;

  const [emailConfirmed, setEmailConfirmed] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmailConfirmed(!!data.user?.email_confirmed_at);
    });
  }, []);

  const accept = useMutation({
    mutationFn: () => acceptTerms(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-profile"] }),
  });

  const canChat = termsOk && emailConfirmed;

  const messagesQuery = useQuery({
    queryKey: ["chat-messages"],
    queryFn: () => getChatMessages(),
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    enabled: canChat,
  });
  const messages = useMemo(() => messagesQuery.data?.messages ?? [], [messagesQuery.data]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const link = useMutation({
    mutationFn: () => linkTikTok({ data: { username: handle } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setLinkError(
          res.error === "conta_nao_encontrada"
            ? "Não encontramos esse @ no TikTok."
            : res.error === "ja_vinculado"
              ? "Esse @ já está vinculado a outra conta."
              : "Não foi possível vincular agora. Tente de novo.",
        );
        return;
      }
      setLinkError("");
      setHandle("");
      qc.invalidateQueries({ queryKey: ["app-profile"] });
    },
    onError: () => setLinkError("@ inválido."),
  });

  const send = useMutation({
    mutationFn: () => sendChatMessage({ data: { body: text } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-32 flex flex-col gap-4">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">Chat da Comunidade</h1>
          <Link
            to="/conta"
            aria-label="Minha conta"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </Link>
          <button
            onClick={signOut}
            aria-label="Sair"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>

        {!emailConfirmed && (
          <div className="rounded-2xl bg-card px-4 py-4">
            <p className="text-sm font-semibold">Confirme seu e-mail</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Enviamos um link de confirmação para o seu e-mail. Confirme para liberar o chat.
            </p>
          </div>
        )}

        {emailConfirmed && profile && !termsOk && (
          <div className="rounded-2xl bg-card px-4 py-4 flex flex-col gap-2">
            <p className="text-sm font-semibold">Aceite os termos para entrar no chat</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Para usar o chat você precisa aceitar os{" "}
              <Link to="/termos-de-servico" className="text-primary">
                Termos de Serviço
              </Link>{" "}
              e a{" "}
              <Link to="/politica-de-privacidade" className="text-primary">
                Política de Privacidade
              </Link>
              .
            </p>
            <button
              onClick={() => accept.mutate()}
              disabled={accept.isPending}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {accept.isPending ? "..." : "Aceitar e continuar"}
            </button>
          </div>
        )}


        {profile && (
          <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
            {profile.tiktok_avatar_url ? (
              <img
                src={profile.tiktok_avatar_url}
                alt={profile.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
                <UserCheck className="h-4 w-4 text-primary" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {profile.name || "Sem nome"}
                {linked && (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    @{profile.tiktok_username}
                  </span>
                )}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {linked ? "TikTok vinculado" : "Vincule seu @ do TikTok para falar"}
              </p>
            </div>
          </div>
        )}

        {canChat && profile && !linked && (
          <div className="rounded-2xl bg-card px-4 py-4 flex flex-col gap-2">
            <p className="text-sm font-semibold">Vincular TikTok</p>
            <p className="text-[11px] text-muted-foreground">
              Digite o seu @ do TikTok. Ele fica ligado a esta conta e aparece ao lado do seu nome
              no chat.
            </p>
            <div className="flex items-center gap-2">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@seuusuario"
                className="min-w-0 flex-1 rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => handle.trim() && link.mutate()}
                disabled={link.isPending || !handle.trim()}
                className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {link.isPending ? "..." : "Vincular"}
              </button>
            </div>
            {linkError && <p className="text-[11px] text-destructive">{linkError}</p>}
          </div>
        )}

        {canChat && (
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhuma mensagem ainda. Seja o primeiro a falar com a comunidade.
            </p>
          )}
          {messages.map((m: ChatMessage) => (
            <div key={m.id} className="flex items-start gap-2.5">
              {m.avatar_url ? (
                <img
                  src={m.avatar_url}
                  alt={m.display_name ?? "Usuário"}
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="h-8 w-8 shrink-0 rounded-full bg-card" />
              )}
              <div className="min-w-0 flex-1 rounded-2xl bg-card px-3 py-2">
                <p className="truncate text-[11px] font-semibold text-primary">
                  {m.display_name ?? m.tiktok_username ?? "Usuário"}
                  {m.tiktok_username && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      @{m.tiktok_username}
                    </span>
                  )}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        )}
      </main>

      {canChat && linked && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-sm -translate-x-1/2 border-t border-border bg-card/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
          <div className="flex items-center gap-2">
            <input
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) send.mutate();
              }}
              placeholder="Escreva uma mensagem"
              className="min-w-0 flex-1 rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
            />
            <button
              aria-label="Enviar"
              onClick={() => text.trim() && send.mutate()}
              disabled={send.isPending || !text.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
