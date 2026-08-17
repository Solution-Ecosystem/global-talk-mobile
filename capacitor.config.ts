import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.a6d2b4d8f87f46ac94aa158edd6bdf51",
  appName: "APP TDC",
  webDir: "dist/client",
  server: {
    // Hot-reload direto do preview da Lovable.
    // Para publicar nas lojas, remova o bloco "server" e rode `npm run build`.
    url: "https://a6d2b4d8-f87f-46ac-94aa-158edd6bdf51.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  android: {
    backgroundColor: "#140805",
  },
  ios: {
    backgroundColor: "#140805",
  },
};

export default config;
