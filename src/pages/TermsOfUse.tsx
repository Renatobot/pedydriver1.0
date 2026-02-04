import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PRICING } from '@/lib/constants';

export default function TermsOfUse() {
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
          <h1 className="text-2xl sm:text-3xl font-bold">Termos de Uso</h1>
          <p className="text-muted-foreground mt-2">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Content */}
        <ScrollArea className="h-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao criar uma conta ou utilizar o PEDY Driver ("Aplicativo"), você concorda com estes Termos de Uso e nossa 
                Política de Privacidade. Se você não concordar com algum termo, não utilize o Aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O PEDY Driver é um aplicativo de gestão financeira desenvolvido para motoristas de aplicativo. 
                Permite registrar ganhos, despesas, jornadas de trabalho e gerar relatórios para auxiliar na gestão do seu negócio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Cadastro e Responsabilidades do Usuário</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Ao se cadastrar, você declara que:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>As informações fornecidas são verdadeiras, precisas e atualizadas</li>
                <li>É responsável por manter a segurança da sua conta e senha</li>
                <li>Não compartilhará sua conta com terceiros</li>
                <li>Notificará imediatamente qualquer uso não autorizado da sua conta</li>
                <li>Tem pelo menos 18 anos de idade ou possui autorização legal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Planos e Pagamentos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O Aplicativo oferece dois planos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-3">
                <li><strong>Plano Gratuito:</strong> funcionalidades básicas com limite de 30 registros por mês, 1 plataforma ativa e histórico de 7 dias</li>
                <li><strong>Plano PRO:</strong> acesso completo a todas as funcionalidades, registros ilimitados, plataformas ilimitadas e histórico completo</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Valores do Plano PRO:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Mensal: R$ {PRICING.monthly.toFixed(2).replace('.', ',')}/mês</li>
                <li>Anual: R$ {PRICING.yearly}/ano (economia de {PRICING.discountPercent}%)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Os pagamentos são processados pela InfinitePay. Os preços podem ser alterados com aviso prévio de 30 dias.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Cancelamento e Reembolso</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você pode cancelar sua assinatura a qualquer momento através do suporte. Após o cancelamento, 
                você manterá acesso ao plano PRO até o final do período já pago. Não oferecemos reembolso proporcional 
                para períodos não utilizados, exceto em casos previstos pelo Código de Defesa do Consumidor (arrependimento em até 7 dias da compra).
              </p>
            </section>

            <section id="referral-program">
              <h2 className="text-xl font-semibold mb-3">6. Programa de Indicação</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O PEDY Driver oferece um programa de indicação ("Indique e Ganhe") sujeito às seguintes regras:
              </p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">6.1. Como Funciona</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Cada usuário recebe um código de indicação único após 48 horas de uso do aplicativo</li>
                <li>O código pode ser compartilhado com amigos que ainda não possuem conta no PEDY Driver</li>
                <li>Quando um novo usuário se cadastra usando seu código, uma indicação "pendente" é criada</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">6.2. Validação da Indicação</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Para que a indicação seja validada e os benefícios concedidos, o usuário indicado deve:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Utilizar o aplicativo ativamente por pelo menos 24 horas após o cadastro</li>
                <li>Cumprir pelo menos 2 dos 4 critérios de atividade:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Registrar pelo menos 1 ganho</li>
                    <li>Registrar pelo menos 1 despesa</li>
                    <li>Cadastrar pelo menos 1 plataforma</li>
                    <li>Registrar pelo menos 1 jornada de trabalho</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">6.3. Benefícios</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Para quem indica:</strong> 7 dias de acesso ao Plano PRO por cada indicação validada</li>
                <li><strong>Para quem é indicado:</strong> 7 dias de acesso ao Plano PRO após validação</li>
                <li><strong>Limite máximo:</strong> o acúmulo de dias PRO por indicação é limitado a 90 dias. Após atingir o limite, continue indicando para manter seu acesso PRO ativo</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">6.4. Proteções Anti-Fraude</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Para garantir a integridade do programa, implementamos as seguintes proteções:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Identificação de dispositivo (fingerprint) para prevenir múltiplas contas</li>
                <li>Detecção de contas criadas no mesmo dispositivo</li>
                <li>Análise de padrões de uso suspeitos</li>
                <li>Validação diferida baseada em uso real do aplicativo</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">6.5. Proibições</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                São expressamente proibidas as seguintes práticas:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Criar contas falsas para obter benefícios de indicação</li>
                <li>Auto-indicação (indicar a si mesmo com outra conta)</li>
                <li>Usar o mesmo dispositivo para múltiplas contas</li>
                <li>Vender ou comercializar códigos de indicação</li>
                <li>Qualquer forma de manipulação do sistema de indicação</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                A violação dessas regras resultará no cancelamento dos benefícios e pode levar ao bloqueio da conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo do Aplicativo, incluindo mas não se limitando a textos, gráficos, logotipos, ícones, 
                imagens, código-fonte e software, é propriedade da PEDY Soluções Digitais ou de seus licenciadores e é 
                protegido por leis de direitos autorais e propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O Aplicativo é fornecido "como está". Não garantimos que:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>O serviço será ininterrupto ou livre de erros</li>
                <li>Os resultados obtidos serão precisos ou confiáveis</li>
                <li>O Aplicativo atenderá a todas as suas necessidades específicas</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Não nos responsabilizamos por decisões financeiras ou empresariais tomadas com base nas informações 
                fornecidas pelo Aplicativo. Os dados e relatórios são ferramentas auxiliares e não substituem 
                aconselhamento profissional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Uso Aceitável</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Você concorda em não:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Interferir ou tentar interferir no funcionamento do Aplicativo</li>
                <li>Tentar acessar áreas não autorizadas do sistema</li>
                <li>Usar o Aplicativo para fins ilegais ou não autorizados</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Modificações dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão 
                comunicadas através do Aplicativo ou por e-mail com pelo menos 15 dias de antecedência. O uso continuado 
                do Aplicativo após as alterações constitui sua aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Legislação Aplicável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida 
                ao foro da comarca do domicílio do usuário, conforme previsto no Código de Defesa do Consumidor, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do suporte disponível no 
                menu Configurações do Aplicativo.
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
