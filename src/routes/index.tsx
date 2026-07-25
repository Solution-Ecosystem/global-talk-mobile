import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Bell,
  ChevronRight,
  MessageCircle,
  Image as ImageIcon,
  Coins,
  ShoppingCart,
  Share2,
  Home,
  Music2,
  Instagram,
  Youtube,
  Radio,
} from "lucide-react";
import avatarImg from "@/assets/avatar.jpg";
import { getTikTokLiveStatus } from "@/lib/tiktok.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

const STREAMER = {
  username: "caiquevieira_",
  name: "Caiquevieira_",
  tiktok: "https://www.tiktok.com/@caiquevieira_",
  liveUrl: "https://www.tiktok.com/@caiquevieira_/live",
  instagram: "https://www.instagram.com/caiquevieira1",
  youtube: "https://youtube.com/@caiquevieira1",
  coinsUrl: "https://www.tiktok.com/coin",
  chatUrl: "https://www.tiktok.com/@caiquevieira_",
  galleryUrl: "https://www.tiktok.com/@caiquevieira_",
};

function Index() {
  const [notifications, setNotifications] = useState(true);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tiktok-live", STREAMER.username],
    queryFn: () => getTikTokLiveStatus({ data: { username: STREAMER.username } }),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const isLive = !!data?.isLive;

  useEffect(() => {
    if (!notifications || notifyPerm !== "granted" || !isLive) return;
    const key = `notified:${STREAMER.username}:${data?.roomId ?? "live"}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    try {
      new Notification(`${STREAMER.name} está ao vivo!`, {
        body: "Toque para assistir agora no TikTok.",
        icon: "/app-icon.png",
      });
    } catch {}
  }, [isLive, notifications, notifyPerm, data?.roomId]);

  const toggleNotifications = async () => {
    const next = !notifications;
    setNotifications(next);
    if (next && notifyPerm === "default" && typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifyPerm(perm);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-sm px-5 pt-6 pb-28 flex flex-col gap-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatarImg}
                alt={`Avatar do streamer ${STREAMER.name}`}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/60"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                  STREAMER.isLive ? "bg-emerald-500" : "bg-muted-foreground/60"
                }`}
                aria-hidden
              />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">{STREAMER.name}</h1>
          </div>
          <button
            aria-label="Configurações"
            className="grid h-10 w-10 place-items-center rounded-full bg-card/70 hover:bg-card transition"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        {/* Status live */}
        <a
          href={STREAMER.tiktok}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-sm hover:bg-accent transition"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
            <Radio className={`h-4 w-4 ${STREAMER.isLive ? "text-emerald-400" : "text-muted-foreground"}`} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {STREAMER.isLive ? "Ao vivo agora" : "Offline agora"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {STREAMER.isLive ? "Toque para assistir" : "Aguarde a próxima live"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </a>

        {/* Notificações toggle */}
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
            <Bell className="h-4 w-4 text-primary" />
          </span>
          <p className="flex-1 text-sm font-semibold">Notificações</p>
          <button
            onClick={() => setNotifications((v) => !v)}
            className="flex items-center gap-2"
            aria-pressed={notifications}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                notifications ? "bg-emerald-400" : "bg-muted-foreground/50"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {notifications ? "Ativadas" : "Desativadas"}
            </span>
          </button>
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-2 gap-3">
          <GridCard
            href={STREAMER.chatUrl}
            icon={<MessageCircle className="h-6 w-6" />}
            title="Chat"
            subtitle="Grupo exclusivo"
          />
          <GridCard
            href={STREAMER.galleryUrl}
            icon={<ImageIcon className="h-6 w-6" />}
            title="Galeria"
            subtitle="Galeria TikTok"
          />
          <GridCard
            href={STREAMER.coinsUrl}
            icon={<Coins className="h-6 w-6" />}
            title="Moedas"
            subtitle="Presentes da liga"
          />
          <GridCard
            href={STREAMER.coinsUrl}
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Moedas"
            subtitle="Comprar com desconto"
          />
        </div>

        {/* Redes sociais */}
        <div className="rounded-2xl bg-card px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
              <Share2 className="h-4 w-4 text-primary" />
            </span>
            <p className="flex-1 text-sm font-semibold">Redes Sociais</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <a href={STREAMER.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="hover:text-foreground">
                <Music2 className="h-4 w-4" />
              </a>
              <a href={STREAMER.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-foreground">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={STREAMER.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-foreground">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav fixa */}
      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 px-6 py-3">
          <button className="grid place-items-center text-foreground" aria-label="Início">
            <Home className="h-5 w-5" />
          </button>
          <button className="grid place-items-center text-muted-foreground" aria-label="Placeholder">
            <span className="h-4 w-4 rounded-sm bg-muted-foreground/60" />
          </button>
          <button className="grid place-items-center text-muted-foreground" aria-label="Placeholder">
            <span className="h-4 w-4 rounded-sm bg-muted-foreground/60" />
          </button>
          <button className="grid place-items-center text-muted-foreground" aria-label="Placeholder">
            <span className="h-4 w-4 rounded-sm bg-muted-foreground/60" />
          </button>
        </div>
      </nav>
    </div>
  );
}

function GridCard({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card px-4 py-6 hover:bg-accent transition"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-background/60 text-foreground">
        {icon}
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{subtitle}</p>
    </a>
  );
}
