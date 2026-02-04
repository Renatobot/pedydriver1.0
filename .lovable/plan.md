
# Plano de Melhorias e Correções - Round 2

## Resumo Executivo

Após análise detalhada do código, banco de dados e arquitetura, identifiquei **4 bugs/problemas**, **5 oportunidades de performance** e **6 melhorias de UX**.

---

## BUGS E PROBLEMAS IDENTIFICADOS

### 1. Conflito de OnConflict no useUserPush
**Problema:** Na linha 186 do `useUserPush.tsx`:
```typescript
onConflict: 'user_id,endpoint'
```
Porém, a constraint UNIQUE que adicionamos na última correção é apenas em `endpoint`, não em `(user_id, endpoint)`.

**Impacto:** O upsert pode falhar silenciosamente ou criar comportamento inesperado.

**Solução:** Atualizar o onConflict para usar apenas `'endpoint'` que corresponde à constraint existente.

---

### 2. Hook useNotificationReminder Duplicado/Obsoleto
**Problema:** Existem dois hooks para gerenciar lembretes:
- `useNotificationReminder.tsx` - Usa localStorage e Notification API local
- `useUserPush.tsx` - Usa banco de dados e push via Service Worker

O `useNotificationReminder` está obsoleto mas ainda importado em alguns lugares, causando confusão.

**Solução:** Remover `useNotificationReminder.tsx` e garantir que só `useUserPush` é usado.

---

### 3. PWA Update - Dismiss Não Persiste
**Problema:** Quando o usuário clica em "Depois" no prompt de atualização, o estado `showUpdatePrompt` volta a `false` mas na próxima renderização pode aparecer novamente se `needRefresh` ainda for `true`.

**Solução:** Persistir o dismiss no localStorage com timestamp e só mostrar novamente após X horas.

---

### 4. canUsePlatform Sempre Retorna True
**Problema:** No `SubscriptionContext.tsx` (linha 46-48):
```typescript
const canUsePlatform = (_platformId: string): boolean => {
  return true;
};
```
Esta função está desativada, permitindo que usuários free usem plataformas além do limite.

**Solução:** Implementar a lógica correta para validar limites de plataforma.

---

## MELHORIAS DE PERFORMANCE

### 5. Múltiplas Queries no Dashboard
**Problema:** O Dashboard faz 5+ queries separadas ao carregar:
- useEarnings
- useExpenses  
- useShifts
- useUserSettings
- usePlatforms

**Melhoria:** Criar uma RPC function `get_dashboard_data` que retorna tudo em uma única chamada.

---

### 6. Refetch Excessivo em Notificações
**Problema:** `useUserNotifications` refetcha a cada 30s e `useUnreadNotificationsCount` a cada 15s, mesmo quando não há mudanças.

**Melhoria:** Usar Realtime subscription ao invés de polling, reduzindo carga no servidor.

---

### 7. Gamification Stats - Query a Cada Load
**Problema:** `useGamification` sempre busca stats e achievements, mesmo que não tenham mudado.

**Melhoria:** Adicionar `staleTime` maior e invalidar apenas após ações específicas.

---

### 8. Imagens do Logo - Múltiplas Variantes
**Observação:** Existem várias variantes do logo (webp, png, 3d, optimized, etc.) que ocupam espaço. Algumas parecem não ser usadas.

**Melhoria:** Auditar e remover assets não utilizados.

---

### 9. processRecurringExpenses no Dashboard
**Problema:** A função `processRecurring.mutate()` é chamada toda vez que o Dashboard monta, mesmo se já processou hoje.

**Melhoria:** Adicionar verificação de data para não processar múltiplas vezes por dia.

---

## MELHORIAS DE UX

### 10. Filtros no Histórico de Notificações (Admin)
**Problema:** O histórico não tem filtros, dificultando a análise.

**Melhoria:** Adicionar filtros por:
- Período (hoje, 7 dias, 30 dias)
- Tipo de destinatário
- Status (sucesso/falha)

---

### 11. Feedback Visual ao Salvar Corrida
**Problema:** O QuickEntryForm apenas mostra um toast após salvar. O usuário pode não perceber.

