import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift, Sparkles, Lock, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  getGifts,
  updateGifts,
  syncGiftsFromTikTok,
  type GiftItem,
} from "@/lib/gifts.functions";


export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria de Presentes — APP TDC" },
      {
        name: "description",
        content:
          "Veja em qual galeria de presentes (D, C, B, A) o streamer está e quais presentes já foram iluminados e quais ainda faltam.",
      },
      { property: "og:title", content: "Galeria de Presentes — APP TDC" },
      {
        property: "og:description",
        content: "Acompanhe os presentes iluminados das galerias D, C, B e A do streamer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GaleriaPage,
});

const GALLERIES = ["D", "C", "B", "A"] as const;

function GaleriaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["gifts"],
    queryFn: () => getGifts(),
    refetchInterval: 60_000,
  });

  // Sincroniza automaticamente com a galeria real da live do TikTok
  const autoSync = useQuery({
    queryKey: ["gift-sync"],
    queryFn: () => syncGiftsFromTikTok({ data: {} }),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (autoSync.data?.ok) {
      qc.invalidateQueries({ queryKey: ["gifts"] });
    }
  }, [autoSync.data, qc]);

  const [tab, setTab] = useState<(typeof GALLERIES)[number] | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [newGift, setNewGift] = useState("");

  const current = data?.currentGallery ?? "D";
  const league = data?.league ?? null;
  const active = tab ?? current;
  const items = useMemo(
    () => (data?.items ?? []).filter((i) => i.gallery === active),
    [data, active],
  );
  const lit = items.filter((i) => i.lit).length;

  const mutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateGifts>[0]["data"]) =>
      updateGifts({ data: vars }),
    onSuccess: (res) => {
      if (!res.ok) {
        setPinError("PIN incorreto");
        return;
      }
      setPinError("");
      qc.invalidateQueries({ queryKey: ["gifts"] });
    },
  });

  const [syncMsg, setSyncMsg] = useState("");
  const sync = useMutation({
    mutationFn: () => syncGiftsFromTikTok({ data: {} }),
    onSuccess: (res) => {
      if (!res.ok) {
        setSyncMsg(
          res.error === "sem_sala_ativa"
            ? "O streamer não está ao vivo agora, então a galeria não pode ser lida."
            : res.error === "galeria_indisponivel"
              ? "A live não expôs a galeria neste momento."
              : `Falha ao sincronizar: ${res.error}`,
        );
        return;
      }
      setSyncMsg(
        `Galeria ${res.gallery}${res.league ? ` (liga ${res.league})` : ""}: ${res.lit}/${res.imported} iluminados.`,
      );
      qc.invalidateQueries({ queryKey: ["gifts"] });
    },
    onError: () => setSyncMsg("Falha ao sincronizar com o TikTok."),
  });

  const isAdmin = adminOpen && pin.length >= 3 && !pinError;




  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-24 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Galeria de Presentes</h1>
        </header>

        <div className="rounded-2xl bg-card px-4 py-3.5 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Galeria atual: {current}</p>
            <p className="text-xs text-muted-foreground">
              Presentes iluminados nesta galeria: {lit}/{items.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {GALLERIES.map((g) => (
            <button
              key={g}
              onClick={() => setTab(g)}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                active === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {g}
              {current === g && <span className="ml-1 text-[10px]">•</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {isLoading && <p className="text-xs text-muted-foreground">Carregando presentes...</p>}
          {items.map((item: GiftItem) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                item.lit ? "bg-primary/15 ring-1 ring-primary/40" : "bg-card"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ${
                  item.lit ? "bg-primary/25 text-primary" : "bg-background/60 text-muted-foreground"
                }`}
              >
                {item.icon_url ? (
                  <img
                    src={item.icon_url}
                    alt={item.name}
                    loading="lazy"
                    className={`h-7 w-7 object-contain ${item.lit ? "" : "opacity-50 grayscale"}`}
                  />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.lit ? "Iluminado" : "Falta iluminar"}
                  {item.coins > 0 && ` · ${item.coins.toLocaleString("pt-BR")} moedas`}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      mutation.mutate({ pin, toggle: { id: item.id, lit: !item.lit } })
                    }
                    className="rounded-lg bg-background/60 px-2 py-1 text-[11px]"
                  >
                    {item.lit ? "Apagar" : "Iluminar"}
                  </button>
                  <button
                    aria-label={`Remover ${item.name}`}
                    onClick={() => mutation.mutate({ pin, remove: { id: item.id } })}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-background/60 text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {!isLoading && items.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum presente cadastrado nesta galeria.</p>
          )}
        </div>

        {/* Área do administrador */}
        <div className="rounded-2xl bg-card px-4 py-3.5 flex flex-col gap-3">
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="flex items-center gap-3 text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
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
                  value={current}
                  onChange={(e) =>
                    mutation.mutate({
                      pin,
                      currentGallery: e.target.value as (typeof GALLERIES)[number],
                    })
                  }
                  className="flex-1 rounded-xl bg-background/60 px-3 py-2 text-sm"
                >
                  {GALLERIES.map((g) => (
                    <option key={g} value={g}>
                      Galeria atual: {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  value={newGift}
                  onChange={(e) => setNewGift(e.target.value)}
                  placeholder={`Novo presente na galeria ${active}`}
                  className="flex-1 rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
                />
                <button
                  aria-label="Adicionar presente"
                  onClick={() => {
                    if (!newGift.trim()) return;
                    mutation.mutate({ pin, add: { gallery: active, name: newGift } });
                    setNewGift("");
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  setSyncMsg("");
                  sync.mutate();
                }}
                disabled={sync.isPending || pin.length < 3}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
                {sync.isPending ? "Sincronizando..." : "Sincronizar presentes do TikTok"}
              </button>
              {syncMsg && <p className="text-[11px] text-muted-foreground">{syncMsg}</p>}
              <p className="text-[11px] text-muted-foreground">
                A sincronização importa a lista real de presentes da live e separa por galeria
                (D, C, B, A) pelo valor em moedas. O TikTok não divulga publicamente quais já
                foram iluminados, então essa marcação é feita aqui pelo administrador.
              </p>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
