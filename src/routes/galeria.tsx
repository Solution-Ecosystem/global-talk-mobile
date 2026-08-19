import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift, RefreshCw, Sparkles } from "lucide-react";
import { getGifts, syncGiftsFromTikTok, type GiftItem } from "@/lib/gifts.functions";

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
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const autoSync = useQuery({
    queryKey: ["gift-sync"],
    queryFn: () => syncGiftsFromTikTok({ data: {} }),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });

  useEffect(() => {
    if (autoSync.data?.ok) {
      qc.invalidateQueries({ queryKey: ["gifts"] });
    }
  }, [autoSync.data, qc]);

  const current = data?.currentGallery ?? "D";
  const league = data?.league ?? null;
  const items = useMemo(
    () => (data?.items ?? []).filter((i) => i.gallery === current),
    [data, current],
  );
  const lit = items.filter((i) => i.lit).length;


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
              Galeria atual: {league ?? current}
            </p>
            <p className="text-xs text-muted-foreground">
              Iluminados: {lit}/{items.length}
              {autoSync.isFetching && " · atualizando..."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Atualizar galeria"
            onClick={() => {
              autoSync.refetch();
              qc.invalidateQueries({ queryKey: ["gifts"] });
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/60 hover:bg-background transition"
          >
            <RefreshCw
              className={`h-4 w-4 text-muted-foreground ${autoSync.isFetching ? "animate-spin" : ""}`}
            />
          </button>
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

        {autoSync.data && !autoSync.data.ok && (
          <p className="text-[11px] text-muted-foreground">
            {autoSync.data.error === "sem_sala_ativa"
              ? "O streamer não está ao vivo agora — mostrando a última galeria sincronizada."
              : "Não foi possível falar com o TikTok agora — mostrando a última galeria sincronizada."}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground">
          A galeria mostrada é sempre a galeria atual do streamer no TikTok e se atualiza sozinha a
          cada 20 segundos enquanto a live estiver no ar.
        </p>
      </main>
    </div>
  );
}

function GiftCard({ item }: { item: GiftItem }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl ${
        item.lit ? "bg-card ring-1 ring-primary/40" : "bg-card/50"
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
      {item.lit ? (
        <div className="mt-auto flex min-h-9 items-center justify-center bg-primary/10 px-2 py-1.5">
          <p className="w-full truncate text-center text-[10px] font-semibold text-primary">
            {item.sponsor_name ?? "Iluminado"}
          </p>
        </div>
      ) : (
        <div className="mt-auto flex min-h-9 items-center justify-center bg-background/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-xs font-bold text-foreground">{item.remaining}</span> para iluminar
          </p>
        </div>
      )}
    </div>
  );
}


