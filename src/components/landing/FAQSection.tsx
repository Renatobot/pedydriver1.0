import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'O PEDY Driver é realmente grátis?',
    answer: 'Sim! O plano gratuito é permanente e permite registrar até 30 entradas por mês. É perfeito para quem está começando a controlar seus ganhos. Se você roda full-time, o plano PRO oferece entradas ilimitadas e relatórios avançados.',
  },
  {
    question: 'Funciona com Uber, 99, iFood e outros apps?',
    answer: 'Sim! O PEDY Driver funciona com qualquer plataforma de transporte ou entrega: Uber, 99, iFood, Rappi, InDrive, 99Food, Lalamove e muitas outras. Você pode até comparar qual plataforma dá mais lucro por hora.',
  },
  {
    question: 'Como o app calcula meu lucro real?',
    answer: 'O PEDY Driver desconta todos os seus gastos (combustível, manutenção, alimentação, etc.) dos seus ganhos brutos. Assim você vê quanto realmente sobra no seu bolso. Também calculamos seu lucro por hora e por km rodado.',
  },
  {
    question: 'Preciso anotar tudo manualmente?',
    answer: 'O registro é super rápido: em 10 segundos você adiciona um ganho ou gasto. Você pode fazer isso enquanto espera passageiro ou na hora do almoço. O app foi feito para ser usado com uma mão só.',
  },
  {
    question: 'Meus dados ficam seguros?',
    answer: 'Seus dados são criptografados e armazenados com segurança. Apenas você tem acesso às suas informações financeiras. Não compartilhamos seus dados com terceiros.',
  },
  {
    question: 'Posso usar offline?',
    answer: 'Sim! Você pode registrar ganhos e gastos mesmo sem internet. Quando sua conexão voltar, tudo sincroniza automaticamente. Perfeito para quem roda em áreas com sinal fraco.',
  },
];

export function FAQSection() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/20">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Dúvidas frequentes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground">
            Tire suas dúvidas sobre o PEDY Driver
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-border/50 rounded-xl px-5 bg-card/50 data-[state=open]:bg-card"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
