# Plano: Termos de Serviço e Política de Privacidade

## Objetivo
Criar as páginas legais oficiais do APP TDC — Termos de Serviço e Política de Privacidade — em rotas públicas, com design consistente ao app, e adicionar o link de acesso no layout principal.

## Dados fornecidos pelo responsável
- **Proprietário do app:** Matheus de Lima Lessa
- **E-mail de contato:** matheuslimalessa001@gmail.com
- **Jurisdição:** Brasil
- **App:** APP TDC (notificações da live do streamer @caiquevieira_ no TikTok)

## Escopo

1. **Criar rota `/termos-de-servico`**
   - Página pública com os Termos de Serviço oficiais do APP TDC.
   - Texto em português, estruturado em seções claras.
   - Incluir: uso do app, notificações push, vinculação TikTok, propriedade intelectual, limitação de responsabilidade, modificação dos termos, contato.
   - Incluir qualifier de que a página é mantida pelo responsável do app.

2. **Criar rota `/politica-de-privacidade`**
   - Página pública com a Política de Privacidade do APP TDC.
   - Explicar dados coletados: token de push, perfil vinculado ao TikTok, mensagens de chat, dados de uso.
   - Finalidade: notificações de live, chat coletivo, exibição de presenteadores na galeria.
   - Direitos do usuário (LGPD): acesso, correção, exclusão, revogação de consentimento.
   - Contato para solicitações de privacidade.

3. **Design e UX**
   - Reutilizar o design system dark navy existente (`src/styles.css`).
   - Layout mobile-first, legível, com cabeçalho fixo e botão voltar.
   - Cada página terá `head()` com título, description, og:title, og:description, og:type e twitter:card.

4. **Integração no app**
   - Adicionar link "Termos de Serviço" e "Privacidade" em local acessível na home (`src/routes/index.tsx`), provavelmente próximo à seção de configurações ou no final da página, antes da navegação inferior.

5. **SEO**
   - Atualizar `src/routes/sitemap[.]xml.ts` para incluir `/termos-de-servico` e `/politica-de-privacidade`.

## Entregáveis
- `src/routes/termos-de-servico.tsx`
- `src/routes/politica-de-privacidade.tsx`
- Edição em `src/routes/index.tsx` para adicionar os links legais
- Edição em `src/routes/sitemap[.]xml.ts` para incluir as novas rotas
