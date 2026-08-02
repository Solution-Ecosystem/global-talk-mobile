import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Hammer, Lock, Trash2, Wind, Zap, Hand } from "lucide-react";
import {
  getLiveTools,
  updateLiveTools,
  LIVE_TOOLS,
  type LiveTool,
  type LiveToolEntry,
} from "@/lib/tools.functions";

export const Route = createFileRoute("/ferramentas")({
  head: () => ({
    meta: [
      { title: "Ferramentas da Live — APP TDC" },
      {
        name: "description",
        content:
          "Veja quem está com as ferramentas da live do streamer: luva, martelo, névoa e impulso.",
      },
      { property: "og:title", content: "Ferramentas da Live — APP TDC" },
      {
        property: "og:description",
        content: "Quem está com luva, martelo, névoa e impulso na live do streamer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FerramentasPage,
});

const TOOL_META: Record<LiveTool, { label: string; icon: React.ReactNode }> = {
  luva: { label: "Luva", icon: <Hand className="h-4 w-4" /> },
  martelo: { label: "Martelo", icon: <Hammer className="h-4 w-4" /> },
  nevoa: { label: "Névoa", icon: <Wind className="h-4 w-4" /> },
  impulso: { label: "Impulso", icon: <Zap className="h-4 w-4" /> },
};

function FerramentasPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["live-tools"],
    queryFn: () => getLiveTools(),
    refetchInterval: 30_000,
  });
  const entries = data?.entries ?? [];

  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [tool, setTool] = useState<LiveTool>("luva");
  const [holder, setHolder] = useState("");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateLiveTools>[0]["data"]) =>
      updateLiveTools({ data: vars }),
    onSuccess: (res) => {
      if (!res.ok) {
        setPinError("PIN incorreto");
        return;
      }
      setPinError("");
      setHolder("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["live-tools"] });
    },
  });

  const isAdmin = adminOpen && pin.length >= 3 && !pinError;

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-24 flex flex-col gap-4">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">Ferramentas da Live</h1>
        </header>

        {isLoading && <p className="text-xs text-muted-foreground">Carregando ferramentas...</p>}

        {LIVE_TOOLS.map((t) => {
          const list = entries.filter((e: LiveToolEntry) => e.tool === t);
          return (
            <section key={t} className="rounded-2xl bg-card px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/60 text-primary">
                  {TOOL_META[t].icon}
                </span>
                <p className="flex-1 text-sm font-semibold">{TOOL_META[t].label}</p>
                <span className="text-[11px] text-muted-foreground">{list.length}</span>
              </div>
              {list.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Ninguém cadastrado ainda.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {list.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 rounded-xl bg-background/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{e.holder_name}</p>
                        {e.note && (
                          <p className="truncate text-[10px] text-muted-foreground">{e.note}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          aria-label={`Remover ${e.holder_name}`}
                          onClick={() => mutation.mutate({ pin, remove: { id: e.id } })}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <div className="rounded-2xl bg-card px-4 py-3.5 flex flex-col gap-3">
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="flex items-center gap-3 text-left"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/60">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </span>
            <p className="flex-1 text-sm font-semibold">Área do administrador</p>
          </button>

          {adminOpen && (
            <div className="flex flex-col gap-2">
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError("");
                }}
                placeholder="PIN de administrador"
                className="rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
              />
              {pinError && <p className="text-[11px] text-destructive">{pinError}</p>}
              <div className="flex gap-2">
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value as LiveTool)}
                  className="rounded-xl bg-background/60 px-2 py-2 text-xs outline-none"
                >
                  {LIVE_TOOLS.map((t) => (
                    <option key={t} value={t}>
                      {TOOL_META[t].label}
                    </option>
                  ))}
                </select>
                <input
                  value={holder}
                  maxLength={60}
                  onChange={(e) => setHolder(e.target.value)}
                  placeholder="Quem está com a ferramenta"
                  className="min-w-0 flex-1 rounded-xl bg-background/60 px-3 py-2 text-xs outline-none"
                />
              </div>
              <input
                value={note}
                maxLength={120}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Observação (opcional)"
                className="rounded-xl bg-background/60 px-3 py-2 text-xs outline-none"
              />
              <button
                onClick={() =>
                  holder.trim() && mutation.mutate({ pin, add: { tool, holder_name: holder, note } })
                }
                disabled={mutation.isPending || !holder.trim()}
                className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Adicionar à lista
              </button>
              <p className="text-[11px] text-muted-foreground">
                O TikTok não expõe publicamente quem está com as ferramentas da live, então essa
                lista é mantida pelos administradores.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
