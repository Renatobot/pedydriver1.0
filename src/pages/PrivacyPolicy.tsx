import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/landing">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-muted-foreground mt-2">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Content */}
        <ScrollArea className="h-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A PEDY Soluções Digitais ("nós", "nosso" ou "Empresa") está comprometida em proteger sua privacidade. 
                Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações 
                pessoais quando você utiliza o aplicativo PEDY Driver ("Aplicativo").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Dados Coletados</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Coletamos os seguintes tipos de informações:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Dados de cadastro:</strong> nome completo, endereço de e-mail e número de telefone (WhatsApp)</li>
                <li><strong>Dados de uso:</strong> registros de ganhos, despesas, jornadas de trabalho, quilometragem e plataformas utilizadas</li>
                <li><strong>Dados técnicos:</strong> identificadores de dispositivo (para segurança e prevenção de fraudes), tipo de navegador e sistema operacional</li>
                <li><strong>Dados de pagamento:</strong> informações sobre transações e plano de assinatura (os dados de pagamento são processados diretamente pela InfinitePay)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Finalidade do Uso dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Fornecer, operar e melhorar o Aplicativo</li>
                <li>Gerar relatórios financeiros e análises personalizadas</li>
                <li>Processar pagamentos e gerenciar sua assinatura</li>
                <li>Enviar notificações importantes sobre o serviço</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Compartilhamento com Terceiros</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Processadores de pagamento:</strong> InfinitePay, para processar transações financeiras</li>
                <li><strong>Provedores de infraestrutura:</strong> serviços de hospedagem e banco de dados para operação do Aplicativo</li>
                <li><strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Armazenamento seguro em banco de dados com controle de acesso</li>
                <li>Autenticação segura com hash de senhas</li>
                <li>Monitoramento contínuo contra acessos não autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Acesso:</strong> solicitar uma cópia dos seus dados pessoais</li>
                <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Exclusão:</strong> solicitar a eliminação dos seus dados pessoais</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
                <li><strong>Revogação do consentimento:</strong> retirar seu consentimento a qualquer momento</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Para exercer seus direitos, entre em contato através do suporte no Aplicativo ou pelo e-mail informado na seção de Contato.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos armazenamento local (localStorage) para manter você conectado e salvar suas preferências. 
                Também coletamos identificadores de dispositivo para fins de segurança e prevenção de fraudes no programa de indicação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer nossos serviços. 
                Após a exclusão da conta, seus dados serão removidos em até 30 dias, exceto quando houver obrigação legal de retenção.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas 
                através do Aplicativo ou por e-mail. O uso continuado do Aplicativo após as alterações constitui sua aceitação da nova política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, entre em contato conosco 
                através do suporte disponível no menu Configurações do Aplicativo.
              </p>
            </section>

            <section className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                PEDY Soluções Digitais<br />
                CNPJ: [A ser preenchido]<br />
                Brasil
              </p>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
