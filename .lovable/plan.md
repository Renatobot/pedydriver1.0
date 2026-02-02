

# Plano: Corrigir Ativação Automática do Plano PRO

## Problemas Identificados

1. **URL de redirecionamento errada no InfinitePay**: O checkout está redirecionando para `/dashboard` ao invés de `/payment-success`
2. **Webhook não consegue vincular pagamento**: O InfinitePay não envia email do cliente no webhook, então depende de encontrar um `payment_intent` recente
3. **Nova aba quebra o fluxo**: O checkout abre em nova aba (`window.open`), então quando o usuário volta, precisa de um mecanismo para verificar e vincular o pagamento

---

## Solução Proposta

Implementar um sistema de **"claim" (reivindicação)** de pagamento que funciona assim:

```text
Usuario clica "Assinar"
        ↓
Cria payment_intent (user_id, email, plan_type)
        ↓
Abre checkout InfinitePay (nova aba)
        ↓
    [Pagamento feito]
        ↓
    ┌─────────────────────────────────────────────┐
    │ Webhook recebe pagamento                    │
    │   → Tenta encontrar payment_intent recente  │
    │   → Se encontrar: ativa automaticamente     │
    │   → Se não: salva em pending_payments       │
    └─────────────────────────────────────────────┘
        ↓
Usuário é redirecionado para /payment-success
        ↓
    ┌─────────────────────────────────────────────┐
    │ Página payment-success tenta "claim"        │
    │   → Chama edge function claim-payment       │
    │   → Verifica pending_payments recentes      │
    │   → Vincula ao usuário logado               │
    │   → Ativa plano PRO                         │
    └─────────────────────────────────────────────┘
```

---

## Etapas de Implementação

### Etapa 1: Configuração no InfinitePay

**Ação do usuário (você):**
- No painel da InfinitePay, configure a URL de retorno/sucesso dos dois checkouts para:

  `https://pedydriver.lovable.app/payment-success`

---

### Etapa 2: Criar Edge Function `claim-payment`

Nova função que permite ao usuário "reivindicar" um pagamento pendente:

- Recebe o token JWT do usuário logado
- Busca pagamentos em `pending_payments` das últimas 2 horas
- Filtra por valor (R$ 14,90 = mensal, R$ 99 = anual)
- Vincula ao usuário e ativa o plano PRO
- Retorna sucesso ou "pagamento não encontrado"

---

### Etapa 3: Atualizar PaymentSuccess.tsx

Modificar a página para:

1. **Ao carregar**, chamar a função `claim-payment`
2. Se o pagamento for vinculado com sucesso, mostrar "Plano ativado!"
3. Se não encontrar pagamento, continuar fazendo polling da subscription
4. Após 30 segundos sem ativação, mostrar mensagem para contatar suporte

---

### Etapa 4: Melhorar o Webhook

Ajustar o webhook para:

1. Aumentar janela de busca de payment_intent para 2 horas
2. Melhorar matching por valor do pagamento
3. Criar log mais detalhado para debug

---

## Seção Técnica

### Edge Function: claim-payment

```typescript
// supabase/functions/claim-payment/index.ts
// Busca pending_payments das últimas 2h
// Verifica se já não foi vinculado
// Atualiza subscriptions para plan='pro'
// Marca pending_payment como 'claimed'
```

### PaymentSuccess.tsx - Lógica de Claim

```typescript
useEffect(() => {
  const claimPayment = async () => {
    // Primeiro tenta chamar claim-payment
    const { data } = await supabase.functions.invoke('claim-payment');
    
    if (data?.success) {
      setIsActivated(true);
      // Invalidar cache do react-query
    }
  };
  
  claimPayment();
}, [user]);
```

### Arquivos a serem modificados/criados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/claim-payment/index.ts` | Criar |
| `supabase/config.toml` | Adicionar nova função |
| `src/pages/PaymentSuccess.tsx` | Modificar para chamar claim |
| `supabase/functions/infinitepay-webhook/index.ts` | Ajustar janela de tempo |

---

## Ação Necessária do Usuário

Antes de aprovar este plano, você precisa:

1. **Acessar o painel da InfinitePay**
2. **Editar os dois checkouts** (mensal e anual)
3. **Configurar a URL de retorno** para: `https://pedydriver.lovable.app/payment-success`

Depois de fazer isso, clique em "Approve" para eu implementar as mudanças no código.

