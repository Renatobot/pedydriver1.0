
# Plano: Limite de 90 Dias Acumulados por Indicação

## Visão Geral

Implementar um limite máximo de **90 dias de PRO** que podem ser acumulados através de indicações. Quando o usuário atingir esse limite, ele recebe uma notificação amigável incentivando-o a continuar indicando para manter o PRO ativo.

---

## Lógica do Limite

| Situação | Comportamento |
|----------|---------------|
| Total acumulado < 90 dias | Aplica bônus normalmente |
| Total acumulado = 90 dias | Notifica: "Continue indicando para manter seu PRO ativo sempre" |
| Expiração começa a acontecer | Novas indicações passam a contar novamente |

O limite é **dinâmico**: quando os dias começam a expirar, o usuário pode acumular novamente através de novas indicações.

---

## O Que Será Feito

### 1. Modificar Função `check_pending_referrals`

Antes de aplicar o bônus, verificar quanto o indicador já acumulou:

```sql
-- Calcular dias restantes de PRO por indicação
SELECT expires_at - NOW() as days_remaining
FROM subscriptions
WHERE user_id = referrer_id;

-- Se days_remaining >= 90 dias:
--   Não adiciona mais dias
--   Marca indicação como completed
--   Cria notificação especial
```

### 2. Nova Coluna na Tabela `referrals`

Adicionar campo para rastrear se o bônus foi aplicado ou não:

```sql
ALTER TABLE referrals ADD COLUMN bonus_applied BOOLEAN DEFAULT true;
```

Isso permite indicações válidas mesmo quando limite foi atingido.

### 3. Notificações Personalizadas

| Cenário | Notificação para Indicador |
|---------|---------------------------|
| Bônus aplicado normalmente | "Seu amigo ativou a indicação. +7 dias PRO!" |
| Limite de 90 dias atingido | "Indicação confirmada! Continue indicando para manter seu PRO ativo sempre." |

### 4. Atualizar UI do `ReferralCard`

Mostrar informação quando próximo ou no limite:

```text
┌─────────────────────────────────────────────┐
│  📊 Seu PRO expira em 85 dias               │
│  ⚡ Continue indicando para manter ativo!   │
└─────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/...` | Atualizar `check_pending_referrals` com lógica de limite |
| `supabase/migrations/...` | Adicionar coluna `bonus_applied` na tabela referrals |
| `supabase/migrations/...` | Atualizar `get_referral_stats` para retornar dias restantes |
| `src/components/settings/ReferralCard.tsx` | Mostrar aviso quando próximo/no limite |
| `src/hooks/useReferral.tsx` | Adicionar campo `daysRemaining` nos dados |

---

## Detalhes Técnicos

### Cálculo do Limite

```sql
-- Dias de PRO restantes oriundos de indicações
v_days_from_referrals := EXTRACT(EPOCH FROM (
  COALESCE(expires_at, NOW()) - NOW()
)) / 86400;

-- Limite de 90 dias
IF v_days_from_referrals >= 90 THEN
  -- Não aplica mais dias ao indicador
  -- Indicado ainda recebe os 7 dias
  v_apply_referrer_bonus := false;
END IF;
```

### Mensagem Persuasiva

Quando o limite é atingido ou o usuário está próximo:

```typescript
// No ReferralCard
{daysRemaining >= 80 && (
  <div className="bg-primary/10 rounded-lg p-3 text-sm">
    <p className="font-medium">
      {daysRemaining >= 90 
        ? "Você atingiu o máximo de 90 dias acumulados!"
        : `Faltam ${90 - daysRemaining} dias para o limite.`
      }
    </p>
    <p className="text-muted-foreground text-xs mt-1">
      Continue indicando para manter seu PRO ativo sempre.
    </p>
  </div>
)}
```

---

## Experiência do Usuário

### Indicador com Espaço para Acumular
- Recebe os 7 dias normalmente
- Vê contador atualizado

### Indicador Próximo do Limite (80-89 dias)
- Recebe os 7 dias (ou parcial até 90)
- Vê aviso: "Continue indicando para manter seu PRO ativo sempre"

### Indicador no Limite (90+ dias)
- Indicação é registrada como válida
- Indicado recebe os 7 dias normalmente
- Indicador recebe notificação:
  - "Indicação confirmada! Continue indicando para manter seu PRO ativo sempre."
- Quando seus dias começarem a expirar, novas indicações voltam a contar

---

## Resultado Esperado

- Limite justo de 90 dias evita acúmulo infinito
- Indicador sabe que precisa continuar indicando para manter benefício
- Indicado sempre recebe seu bônus (não é penalizado)
- Mensagem persuasiva incentiva engajamento contínuo
- Sistema se "reseta" naturalmente conforme dias expiram
