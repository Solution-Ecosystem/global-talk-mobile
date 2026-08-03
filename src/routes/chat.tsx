import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, UserCheck } from "lucide-react";
import {
  getChatMessages,
  getChatProfile,
  linkTikTokAccount,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/chat.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat da Comunidade — APP TDC" },
      {
        name: "description",
        content:
          "Converse com outros fãs do streamer no chat do APP TDC. Vincule sua conta do TikTok para participar.",
      },
      { property: "og:title", content: "Chat da Comunidade — APP TDC" },
      {
        property: "og:description",
        content: "Chat coletivo para quem vinculou a conta do TikTok no APP TDC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

export function getDeviceId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("tdc:device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tdc:device-id", id);
  }
  return id;
}

function ChatPage() {
  const qc = useQueryClient();
  const [deviceId, setDeviceId] = useState("");
  const [text, setText] = useState("");
  const [loginError, setLoginError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setDeviceId(getDeviceId()), []);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("login");
    if (!status || status === "ok") return;
    setLoginError(
      status === "nao_configurado"
        ? "O login com TikTok ainda não está configurado."
        : status === "cancelado"
          ? "Login cancelado."
          : "Não foi possível concluir o login com o TikTok.",
    );
  }, []);

  const profileQuery = useQuery({
    queryKey: ["chat-profile", deviceId],
    queryFn: () => getChatProfile({ data: { deviceId } }),
    enabled: !!deviceId,
  });
  const profile = profileQuery.data?.profile ?? null;

  const messagesQuery = useQuery({
    queryKey: ["chat-messages"],
    queryFn: () => getChatMessages(),
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });
  const messages = useMemo(() => messagesQuery.data?.messages ?? [], [messagesQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const login = useMutation({
    mutationFn: () => startTikTokLogin({ data: { deviceId } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setLoginError("O login com TikTok ainda não está configurado.");
        return;
      }
      window.location.href = res.url;
    },
    onError: () => setLoginError("Não foi possível iniciar o login."),
  });


  const send = useMutation({
    mutationFn: () => sendChatMessage({ data: { deviceId, body: text } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-32 flex flex-col gap-4">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">Chat da Comunidade</h1>
        </header>

        {!profile && (
          <div className="rounded-2xl bg-card px-4 py-4 flex flex-col gap-2">
            <p className="text-sm font-semibold">Entre com sua conta do TikTok</p>
            <p className="text-[11px] text-muted-foreground">
              O login é feito no próprio TikTok. Só quem entra consegue enviar mensagens no chat.
            </p>
            {loginError && <p className="text-[11px] text-destructive">{loginError}</p>}
            <button
              onClick={() => login.mutate()}
              disabled={login.isPending || !deviceId}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {login.isPending ? "Abrindo TikTok..." : "Entrar com TikTok"}
            </button>
          </div>
        )}


        {profile && (
          <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.tiktok_username}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
                <UserCheck className="h-4 w-4 text-primary" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {profile.display_name ?? profile.tiktok_username}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                @{profile.tiktok_username} · conta vinculada
              </p>
            </div>
          </div>
        )}

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
                  alt={m.display_name ?? m.tiktok_username}
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="h-8 w-8 shrink-0 rounded-full bg-card" />
              )}
              <div className="min-w-0 flex-1 rounded-2xl bg-card px-3 py-2">
                <p className="truncate text-[11px] font-semibold text-primary">
                  {m.display_name ?? m.tiktok_username}
                  <span className="ml-1 font-normal text-muted-foreground">
                    @{m.tiktok_username}
                  </span>
                </p>
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      {profile && (
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
