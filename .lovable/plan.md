
# Plano de Implementação: Termos, Privacidade e Correções Pendentes

## Resumo

Implementação completa de Política de Privacidade, Termos de Uso (incluindo regras de indicação), links nas páginas apropriadas, e correção de todas as inconsistências pendentes da auditoria.

---

## Parte 1: Novas Páginas Legais

### 1.1 Política de Privacidade (`src/pages/PrivacyPolicy.tsx`)

Nova página com os seguintes tópicos:
- Dados coletados (email, nome, telefone, dados de uso)
- Finalidade do uso dos dados
- Compartilhamento com terceiros (apenas processadores de pagamento)
- Segurança dos dados (criptografia, Supabase)
- Direitos do usuário (LGPD: acesso, correção, exclusão)
- Cookies e tecnologias similares
- Contato para dúvidas

### 1.2 Termos de Uso (`src/pages/TermsOfUse.tsx`)

Nova página com os seguintes tópicos:
- Aceitação dos termos
- Descrição do serviço
- Cadastro e responsabilidades do usuário
- Planos e pagamentos (gratuito e PRO)
- **Programa de Indicação** (seção dedicada):
  - Como funciona o sistema de indicação
  - Requisitos para validação (24h de uso + 2 de 4 critérios)
  - Benefícios: 7 dias PRO para indicador e indicado
  - Limite máximo de 90 dias de acúmulo
  - Proteções anti-fraude (fingerprint, mesmo dispositivo)
  - Proibições (contas falsas, auto-indicação)
- Propriedade intelectual
- Limitação de responsabilidade
- Cancelamento e reembolso
- Alterações nos termos
- Legislação aplicável (Brasil, LGPD)

---

## Parte 2: Configuração de Rotas

### 2.1 Atualizar `src/App.tsx`

Adicionar rotas públicas:
- `/privacy` - Política de Privacidade
- `/terms` - Termos de Uso

---

## Parte 3: Links nas Páginas

### 3.1 Página de Cadastro (`src/pages/Auth.tsx`)

Adicionar no final do formulário de signup:
```
Ao criar sua conta, você concorda com os Termos de Uso e Política de Privacidade
```

### 3.2 Footer da Landing (`src/components/landing/TrustFooter.tsx`)

Adicionar links para:
- Termos de Uso
- Política de Privacidade

Corrigir: import do logo para `logo-optimized.webp`

---

## Parte 4: Correções Pendentes da Auditoria

### 4.1 Usar Constantes PRICING

**UpgradeCard.tsx** (linhas 87-89):
```typescript
// De:
<span className="text-3xl font-bold">R$ 14,90</span>
<span className="text-muted-foreground">/mês</span>
<span className="text-xs text-muted-foreground ml-2">ou R$ 99/ano</span>

// Para:
<span className="text-3xl font-bold">R$ {PRICING.monthly.toFixed(2).replace('.', ',')}</span>
<span className="text-muted-foreground">/mês</span>
<span className="text-xs text-muted-foreground ml-2">ou R$ {PRICING.yearly}/ano</span>
```

**UpgradeModal.tsx** (linhas 67-73):
```typescript
// De:
<span className="text-3xl font-bold">R$ 14,90</span>
<span className="text-muted-foreground">/mês</span>
ou R$ 99/ano (economize 45%)

// Para:
<span className="text-3xl font-bold">R$ {PRICING.monthly.toFixed(2).replace('.', ',')}</span>
<span className="text-muted-foreground">/mês</span>
ou R$ {PRICING.yearly}/ano (economize {PRICING.discountPercent}%)
```

### 4.2 AdminPendingPayments - Threshold Dinâmico

**AdminPendingPayments.tsx** (linha 142):
```typescript
// De:
setIsAnnual(payment.amount >= 9000);

// Para:
setIsAnnual(payment.amount >= (PRICING.yearly * 100) - 500);
```

### 4.3 PaymentSuccess - Features PRO Completas

**PaymentSuccess.tsx** (linhas 199-214 e 316-332):
Adicionar features faltantes:
- "Melhor dia para trabalhar"
- "Plataformas ilimitadas"

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/PrivacyPolicy.tsx` | Página de Política de Privacidade |
| `src/pages/TermsOfUse.tsx` | Página de Termos de Uso |

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/App.tsx` | Adicionar rotas /privacy e /terms |
| `src/pages/Auth.tsx` | Adicionar texto de consentimento com links |
| `src/components/landing/TrustFooter.tsx` | Corrigir logo + adicionar links legais |
| `src/components/subscription/UpgradeCard.tsx` | Usar PRICING constants |
| `src/components/subscription/UpgradeModal.tsx` | Usar PRICING constants |
| `src/pages/admin/AdminPendingPayments.tsx` | Usar PRICING para threshold |
| `src/pages/PaymentSuccess.tsx` | Adicionar features PRO faltantes |

---

## Seção Técnica

### Estrutura da Página de Termos

```typescript
// src/pages/TermsOfUse.tsx
export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1>Termos de Uso</h1>
        
        {/* Seções com ScrollArea ou Accordion para mobile */}
        <section id="referral-program">
          <h2>7. Programa de Indicação</h2>
          {/* Regras detalhadas... */}
        </section>
      </div>
    </div>
  );
}
```

### Constantes para Referral no Termos

Usarei as informações da memória do sistema para documentar:
- 7 dias PRO por indicação bem-sucedida
- 24h mínimo de uso + 2 de 4 critérios
- Limite de 90 dias de acúmulo
- Proteção por fingerprint

### Texto de Consentimento no Signup

```tsx
<p className="text-2xs text-muted-foreground text-center mt-4">
  Ao criar sua conta, você concorda com os{' '}
  <Link to="/terms" className="text-primary hover:underline">
    Termos de Uso
  </Link>{' '}
  e{' '}
  <Link to="/privacy" className="text-primary hover:underline">
    Política de Privacidade
  </Link>
</p>
```
