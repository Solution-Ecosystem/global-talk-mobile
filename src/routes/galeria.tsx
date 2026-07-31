import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift, Sparkles, Lock, Trash2, RefreshCw } from "lucide-react";
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
          "Veja a galeria de presentes atual do streamer no TikTok, quais presentes já foram iluminados, quem iluminou e quais ainda faltam.",
      },
      { property: "og:title", content: "Galeria de Presentes — APP TDC" },
      {
        property: "og:description",
        content: "Acompanhe os presentes iluminados da galeria atual do streamer no TikTok.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GaleriaPage,
});

function GaleriaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["gifts"],
    queryFn: () => getGifts(),
    refetchInterval: 60_000,
  });

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

  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const current = data?.currentGallery ?? "D";
  const league = data?.league ?? null;
  const items = useMemo(
    () => (data?.items ?? []).filter((i) => i.gallery === current),
    [data, current],
  );
  const lit = items.filter((i) => i.lit).length;

  const mutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateGifts>[0]["data"]) => updateGifts({ data: vars }),
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
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight">Galeria de Presentes</h1>
        </header>

        <div className="rounded-2xl bg-card px-4 py-3.5 flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/60">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Galeria atual: {current}
              {league && <span className="ml-1 text-xs text-muted-foreground">(liga {league})</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              Iluminados: {lit}/{items.length}
              {autoSync.isFetching && " · atualizando..."}
            </p>
          </div>
        </div>

        {isLoading && <p className="text-xs text-muted-foreground">Carregando presentes...</p>}

        <div className="grid grid-cols-3 gap-2.5">
          {items.map((item: GiftItem) => (
            <GiftCard key={item.id} item={item} />
          ))}
        </div>

        {!isLoading && items.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum presente na galeria atual. A galeria é lida da live quando o streamer está ao vivo.
          </p>
        )}

        {isAdmin && (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
                <p className="min-w-0 flex-1 truncate text-xs">{item.name}</p>
                <button
                  onClick={() => mutation.mutate({ pin, toggle: { id: item.id, lit: !item.lit } })}
                  className="rounded-lg bg-background/60 px-2 py-1 text-[11px]"
                >
                  {item.lit ? "Apagar" : "Iluminar"}
                </button>
                <button
                  aria-label={`Remover ${item.name}`}
                  onClick={() => mutation.mutate({ pin, remove: { id: item.id } })}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background/60 text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Área do administrador */}
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
              <button
                onClick={() => {
                  setSyncMsg("");
                  sync.mutate();
                }}
                disabled={sync.isPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
                {sync.isPending ? "Sincronizando..." : "Atualizar galeria agora"}
              </button>
              {syncMsg && <p className="text-[11px] text-muted-foreground">{syncMsg}</p>}
              <p className="text-[11px] text-muted-foreground">
                A galeria mostrada é sempre a galeria atual do streamer no TikTok e se atualiza
                sozinha a cada 1 minuto enquanto a live estiver no ar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GiftCard({ item }: { item: GiftItem }) {
  const sponsor =
    item.sponsor_name?.trim() ||
    (item.sponsor_id ? `Fã #${item.sponsor_id.slice(-4)}` : "Iluminado");
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl ${
        item.lit ? "bg-card ring-1 ring-primary/30" : "bg-card/50"
      }`}
    >
      <div className="flex flex-col items-center gap-1.5 px-2 pt-3 pb-2">
        <span className="grid h-14 w-14 place-items-center">
          {item.icon_url ? (
            <img
              src={item.icon_url}
              alt={item.name}
              loading="lazy"
              className={`h-14 w-14 object-contain ${item.lit ? "" : "opacity-30 grayscale"}`}
            />
          ) : (
            <Gift
              className={`h-8 w-8 ${item.lit ? "text-primary" : "text-muted-foreground opacity-40"}`}
            />
          )}
        </span>
        <p
          className={`w-full truncate text-center text-[11px] font-semibold ${
            item.lit ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {item.name}
        </p>
      </div>
      <div className="mt-auto flex min-h-9 items-center justify-center gap-1 bg-background/50 px-2 py-1.5">
        {item.lit ? (
          <p className="truncate text-[10px] text-muted-foreground">{sponsor ?? "Iluminado"}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            <span className="text-xs font-bold text-foreground">{item.remaining}</span> para iluminar
          </p>
        )}
      </div>
    </div>
  );
}
