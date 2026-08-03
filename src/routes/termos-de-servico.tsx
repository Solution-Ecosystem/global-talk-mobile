import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Scale } from "lucide-react";

export const Route = createFileRoute("/termos-de-servico")({
  head: () => ({
    meta: [
      { title: "Termos de Serviço — APP TDC" },
      { name: "description", content: "Termos de Serviço oficiais do APP TDC. Leia as regras de uso, notificações, privacidade e responsabilidades." },
      { property: "og:title", content: "Termos de Serviço — APP TDC" },
      { property: "og:description", content: "Termos de Serviço oficiais do APP TDC." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://global-talk-mobile.lovable.app/termos-de-servico" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://global-talk-mobile.lovable.app/termos-de-servico" },
    ],
  }),
  component: TermosDeServico,
});

function TermosDeServico() {
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
              <Scale className="h-5 w-5 text-primary" />
              <h1 className="text-base font-semibold tracking-tight">Termos de Serviço</h1>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6 text-sm leading-relaxed">
          <p className="text-xs text-muted-foreground">
            Esta página é mantida por Matheus de Lima Lessa para responder dúvidas comuns sobre o uso do APP TDC.
            Última atualização: 3 de agosto de 2026.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar, instalar ou usar o APP TDC, você concorda com estes Termos de Serviço. Se não concordar com qualquer parte, não utilize o aplicativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Sobre o APP TDC</h2>
            <p className="text-muted-foreground">
              O APP TDC é um aplicativo web progressivo (PWA) de fãs que oferece notificações quando o streamer Caique Vieira (@caiquevieira_) estiver ao vivo no TikTok, além de acesso a chat, galeria de presentes, ferramentas da live e redes sociais do streamer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Notificações Push</h2>
            <p className="text-muted-foreground">
              O app pode enviar notificações ao dispositivo quando o streamer iniciar uma live no TikTok. Você pode ativar ou desativar as notificações a qualquer momento nas configurações do navegador ou do dispositivo.
            </p>
            <p className="text-muted-foreground">
              No iPhone/Safari, as notificações push só funcionam quando o app é adicionado à Tela de Início e aberto pelo ícone. Isso é uma limitação da Apple, não do app.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. Vínculo com o TikTok</h2>
            <p className="text-muted-foreground">
              Para participar do chat, você pode vincular sua conta do TikTok via login seguro (OAuth). O app acessa apenas informações públicas do seu perfil (como nome de usuário e foto) necessárias para identificação no chat e na galeria de presentes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">5. Uso Permitido</h2>
            <p className="text-muted-foreground">
              Você se compromete a usar o app de forma lícita, respeitosa e de acordo com as regras do TikTok e das demais plataformas terceiras. É proibido usar o app para assédio, spam, disseminação de conteúdo ilegal ou qualquer atividade que prejudique outros usuários.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              O conteúdo do app, incluindo nome, logo, design e código, pertence a Matheus de Lima Lessa ou a seus licenciadores. Conteúdos do streamer, do TikTok e de outras plataformas pertencem aos respectivos donos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              O APP TDC é fornecido "como está". Não garantimos que as notificações, dados da live ou informações da galeria estejam sempre disponíveis, atualizados ou livres de erros. O app depende de APIs e serviços de terceiros (TikTok), que podem alterar ou limitar o acesso sem aviso prévio.
            </p>
            <p className="text-muted-foreground">
              Em nenhuma hipótese seremos responsáveis por danos diretos, indiretos ou incidentais resultantes do uso ou incapacidade de uso do app.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">8. Alterações nos Termos</h2>
            <p className="text-muted-foreground">
              Podemos atualizar estes Termos a qualquer momento. A versão mais recente estará sempre disponível nesta página. O uso continuado do app após alterações significa que você aceitou os novos termos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">9. Contato</h2>
            <p className="text-muted-foreground">
              Dúvidas, solicitações ou reclamações podem ser enviadas para:{" "}
              <a
                href="mailto:matheuslimalessa001@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                matheuslimalessa001@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">10. Foro</h2>
            <p className="text-muted-foreground">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias, fica eleito o foro da comarca de domicílio do responsável, salvo disposição legal em contrário.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
