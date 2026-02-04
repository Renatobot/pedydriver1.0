
# Plano: Corrigir Lógica de Limite de Plataformas no Plano Grátis

## Diagnóstico do Bug

O sistema atual está bloqueando plataformas baseado no **histórico total** de uso, quando deveria limitar apenas **quantas plataformas podem ser selecionadas por vez** (no turno atual).

### Lógica Atual (incorreta)
```
userPlatformCount = plataformas distintas já usadas em earnings (ex: 2)
maxPlatforms = 1

canUsePlatform(platformId):
  - Se já usou antes → libera
  - Se não usou e userPlatformCount >= maxPlatforms → BLOQUEIA
```

**Resultado**: Se o usuário já usou 99 Food e Uber antes, só essas duas ficam liberadas. Todas as outras ficam bloqueadas para sempre.

### Lógica Correta
O limite de "1 plataforma" deve significar: "você pode selecionar apenas 1 plataforma por turno", não "você só pode ter 1 plataforma no histórico".

## Solução Proposta

### Opção 1 - Simplificar (Recomendada)
Remover a restrição baseada em histórico. O plano grátis simplesmente limita quantas plataformas podem ser selecionadas **simultaneamente** no momento de iniciar o turno.

**Comportamento:**
- Todas as plataformas ficam disponíveis para seleção
- Ao selecionar 1, as outras ficam bloqueadas até desmarcar
- Usuário pode usar qualquer plataforma, mas apenas 1 por turno

### Opção 2 - Manter Restrição Histórica (mais restritiva)
Se a intenção é que o usuário FREE só possa usar 1 plataforma "para sempre" (mesmo em turnos diferentes), a lógica precisa ser ajustada para deixar isso claro e funcionar corretamente.

## Arquivos a Modificar

### 1. `src/contexts/SubscriptionContext.tsx`
- Modificar `canUsePlatform` para NÃO considerar histórico
- Ou remover completamente a lógica de `usedPlatformIds` se não for mais necessária

### 2. `src/components/shifts/StartShiftModal.tsx`
- Ajustar `isPlatformLocked` para considerar apenas a seleção atual
- Simplificar a lógica: se já selecionou 1 e não é PRO, bloquear as outras

### 3. `src/hooks/useSubscription.tsx`
- Remover ou simplificar `useUsedPlatformIds` e `useUserPlatformCount` se não forem mais usados

## Implementação Detalhada

### Em `StartShiftModal.tsx`
```typescript
const isPlatformLocked = (platformId: string): boolean => {
  if (isPro) return false;
  // Já está selecionado? Nunca bloquear
  if (selectedPlatforms.includes(platformId)) return false;
  // Se já selecionou o máximo, bloquear as outras
  return selectedPlatforms.length >= limits.maxPlatforms;
};
```

### Em `SubscriptionContext.tsx`
```typescript
// Simplificar canUsePlatform - não considerar histórico
const canUsePlatform = (platformId: string): boolean => {
  // Para o modal de turno, a lógica de seleção fica no próprio modal
  // Aqui podemos sempre retornar true ou remover essa função
  return true;
};
```

## Comportamento Esperado Após a Correção

1. Usuário abre "Iniciar Turno"
2. Todas as plataformas aparecem disponíveis
3. Ao selecionar uma (ex: iFood), as outras ficam com cadeado
4. Se desmarcar iFood, pode selecionar qualquer outra
5. Pode iniciar turno com qualquer plataforma, mas apenas 1 por vez
