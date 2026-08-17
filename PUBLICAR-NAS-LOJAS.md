# Publicar o APP TDC na Play Store e App Store

O app agora está preparado com Capacitor (mesmo código web rodando como app nativo).
Os passos abaixo precisam ser feitos no seu computador — a Apple e o Google exigem
build local/assinado e contas de desenvolvedor.

## 1. Exportar o projeto

1. No Lovable: **GitHub → Export to GitHub** e depois `git clone` no seu PC.
2. Na pasta do projeto: `npm install`

## 2. Gerar as plataformas

```bash
npx cap add android      # precisa de Android Studio
npx cap add ios          # precisa de um Mac com Xcode
npm run build
npx cap sync
```

> Para gerar a versão da loja, remova o bloco `server` do `capacitor.config.ts`
> antes do `npm run build` (assim o app usa os arquivos embarcados e não o preview).

## 3. Rodar / testar

```bash
npx cap run android
npx cap run ios
```

## 4. Publicar

**Google Play** (conta de desenvolvedor: US$ 25, pagamento único)

1. Android Studio → *Build → Generate Signed Bundle (AAB)*.
2. Google Play Console → criar app → subir o `.aab`.
3. Preencher ficha da loja, política de privacidade
   (`https://global-talk-mobile.lovable.app/politica-de-privacidade`), classificação
   etária e formulário de dados. Revisão: alguns dias.

**App Store** (Apple Developer Program: US$ 99/ano)

1. Xcode → escolher o time de assinatura → *Product → Archive*.
2. *Distribute App → App Store Connect*.
3. App Store Connect → criar o app, subir screenshots, descrição, política de
   privacidade e enviar para revisão.

## Observações

- Notificações push nativas: no navegador já funcionam via Web Push. Nos apps das
  lojas o ideal é adicionar `@capacitor/push-notifications` com Firebase (Android)
  e APNs (iOS) — posso implementar quando você tiver as contas criadas.
- Sempre que alterar o código: `npm run build && npx cap sync`.
