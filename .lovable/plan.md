

# Plano: Validacao de Limite de Registros (30/mes)

## Objetivo
Implementar validacao completa do limite de 30 registros mensais para usuarios do plano gratuito, com feedback visual progressivo e bloqueio inteligente.

---

## Estrategia de UX

### Niveis de Alerta

| Nivel | Condicao | Comportamento |
|-------|----------|---------------|
| Normal | 0-79% (0-23 registros) | Contador discreto visivel |
| Alerta | 80-99% (24-29 registros) | Banner amarelo de aviso |
| Bloqueio | 100% (30 registros) | Formulario bloqueado + CTA upgrade |

### Onde Mostrar

1. **Topo do app (sempre visivel)** - Contador discreto: "12 de 30 registros"
2. **Banner de alerta (80%+)** - Mensagem de atencao + botao upgrade
3. **Formularios (bloqueio 100%)** - Overlay de bloqueio inteligente

---

## Arquivos a Modificar

### 1. src/components/subscription/EntryLimitBanner.tsx
**Melhorias:**
- Adicionar variante compacta para o topo do app (sempre visivel)
- Melhorar mensagens progressivas
- Adicionar componente `EntryLimitIndicator` para uso global

### 2. src/components/subscription/EntryLimitBlocker.tsx (NOVO)
**Componente de bloqueio para formularios:**
- Overlay quando limite atingido
- Mensagem clara: "Voce atingiu o limite de registros gratuitos"
- Botao proeminente para upgrade
- Nao bloqueia visualizacao de dados existentes

### 3. src/components/forms/EarningForm.tsx
**Adicionar validacao:**
- Importar `useSubscriptionContext`
- Verificar `canAddEntry` antes de permitir submit
- Mostrar `EntryLimitBlocker` se limite atingido
- Desabilitar formulario quando bloqueado

### 4. src/components/forms/ExpenseForm.tsx
**Mesmas modificacoes do EarningForm**

### 5. src/components/forms/ShiftForm.tsx
**Mesmas modificacoes do EarningForm**

### 6. src/pages/QuickEntry.tsx
**Adicionar validacao:**
- Verificar limite antes de salvar
- Mostrar bloqueio se limite atingido
- Manter metricas visiveis (nao bloquear visualizacao)

### 7. src/pages/Add.tsx
**Adicionar banner de limite:**
- Mostrar `EntryLimitBanner` no topo da pagina
- Contador sempre visivel para usuarios free

### 8. src/components/layout/AppLayout.tsx
**Adicionar indicador global:**
- Mostrar contador discreto no header
- Visivel em todas as paginas para usuarios free

### 9. src/hooks/useOfflineEarnings.tsx
**Adicionar validacao no hook:**
- Verificar limite antes de criar registro
- Lancar erro se limite atingido
- Invalidar queries apos sucesso

### 10. src/hooks/useOfflineExpenses.tsx
**Mesmas modificacoes do useOfflineEarnings**

### 11. src/hooks/useOfflineShifts.tsx
**Mesmas modificacoes do useOfflineShifts**

---

## Detalhes de Implementacao

### Componente EntryLimitIndicator (compacto)

```text
Aparencia:
┌─────────────────────────────────┐
│  📊 12/30 registros   [=====   ]│
└─────────────────────────────────┘

Cores da barra:
- 0-69%: primary (azul)
- 70-89%: amber (amarelo)
- 90%+: destructive (vermelho)
```

### Componente EntryLimitBlocker

```text
Aparencia (overlay sobre formulario):
┌─────────────────────────────────────────┐
│                                         │
│      🔒 Limite de Registros Atingido    │
│                                         │
│  Voce usou todos os 30 registros        │
│  gratuitos deste mes.                   │
│                                         │
│  Para continuar acompanhando seus       │
│  ganhos, ative o plano PRO.             │
│                                         │
│  [  💎 Desbloquear Registros  ]         │
│                                         │
│          Continuar visualizando         │
│                                         │
└─────────────────────────────────────────┘
```

### Logica de Validacao nos Hooks

```typescript
// Em useCreateEarningOffline e similares
const { canAddEntry, remainingEntries } = useSubscriptionContext();

if (!canAddEntry) {
  throw new Error('Limite de registros atingido. Faca upgrade para PRO.');
}
```

### Invalidacao de Queries

Apos cada registro criado, invalidar a query `monthlyEntryCount` para atualizar o contador em tempo real.

---

## Comportamento Esperado

### Usuario com 0-23 registros (Normal)
- Contador visivel mas discreto
- Formularios funcionam normalmente
- Sem alertas intrusivos

### Usuario com 24-29 registros (Alerta)
- Banner amarelo aparece
- Mensagem: "Voce esta chegando ao limite do plano gratuito"
- Botao de upgrade disponivel
- Formularios ainda funcionam

### Usuario com 30 registros (Bloqueio)
- Banner vermelho de bloqueio
- Formularios desabilitados
- Overlay de bloqueio com CTA de upgrade
- Dados existentes permanecem visiveis e acessiveis
- Nao impede login ou navegacao

---

## Ordem de Implementacao

1. Atualizar `EntryLimitBanner.tsx` com novas variantes
2. Criar `EntryLimitBlocker.tsx` para overlay de bloqueio
3. Integrar validacao no `EarningForm.tsx`
4. Integrar validacao no `ExpenseForm.tsx`
5. Integrar validacao no `ShiftForm.tsx`
6. Integrar validacao no `QuickEntry.tsx`
7. Adicionar banner na pagina `Add.tsx`
8. Adicionar indicador global no `AppLayout.tsx`
9. Adicionar validacao nos hooks offline
10. Testar fluxo completo

---

## Resultado Esperado

- Usuarios free verao claramente quantos registros usaram
- Alertas progressivos incentivam upgrade sem ser agressivo
- Bloqueio so ocorre quando limite atingido
- Dados nunca sao apagados ou bloqueados
- Fluxo de upgrade e claro e acessivel