**Melhoria:** Adicionar animação de confetti ou feedback visual mais impactante.

---

### 12. Mostrar Último Horário de Atualização
**Problema:** O usuário não sabe quando os dados foram atualizados pela última vez.

**Melhoria:** Adicionar "Atualizado há X minutos" no Dashboard.

---

### 13. Skeleton Loading Inconsistente
**Problema:** Alguns componentes têm skeleton, outros não (ex: NotificationBell já foi corrigido).

**Melhoria:** Garantir que todos os componentes com carregamento tenham skeleton.

---

### 14. Empty State Melhor no Histórico
**Problema:** Quando não há dados, o histórico mostra apenas texto simples.

**Melhoria:** Adicionar ilustração e CTA para criar primeiro registro.

---

### 15. Rate Limiting para Push (Admin)
**Problema:** Não há limite de quantas notificações podem ser enviadas por hora/dia.

**Melhoria:** Implementar rate limiting para evitar spam acidental.

---

## Seção Técnica - Implementações Propostas

### Prioridade Alta

1. **Fix onConflict useUserPush**
```typescript
// Linha 186 de useUserPush.tsx
.upsert({...}, { onConflict: 'endpoint' })
```

2. **Fix canUsePlatform no SubscriptionContext**
```typescript
const canUsePlatform = (platformId: string): boolean => {
  if (isPro) return true;
  return usedPlatformIds.includes(platformId) || userPlatformCount < limits.maxPlatforms;
};
```

3. **Persistir dismiss do PWA Update**
```typescript
// Em usePWAUpdate.tsx
const DISMISS_DURATION = 6 * 60 * 60 * 1000; // 6 horas

const dismissUpdate = useCallback(() => {
  localStorage.setItem('pwa_update_dismissed', Date.now().toString());
  setShowUpdatePrompt(false);
}, []);

// Ao verificar se deve mostrar:
const dismissedAt = localStorage.getItem('pwa_update_dismissed');
const shouldShow = !dismissedAt || (Date.now() - parseInt(dismissedAt)) > DISMISS_DURATION;
```

### Prioridade Média

4. **Otimizar refetch de notificações com Realtime**
```typescript
// Usar channel subscription ao invés de polling
useEffect(() => {
  const channel = supabase
    .channel('user_notifications')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'user_notifications',
      filter: `user_id=eq.${user?.id}`
    }, () => {
      queryClient.invalidateQueries(['userNotifications']);
    })
    .subscribe();
    
  return () => { channel.unsubscribe(); };
}, [user?.id]);
```

5. **Adicionar filtros no histórico de notificações**
- Componente de filtro por período
- Componente de filtro por status
- Query com parâmetros de filtro

### Prioridade Baixa

6. **Remover useNotificationReminder.tsx** (arquivo obsoleto)

7. **Adicionar staleTime ao useGamification**
```typescript
staleTime: 5 * 60 * 1000, // 5 minutos
```

8. **Verificar processRecurringExpenses por data**
```typescript
const LAST_PROCESSED_KEY = 'recurring_expenses_last_processed';
const today = format(new Date(), 'yyyy-MM-dd');
const lastProcessed = localStorage.getItem(LAST_PROCESSED_KEY);
if (lastProcessed !== today) {
  processRecurring.mutate();
  localStorage.setItem(LAST_PROCESSED_KEY, today);
}
```

---

## Resumo das Ações

| Prioridade | Ação | Tipo | Impacto |
|------------|------|------|---------|
| Alta | Fix onConflict useUserPush | Bug | Corrige falha de upsert |
| Alta | Fix canUsePlatform | Bug | Corrige limite de plataformas |
| Alta | Persistir dismiss PWA update | Bug | Evita prompt repetitivo |
| Média | Realtime para notificações | Performance | Reduz polling |
| Média | Filtros histórico admin | UX | Facilita análise |
| Média | staleTime gamification | Performance | Menos queries |
| Baixa | Remover hook obsoleto | Cleanup | Código limpo |
| Baixa | Verificar recurring por data | Performance | Evita reprocessamento |
| Baixa | Feedback visual QuickEntry | UX | Melhor experiência |
