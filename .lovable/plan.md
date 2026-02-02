

# Plano: Corrigir Vulnerabilidade de Race Condition no Sistema de Pagamentos

## Problema Identificado

O sistema atual tem uma falha crítica: quando múltiplos usuários fazem upgrade simultaneamente, um pagamento pode ser vinculado ao usuário errado.

### Cenários de Erro

```text
Cenário 1 - Webhook vincula usuário errado:
┌─────────────────────────────────────────────────────┐
│ 10:00:01 - Usuário A clica "Assinar" (cria intent)  │
│ 10:00:02 - Usuário B clica "Assinar" (cria intent)  │
│ 10:00:05 - Pagamento do Usuário A chega no webhook  │
│                                                     │
│ Webhook busca: .limit(1).order(desc)                │
│ → Encontra intent do Usuário B (mais recente!)      │
│ → Ativa PRO para Usuário B (ERRADO!)                │
└─────────────────────────────────────────────────────┘

Cenário 2 - Claim vincula pagamento errado:
┌─────────────────────────────────────────────────────┐
│ 10:00:01 - Pagamento do Usuário A vai para pending  │
│ 10:00:02 - Pagamento do Usuário B vai para pending  │
│ 10:00:03 - Usuário B acessa /payment-success        │
│                                                     │
│ Claim busca: pending_payments das últimas 2h        │
│ → Encontra pagamento do Usuário A (qualquer um!)    │
│ → Ativa PRO para Usuário B com pagamento de A       │
└─────────────────────────────────────────────────────┘
```

---

## Solução: Sistema de Token Único

Criar um identificador único que acompanha todo o fluxo de pagamento, garantindo vínculo 1:1 entre pagamento e usuário.

### Fluxo Corrigido

```text
Usuário clica "Assinar"
        ↓
Cria payment_intent com token único (UUID)
        ↓
Abre checkout InfinitePay
        ↓
    [Pagamento feito]
        ↓
Webhook recebe pagamento
        ↓
Salva em pending_payments COM o valor do pagamento
        ↓
Usuário é redirecionado para /payment-success
        ↓
    ┌─────────────────────────────────────────────┐
    │ claim-payment agora:                        │
    │   1. Busca payment_intent DO PRÓPRIO USER   │
    │   2. Usa valor do intent para match         │
    │   3. Valida que amount bate                 │
    │   4. Só então ativa o plano                 │
    └─────────────────────────────────────────────┘
```

---

## Mudanças Necessárias

### 1. Modificar `claim-payment` Edge Function

**Problema atual:** Busca qualquer `pending_payment` das últimas 2h sem filtrar por usuário.

**Solução:**
- Primeiro buscar o `payment_intent` do próprio usuário
- Usar o `plan_type` do intent para determinar o valor esperado
- Filtrar `pending_payments` pelo valor exato do plano
- Adicionar validação de tempo mais restrita (15 minutos)

```typescript
// Antes (vulnerável):
const { data: pendingPayments } = await supabase
  .from("pending_payments")
  .select("*")
  .eq("status", "pending")
  .gte("created_at", twoHoursAgo);  // Qualquer pagamento!

// Depois (seguro):
// 1. Primeiro buscar intent do próprio usuário
const { data: userIntent } = await supabase
  .from("payment_intents")
  .select("*")
  .eq("user_id", userId)
  .eq("status", "pending")
  .gte("created_at", fifteenMinutesAgo)
  .order("created_at", { ascending: false })
  .limit(1);

// 2. Determinar valor esperado baseado no plano
const expectedAmount = userIntent.plan_type === 'annual' ? 9900 : 1490;

// 3. Buscar pending_payment com valor exato
const { data: pendingPayments } = await supabase
  .from("pending_payments")
  .select("*")
  .eq("status", "pending")
  .eq("amount", expectedAmount)
  .gte("created_at", fifteenMinutesAgo);
```

### 2. Modificar `infinitepay-webhook` Edge Function

**Problema atual:** Busca qualquer `payment_intent` pendente sem considerar valor.

**Solução:**
- Adicionar filtro por valor na busca do `payment_intent`
- Reduzir janela de tempo de 2h para 15 minutos
- Se não encontrar match exato, salvar como pending para claim posterior

```typescript
// Antes (vulnerável):
const { data: recentIntents } = await supabase
  .from("payment_intents")
  .select("*")
  .eq("status", "pending")
  .limit(1);  // Pega qualquer um!

// Depois (seguro):
// Detectar tipo de plano pelo valor pago
const isAnnual = (paidAmount || amount) >= 9000;
const expectedPlanType = isAnnual ? 'annual' : 'monthly';

const { data: recentIntents } = await supabase
  .from("payment_intents")
  .select("*")
  .eq("status", "pending")
  .eq("plan_type", expectedPlanType)  // Filtrar por tipo
  .gte("created_at", fifteenMinutesAgo)  // Janela menor
  .order("created_at", { ascending: true })  // FIFO - primeiro a pagar
  .limit(1);
```

### 3. Adicionar Coluna `intent_id` em `pending_payments`

Vincular explicitamente um pagamento pendente ao intent que o originou:

```sql
-- Adicionar coluna para rastrear intent original
ALTER TABLE pending_payments 
ADD COLUMN intent_id UUID REFERENCES payment_intents(id);

-- Criar índice para buscas eficientes
CREATE INDEX idx_pending_payments_intent 
ON pending_payments(intent_id);
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `supabase/functions/claim-payment/index.ts` | Buscar intent do usuário primeiro, filtrar por valor |
| `supabase/functions/infinitepay-webhook/index.ts` | Filtrar intent por plan_type, usar FIFO |
| Migração SQL | Adicionar coluna `intent_id` em `pending_payments` |

---

## Validações de Segurança Adicionadas

1. **Vínculo por usuário**: `claim-payment` só considera intents do próprio usuário autenticado
2. **Match por valor**: Pagamento de R$14,90 só pode ativar plano mensal
3. **Janela de tempo menor**: 15 minutos ao invés de 2 horas
4. **Ordem FIFO**: Primeiro intent pendente é pareado com primeiro pagamento (reduz conflitos)
5. **Rastreabilidade**: `intent_id` em `pending_payments` permite auditoria

---

## Matriz de Cenários Após Correção

| Cenário | Antes | Depois |
|---------|-------|--------|
| 2 usuários pagam mensal simultâneo | ❌ Pode cruzar | ✅ Cada um match próprio intent |
| 1 mensal + 1 anual simultâneo | ❌ Pode cruzar | ✅ Valores diferentes, não cruza |
| Usuário paga mas não tinha intent | ❌ Qualquer um reclama | ✅ Vai para pending, admin vincula |
| Intent antigo (>15min) | ❌ Ainda era usado | ✅ Expirado, não é considerado |

