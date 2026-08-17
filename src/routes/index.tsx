import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Bell,
  ChevronRight,
  MessageCircle,
  Image as ImageIcon,
  Coins,
  Share2,
  Home,
  Music2,
  Instagram,
  Youtube,
  Radio,
  X,
  Link2 as LinkIcon,
  Wrench,
  FileText,
  Shield,
} from "lucide-react";
import avatarImg from "@/assets/avatar.jpg";
import tdcLogo from "@/assets/tdc-logo.png";
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
  coinsUrl: "https://www.tiktok.com/coin?rc=BVMMD2AG&rie=",
  chatUrl: "https://www.tiktok.com/@caiquevieira_",
  galleryUrl: "https://www.tiktok.com/@caiquevieira_",
};

function Index() {
  const [notifications, setNotifications] = useState(true);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const [showSplash, setShowSplash] = useState(true);
  const [socialOpen, setSocialOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [pushReady, setPushReady] = useState(false);
  const [showInstallGate, setShowInstallGate] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        await installPrompt.userChoice;
      } catch {}
      setInstallPrompt(null);
    }
    setShowInstallGate(false);
    try {
      localStorage.setItem("tdc:install-gate", "1");
    } catch {}
  };

  const skipInstall = () => {
    setShowInstallGate(false);
    try {
      localStorage.setItem("tdc:install-gate", "1");
    } catch {}
  };


  // Detecta permissão e ambiente apenas no cliente (evita hydration mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error propriedade só existe no Safari iOS
      window.navigator.standalone === true;
    setIsIOS(ios);
    setIsStandalone(!!standalone);

    if (!("Notification" in window)) return;
    setNotifyPerm(Notification.permission);
    // Safari/iOS exige gesto do usuário: só pedimos automaticamente fora do iOS.
    if (!ios && Notification.permission === "default") {
      Notification.requestPermission().then((p) => setNotifyPerm(p)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Registra o service worker e assina Web Push nativo (VAPID).
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (notifyPerm !== "granted") return;
    let cancelled = false;

    (async () => {
      try {
        const reg =
          (await navigator.serviceWorker.getRegistration("/sw.js")) ??
          (await navigator.serviceWorker.register("/sw.js"));
        if (cancelled) return;
        await navigator.serviceWorker.ready;

        if (!("PushManager" in window)) return;

        // Busca a VAPID public key do backend
        const res = await fetch("/api/public/push/subscribe");
        const { vapidPublicKey } = (await res.json()) as { vapidPublicKey: string | null };
        if (!vapidPublicKey) return;

        const existing = await reg.pushManager.getSubscription();
        const sub =
          existing ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
          }));

        const json = sub.toJSON();
        await fetch("/api/public/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
          }),
        });
        if (!cancelled) setPushReady(true);
      } catch (err) {
        console.warn("Push subscribe falhou", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notifyPerm]);

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
    if (typeof localStorage !== "undefined" && localStorage.getItem(key)) return;
    try {
      localStorage.setItem(key, "1");
    } catch {}
    (async () => {
      const title = "APP TDC — Caique está ao vivo!";
      const body = "Toque para assistir agora no TikTok.";
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: "/app-icon.png",
            badge: "/app-icon.png",
            tag: `tdc-live-${data?.roomId ?? "live"}`,
            data: { url: STREAMER.liveUrl },
          });
          return;
        }
      } catch {}
      try {
        new Notification(title, { body, icon: "/app-icon.png" });
      } catch {}
    })();
  }, [isLive, notifications, notifyPerm, data?.roomId]);

  const toggleNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        // Precisa acontecer dentro do gesto do usuário (obrigatório no Safari/iOS)
        try {
          const perm = await Notification.requestPermission();
          setNotifyPerm(perm);
          setNotifications(perm === "granted");
          return;
        } catch {}
      } else {
        setNotifyPerm("granted");
      }
    }
    setNotifications((v) => !v);
  };



  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fade-out">
          <img
            src={tdcLogo}
            alt="APP TDC"
            className="w-48 h-48 object-contain drop-shadow-[0_0_40px_rgba(255,140,0,0.6)] animate-pulse"
          />
        </div>
      )}
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
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"
                }`}
                aria-hidden
              />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">{STREAMER.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/chat"
              aria-label="Vincular conta do TikTok"
              className="flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-2 text-[11px] font-semibold hover:bg-card transition"
            >
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
              Vincular TikTok
            </Link>
            <button
              aria-label="Configurações"
              className="grid h-10 w-10 place-items-center rounded-full bg-card/70 hover:bg-card transition"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </header>


        {/* Status live */}
        <a
          href={isLive ? STREAMER.liveUrl : STREAMER.tiktok}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-sm hover:bg-accent transition"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
            <Radio className={`h-4 w-4 ${isLive ? "text-emerald-400" : "text-muted-foreground"}`} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isLoading ? "Verificando..." : isLive ? "Ao vivo agora" : "Offline agora"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isLive
                ? "Toque para assistir a live"
                : isLoading
                  ? "Consultando TikTok"
                  : "Aguarde a próxima live"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </a>

        {/* Notificações toggle */}
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
            <Bell className="h-4 w-4 text-primary" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Notificações</p>
            {notifyPerm === "denied" && (
              <p className="text-[11px] text-muted-foreground">
                Permissão bloqueada nas configurações do navegador
              </p>
            )}
            {notifyPerm === "granted" && pushReady && (
              <p className="text-[11px] text-muted-foreground">Push ativo neste dispositivo</p>
            )}
          </div>
          <button
            onClick={toggleNotifications}
            className="flex items-center gap-2"
            aria-pressed={notifications && notifyPerm === "granted"}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                notifications && notifyPerm === "granted" ? "bg-emerald-400" : "bg-muted-foreground/50"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {notifications && notifyPerm === "granted" ? "Ativadas" : "Desativadas"}
            </span>
          </button>
        </div>

        {/* Aviso iPhone/Safari: push só funciona com o app na tela de início */}
        {isIOS && !isStandalone && (
          <div className="rounded-2xl bg-card px-4 py-3.5">
            <p className="text-sm font-semibold">Ative as notificações no iPhone</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              No Safari, toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>,
              abra o APP TDC pelo ícone e toque em <strong>Notificações</strong> aqui para permitir. A Apple
              só permite push em apps instalados na tela de início.
            </p>
          </div>
        )}
        {isIOS && isStandalone && notifyPerm !== "granted" && (
          <button
            onClick={toggleNotifications}
            className="rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Permitir notificações da live
          </button>
        )}


        {/* Grid cards */}
        <div className="grid grid-cols-2 gap-3">
          <InternalCard
            to="/chat"
            icon={<MessageCircle className="h-6 w-6" />}
            title="Chat"
            subtitle="Vincule seu TikTok"
          />
          <InternalCard
            to="/galeria"
            icon={<ImageIcon className="h-6 w-6" />}
            title="Galeria"
            subtitle="Presentes iluminados"
          />

          <GridCard
            href={STREAMER.coinsUrl}
            icon={<Coins className="h-6 w-6" />}
            title="Moedas"
            subtitle="Comprar com desconto"
          />
          <InternalCard
            to="/ferramentas"
            icon={<Wrench className="h-6 w-6" />}
            title="Ferramentas"
            subtitle="Luva, martelo, névoa e impulso"
          />

        </div>

        {/* Redes sociais */}
        <button
          onClick={() => setSocialOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left hover:bg-accent transition"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60">
            <Share2 className="h-4 w-4 text-primary" />
          </span>
          <p className="flex-1 text-sm font-semibold">Redes Sociais</p>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Links legais */}
        <footer className="mt-2 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Link
              to="/termos-de-servico"
              className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 hover:bg-card transition"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              Termos de Serviço
            </Link>
            <Link
              to="/politica-de-privacidade"
              className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 hover:bg-card transition"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              Privacidade
            </Link>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            APP TDC · fã-clube oficial de @caiquevieira_
          </p>
        </footer>
      </main>

      {/* Sheet de redes sociais */}
      {socialOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60"
          onClick={() => setSocialOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-secondary p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                aria-label="Fechar"
                onClick={() => setSocialOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-background/40 text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-3">
              <SocialRow
                href={STREAMER.tiktok}
                icon={<Music2 className="h-5 w-5" />}
                label="TikTok"
              />
              <SocialRow
                href={STREAMER.instagram}
                icon={<Instagram className="h-5 w-5" />}
                label="Instagram"
              />
              <SocialRow
                href={STREAMER.youtube}
                icon={<Youtube className="h-5 w-5" />}
                label="Youtube"
              />
            </div>
          </div>
        </div>
      )}



      {/* Bottom nav fixa */}
      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 px-6 py-3">
          <Link to="/" className="grid place-items-center text-foreground" aria-label="Início">
            <Home className="h-5 w-5" />
          </Link>
          <Link to="/galeria" className="grid place-items-center text-muted-foreground hover:text-foreground transition" aria-label="Galeria">
            <ImageIcon className="h-5 w-5" />
          </Link>
          <Link to="/chat" className="grid place-items-center text-muted-foreground hover:text-foreground transition" aria-label="Chat">
            <MessageCircle className="h-5 w-5" />
          </Link>
          <a
            href={STREAMER.coinsUrl}
            target="_blank"
            rel="noreferrer"
            className="grid place-items-center text-muted-foreground hover:text-foreground transition"
            aria-label="Comprar moedas"
          >
            <Coins className="h-5 w-5" />
          </a>
        </div>
      </nav>

    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof atob !== "undefined" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
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

function SocialRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4 hover:bg-accent transition"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-background/60 text-foreground">
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </a>
  );
}

function InternalCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card px-4 py-6 hover:bg-accent transition"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-background/60 text-foreground">
        {icon}
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{subtitle}</p>
    </Link>
  );
}
