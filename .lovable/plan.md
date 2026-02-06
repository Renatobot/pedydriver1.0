
# Plano: Otimização de Conversão do Modo Visitante

## Problema Identificado

Baseado nos dados de analytics:
- **0 visitas em /demo** (o fluxo Product-Led não está sendo utilizado)
- **82 visitas em /auth** (visitantes vão direto para cadastro)
- **7 tentativas de signup, 0 concluídos** (alta fricção no cadastro)
- **CTR do banner: 1.2%** (banner atual não é persuasivo)

A causa raiz: o **CTA do Header** leva para `/auth?signup` enquanto deveria levar para `/demo`, criando um funil fragmentado.

---

## O que será implementado

### 1. Unificar CTAs para /demo
Alterar o botão do Header para direcionar visitantes à experiência de demonstração antes do cadastro.

### 2. Popup de Urgência após 2 Registros (DemoProgressNudge)
Quando o visitante registrar 2+ entradas, exibir um popup:
- Mostra o valor total registrado (ex: "R$ 150 em ganhos")
- Cria senso de valor sem interromper
- CTA: "Salvar meus dados" / "Continuar testando"
- Aparece apenas 1x por sessão

### 3. Banner Melhorado com Métricas em Tempo Real
Atualizar o GuestModeBanner para mostrar:
- Total de ganhos registrados (R$ X)
- Indicador de dados temporários
- CTA mais urgente: "Criar conta grátis"

### 4. Modal de Cadastro com Resumo Financeiro
Melhorar o SignupPromptModal para exibir:
- Resumo dos dados: "R$ X em ganhos, R$ Y em gastos"
- Lucro calculado que será salvo
- Mensagem de urgência: "Não perca seus registros"

### 5. Detecção de Intenção de Saída (Exit Intent)
Quando o visitante tentar sair da página /demo:
- Desktop: mouse se move para fora da janela
- Mobile: botão "voltar" ou tab switching
- Exibe modal: "Quer salvar seus R$ X antes de ir?"

### 6. Social Proof no Demo
Adicionar na página de demonstração:
- Contagem de motoristas ativos
- Validação social discreta

### 7. Novos Eventos de Analytics
Rastrear interações para medir o impacto:
- `demo_nudge_shown` / `demo_nudge_clicked` / `demo_nudge_dismissed`
- `demo_exit_intent_shown` / `demo_exit_intent_clicked`

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/guest/DemoProgressNudge.tsx` | Popup de urgência após 2 registros |
| `src/components/guest/DemoExitIntent.tsx` | Modal de intenção de saída |
| `src/components/guest/DemoSocialProof.tsx` | Badge de social proof |

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/landing/LandingHeader.tsx` | CTA leva para `/demo` em vez de `/auth` |
| `src/components/guest/GuestModeBanner.tsx` | Exibir total de ganhos e CTA mais urgente |
| `src/components/guest/SignupPromptModal.tsx` | Adicionar resumo financeiro e urgência |
| `src/pages/Demo.tsx` | Integrar nudge, exit intent e social proof |
| `src/contexts/GuestModeContext.tsx` | Adicionar cálculo de totais (totalEarnings, totalExpenses) |
| `src/hooks/useAnalytics.tsx` | Novos eventos de tracking |

---

## Detalhes Técnicos

### LandingHeader.tsx - Mudança do CTA

```text
Antes:  <Link to="/auth?signup" ...>
Depois: <Link to="/demo" ...>
```

### GuestModeBanner.tsx - Layout Melhorado

```text
┌─────────────────────────────────────────────┐
│ ⏱️ Dados temporários │ R$ 150 │ [Criar conta grátis] │
└─────────────────────────────────────────────┘
```

### DemoProgressNudge.tsx - Lógica de Trigger

```text
- Trigger: guestEntryCount >= 2 && !hasShownNudge
- Salva no sessionStorage para não repetir
- Desaparece após 10s ou interação
- Tracking: demo_nudge_shown, demo_nudge_clicked
```

### DemoExitIntent.tsx - Detecção de Saída

```text
Desktop:
- mouseout quando Y < 0 (mouse saindo pela parte superior)
- Só dispara se guestEntryCount > 0

Mobile:
- visibilitychange event (quando troca de aba)
- beforeunload (quando tenta fechar)
```

### Novos Métodos no GuestModeContext

```typescript
interface GuestModeContextValue {
  // ... existentes
  totalEarnings: number;    // Soma dos ganhos
  totalExpenses: number;    // Soma dos gastos
  netProfit: number;        // Lucro líquido
}
```

---

## Textos e Mensagens

### DemoProgressNudge
```text
Título: "Você já registrou R$ X!"
Subtítulo: "Salve seus dados em 30 segundos"
CTA Primário: "Salvar meus dados"
CTA Secundário: "Continuar testando"
```

### DemoExitIntent
```text
Título: "Quer salvar seus R$ X?"
Subtítulo: "Seus registros serão perdidos se você sair"
CTA: "Salvar agora"
Link: "Não, pode perder"
```

### GuestModeBanner (atualizado)
```text
"⏱️ Dados temporários • R$ X registrado • [Criar conta grátis]"
```

---

## Ordem de Implementação

1. Alterar `LandingHeader.tsx` (CTA para /demo)
2. Adicionar totais ao `GuestModeContext.tsx`
3. Atualizar `GuestModeBanner.tsx` com métricas
4. Criar `DemoProgressNudge.tsx`
5. Criar `DemoExitIntent.tsx`
6. Atualizar `SignupPromptModal.tsx` com resumo
7. Criar `DemoSocialProof.tsx`
8. Integrar tudo no `Demo.tsx`
9. Adicionar eventos no `useAnalytics.tsx`

---

## Métricas de Sucesso Esperadas

| Métrica | Atual | Meta |
|---------|-------|------|
| Visitas em /demo | 0 | 50%+ das visitas landing |
| Registros no demo | 0 | 2+ por sessão |
| Demo → Signup rate | 0% | 10%+ |
| Signup completion | 0% | 30%+ |

---

## Considerações UX

- Popups aparecem no máximo 1x por sessão
- Valor primeiro: deixar experimentar antes de pedir cadastro
- Mobile-first: todos os componentes touch-friendly
- Urgência sutil: mostrar que dados são temporários sem assustar
