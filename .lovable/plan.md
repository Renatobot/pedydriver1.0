
# Plano: Validação de Indicação Diferida (Anti-Fraude Avançada)

## Visão Geral

Ao invés de validar a indicação imediatamente no cadastro, o sistema vai:
1. Registrar a indicação como "pendente" quando o usuário se cadastra
2. Monitorar se o usuário faz ações reais no app (configura veículo, registra ganhos, etc.)
3. Validar a indicação automaticamente após critérios serem cumpridos
4. Mostrar o card "Indique Amigos" apenas 2 dias após o cadastro

---

## Por Que Isso Melhora a Segurança?

| Antes | Depois |
|-------|--------|
| Usuário cria conta → ganha PRO imediato | Usuário cria conta → precisa usar o app → ganha PRO |
| Fraudador cria 10 contas = 70 dias PRO | Fraudador teria que usar 10 contas por dias = muito trabalho |
| Fingerprint era a única proteção | Fingerprint + atividade + tempo = 3 camadas |

---

## Critérios para Validar a Indicação

O usuário indicado precisa cumprir **pelo menos 2** destes critérios:

| Critério | Tabela | Verificação |
|----------|--------|-------------|
| Configurou veículo | `user_settings` | `vehicle_type` foi alterado (não é o default) |
| Registrou 1+ ganho | `earnings` | Existe pelo menos 1 registro |
| Registrou 1+ despesa | `expenses` | Existe pelo menos 1 registro |
| Completou 1+ turno | `shifts` | Existe pelo menos 1 registro |

**E** o cadastro deve ter pelo menos **24 horas**.

---

## Mostrar Card de Indicação

O card "Indique e Ganhe" nas Configurações só aparece se:
- Conta tem mais de **48 horas** (2 dias)
- OU o usuário já indicou alguém com sucesso antes

Isso evita que fraudadores vejam/usem o sistema de indicação cedo demais.

---

## Fluxo Atualizado

```text
1. Indicado acessa ?ref=ABC123
          │
          ▼
2. Faz cadastro normal
          │
          ▼
3. Sistema armazena indicação como "PENDENTE"
   (não valida, não dá bônus ainda)
          │
          ▼
4. Usuário usa o app normalmente
   - Configura veículo
   - Registra ganhos/despesas
          │
          ▼
5. Após 24h, sistema verifica automaticamente:
   - 2+ critérios cumpridos?
   - Fingerprint ainda diferente?
          │
   ├─── SIM → Indicação validada ✓
   │         Ambos ganham 7 dias PRO
   │
   └─── NÃO → Mantém pendente
              (verifica novamente depois)
          │
          ▼
6. Após 48h, card "Indique Amigos" aparece
```

---

## Alterações Técnicas

### 1. Nova Tabela: Tracking de Progresso da Indicação

```sql
ALTER TABLE referrals ADD COLUMN 
  validation_criteria_met JSONB DEFAULT '{}';

-- Exemplo: {"vehicle_set": true, "earnings_count": 3, "checked_at": "2026-02-03"}
```

### 2. Modificar: `Auth.tsx`

- Remover validação automática imediata
- Apenas armazenar o código e fingerprint
- Criar registro "pendente" sem dar bônus

### 3. Nova Função SQL: `check_pending_referrals()`

Função que:
1. Busca indicações pendentes com mais de 24h
2. Verifica critérios de atividade para cada uma
3. Se critérios cumpridos → valida e aplica bônus
4. Pode ser chamada via CRON ou ao fazer login

### 4. Modificar: `ReferralCard.tsx`

- Adicionar verificação de tempo desde cadastro
- Ocultar se conta tem menos de 48h
- Mostrar mensagem explicativa se indicação está pendente

### 5. Modificar: `useReferral.tsx`

- Remover validação imediata no cadastro
- Adicionar função para verificar status da indicação
- Mostrar progresso para o indicado ("Faltam 2 ações para ativar sua indicação")

### 6. Novo: Banner de progresso para indicados

Se o usuário foi indicado mas ainda não validou:
- Mostrar progresso das ações necessárias
- "Complete 2 ações para ativar seu bônus de 7 dias PRO!"

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Remover validação imediata, criar referral pendente |
| `src/hooks/useReferral.tsx` | Adicionar lógica de verificação diferida e progresso |
| `src/hooks/useAuth.tsx` | Chamar verificação de indicação pendente ao fazer login |
| `src/components/settings/ReferralCard.tsx` | Ocultar card se conta < 48h |
| `supabase/migrations/...` | Adicionar função `check_pending_referrals` e `register_pending_referral` |

---

## Experiência do Usuário Indicado

### No Cadastro
- Continua vendo o banner "Você foi indicado! Ganhe 7 dias PRO"
- Cadastra normalmente

### Nos Primeiros 2 Dias
- Não vê o card "Indique Amigos"
- Vê mini-banner: "Complete ações para ativar seu bônus de indicação"
  - ✅ Configurou veículo
  - ⬜ Registre 1 ganho
  - ⬜ Registre 1 despesa ou turno

### Após Validação
- Toast: "🎉 Indicação confirmada! 7 dias de PRO ativados!"
- Notificação para o indicador também

### Após 48h
- Card "Indique Amigos" aparece normalmente

---

## Vantagens desta Abordagem

1. **Mais difícil fraudar**: Criar conta fake não basta, precisa usar o app
2. **Usuários reais beneficiados**: Quem realmente usa ganha o bônus
3. **Sem fricção extra**: Não precisa confirmar email/SMS
4. **Transparente**: Usuário vê o progresso e sabe o que fazer
5. **Combinação de proteções**: Tempo + Fingerprint + Atividade

---

## Resultado Esperado

- Fraudadores desistirão (muito trabalho para pouco ganho)
- Usuários legítimos ganham bônus após 1-2 dias de uso normal
- Sistema de indicação funciona de forma justa e sustentável
