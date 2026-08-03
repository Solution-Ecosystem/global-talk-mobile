import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — APP TDC" },
      { name: "description", content: "Política de Privacidade do APP TDC. Saiba como seus dados são coletados, usados e protegidos." },
      { property: "og:title", content: "Política de Privacidade — APP TDC" },
      { property: "og:description", content: "Política de Privacidade do APP TDC." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://global-talk-mobile.lovable.app/politica-de-privacidade" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://global-talk-mobile.lovable.app/politica-de-privacidade" },
    ],
  }),
  component: PoliticaDePrivacidade,
});

function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <div className="w-full max-w-sm px-5 pt-6 pb-28">
        {/* Header fixo */}
        <header className="sticky top-0 z-30 -mx-5 bg-background/95 backdrop-blur px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-9 w-9 place-items-center rounded-full bg-card hover:bg-accent transition"
              aria-label="Voltar para o início"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-base font-semibold tracking-tight">Política de Privacidade</h1>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6 text-sm leading-relaxed">
          <p className="text-xs text-muted-foreground">
            Esta página é mantida por Matheus de Lima Lessa para explicar como o APP TDC trata dados pessoais.
            Última atualização: 3 de agosto de 2026.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Responsável pelo Tratamento</h2>
            <p className="text-muted-foreground">
              O responsável pelos dados pessoais coletados pelo APP TDC é Matheus de Lima Lessa. Contato:{" "}
              <a
                href="mailto:matheuslimalessa001@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                matheuslimalessa001@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Dados que Coletamos</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <strong>Token de notificação push:</strong> quando você ativa as notificações, armazenamos o endpoint e chaves fornecidos pelo navegador para enviar alertas de live.
              </li>
              <li>
                <strong>Dados do perfil do TikTok:</strong> ao vincular sua conta, coletamos nome de usuário, foto de perfil e identificador público necessários para o chat e a galeria.
              </li>
              <li>
                <strong>Mensagens de chat:</strong> mensagens enviadas no chat coletivo do app são armazenadas para exibição aos participantes.
              </li>
              <li>
                <strong>Dados de uso:</strong> informações técnicas como tipo de navegador, sistema operacional e estatísticas de acesso, usadas para melhorar a experiência.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Finalidade do Uso dos Dados</h2>
            <p className="text-muted-foreground">
              Utilizamos seus dados exclusivamente para:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Enviar notificações quando o streamer iniciar uma live no TikTok;</li>
              <li>Permitir sua participação no chat vinculado ao TikTok;</li>
              <li>Exibir, na galeria de presentes, o nome do presenteador que iluminou um presente;</li>
              <li>Manter, melhorar e garantir a segurança do app.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              Não vendemos seus dados pessoais. Compartilhamos informações apenas quando necessário para operar o app, como serviços de hospedagem (Lovable Cloud) e APIs oficiais do TikTok.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">5. Segurança</h2>
            <p className="text-muted-foreground">
              Adotamos medidas técnicas e administrativas para proteger seus dados, incluindo criptografia em trânsito (HTTPS), controle de acesso por autenticação e políticas de segurança no banco de dados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">6. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground">
              De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Solicitar acesso aos seus dados pessoais;</li>
              <li>Solicitar correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>Revogar seu consentimento a qualquer momento;</li>
              <li>Solicitar informações sobre com quem seus dados foram compartilhados.</li>
            </ul>
            <p className="text-muted-foreground">
              Para exercer seus direitos, envie um e-mail para:{" "}
              <a
                href="mailto:matheuslimalessa001@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                matheuslimalessa001@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">7. Retenção e Exclusão</h2>
            <p className="text-muted-foreground">
              Mantemos seus dados apenas pelo tempo necessário para as finalidades descritas nesta política ou enquanto você usar o app. Você pode solicitar a exclusão de seus dados a qualquer momento pelo e-mail de contato.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">8. Cookies e Tecnologias Semelhantes</h2>
            <p className="text-muted-foreground">
              O app pode usar cookies e tecnologias similares para manter sua sessão de login e entender como o app é usado. Você pode gerenciar essas preferências nas configurações do navegador.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">9. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente será sempre publicada nesta página, com a data de atualização no topo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">10. Contato</h2>
            <p className="text-muted-foreground">
              Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato pelo e-mail:{" "}
              <a
                href="mailto:matheuslimalessa001@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                matheuslimalessa001@gmail.com
              </a>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
