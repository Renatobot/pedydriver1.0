
# Sistema de Notificações Push pelo Painel Admin (Completo)

## Resumo

Sistema completo para o administrador enviar notificações push para usuários, com três modos de envio:

1. **Envio Imediato**: Notificação única enviada na hora
2. **Agendamento Único**: Envio programado para data/hora específica
3. **Agendamento Recorrente**: Envio automático repetido (diário, semanal, mensal)

## Arquitetura de Agendamento

```text
TIPOS DE AGENDAMENTO
────────────────────────────────────────────────────────────────

1. ENVIO IMEDIATO
   ┌─────────────┐
   │ Admin clica │──────> Edge Function ──────> Push enviado
   │ "Enviar"    │          imediatamente
   └─────────────┘

2. AGENDAMENTO ÚNICO
   ┌─────────────┐       ┌──────────────────┐       ┌──────────┐
   │ Admin agenda│──────>│ scheduled_notif. │──────>│ Cron job │
   │ 10/02 às 9h │       │ status: pending  │       │ processa │
   └─────────────┘       └──────────────────┘       └──────────┘

3. AGENDAMENTO RECORRENTE
   ┌─────────────┐       ┌──────────────────┐       ┌──────────┐
   │ Admin cria  │──────>│ recurring_notif. │──────>│ Cron job │
   │ recorrência │       │ next_run_at      │       │ diário   │
   └─────────────┘       └──────────────────┘       └──────────┘
                                  │
                                  └──────> Recalcula próximo envio
                                           após cada execução
```

## Banco de Dados

### Tabela: `push_templates`
Templates de mensagens prontas para uso rápido.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| name | text | Nome do template ("Sentimos sua falta") |
| title | text | Título da notificação |
| body | text | Corpo da mensagem |
| icon | text | Emoji/ícone opcional |
| url | text | URL ao clicar (ex: /quick-entry) |
| is_active | boolean | Se está disponível para uso |
| created_at | timestamptz | Data de criação |

### Tabela: `scheduled_notifications`
Notificações agendadas para envio único.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| title | text | Título |
| body | text | Corpo |
| target_type | text | 'all', 'pro', 'free', 'inactive', 'user' |
| target_user_id | uuid | ID específico (se target_type = 'user') |
| inactive_days | int | Dias de inatividade (se target_type = 'inactive') |
| scheduled_at | timestamptz | Data/hora para envio |
| status | text | 'pending', 'sent', 'failed', 'cancelled' |
| sent_count | int | Envios bem-sucedidos |
| created_by | uuid | Admin que criou |
| created_at | timestamptz | Criação |
| sent_at | timestamptz | Quando foi enviado |

### Tabela: `recurring_notifications` (NOVA)
Notificações recorrentes com frequência configurável.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| name | text | Nome identificador ("Lembrete diário 20h") |
| title | text | Título da notificação |
| body | text | Corpo da mensagem |
| target_type | text | 'all', 'pro', 'free', 'inactive' |
| inactive_days | int | Dias de inatividade (se aplicável) |
| frequency | text | 'daily', 'weekly', 'monthly' |
| time_of_day | time | Horário do envio (ex: 20:00) |
| days_of_week | int[] | Dias da semana [0-6] (dom=0, seg=1...) |
| day_of_month | int | Dia do mês [1-31] |
| timezone | text | Fuso horário (default: America/Sao_Paulo) |
| is_active | boolean | Se está ativo |
| last_run_at | timestamptz | Último envio |
| next_run_at | timestamptz | Próximo envio calculado |
| total_sent | int | Total de notificações enviadas |
| created_by | uuid | Admin que criou |
| created_at | timestamptz | Criação |
| updated_at | timestamptz | Última atualização |

### Tabela: `push_send_logs`
Histórico de todos os envios para auditoria.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| notification_id | uuid | Ref à scheduled (opcional) |
| recurring_id | uuid | Ref à recurring (opcional) |
| title | text | Título enviado |
| body | text | Corpo enviado |
| target_type | text | Tipo de alvo |
| total_recipients | int | Total de destinatários |
| success_count | int | Sucessos |
| failure_count | int | Falhas |
| sent_by | uuid | Admin (ou 'system' para cron) |
| sent_at | timestamptz | Data/hora do envio |

## Interface do Admin

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Admin > Notificações Push                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Tab: Enviar] [Tab: Agendadas] [Tab: Recorrentes] [Tab: Histórico] │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  Templates Rápidos:                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │🚗 Falta │ │🎁 Promo │ │📢 Nova  │ │💰 Regist│ │✨ Custom│      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                                     │
│  Título: [Oi, sentimos sua falta!_________________________]        │
│                                                                     │
│  Mensagem:                                                          │
│  [Faz tempo que você não registra...                      ]         │
│                                                                     │
│  Destinatários:                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ○ Todos com push (87 usuários)                           │      │
│  │ ○ Usuários PRO (23 usuários)                             │      │
│  │ ○ Usuários Gratuitos (64 usuários)                       │      │
│  │ ○ Inativos há [30▼] dias (12 usuários)                   │      │
│  │ ○ Usuário específico: [Buscar...]                        │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  Quando enviar?                                                     │
│  ○ Enviar agora                                                     │
│  ○ Agendar uma vez: [05/02/2026] às [09:00]                        │
│  ○ Agendar recorrente ↓                                             │
│    ┌────────────────────────────────────────────────────────┐      │
│    │ Frequência: [Diário ▼]                                 │      │
│    │                                                        │      │
│    │ ┌─ Diário ─────────────────────────────────────────┐  │      │
│    │ │ Horário: [20:00]                                  │  │      │
│    │ └───────────────────────────────────────────────────┘  │      │
│    │                                                        │      │
│    │ ┌─ Semanal ────────────────────────────────────────┐  │      │
│    │ │ Horário: [09:00]                                  │  │      │
│    │ │ Dias: ☑Seg ☑Ter ☐Qua ☐Qui ☑Sex ☐Sáb ☐Dom        │  │      │
│    │ └───────────────────────────────────────────────────┘  │      │
│    │                                                        │      │
│    │ ┌─ Mensal ─────────────────────────────────────────┐  │      │
│    │ │ Horário: [10:00]                                  │  │      │
│    │ │ Dia do mês: [1 ▼] (primeiro dia)                 │  │      │
│    │ └───────────────────────────────────────────────────┘  │      │
│    └────────────────────────────────────────────────────────┘      │
│                                                                     │
│                 [Pré-visualizar]  [Enviar] [Agendar] [Criar Recorr.]│
└─────────────────────────────────────────────────────────────────────┘
```

### Tab: Recorrentes

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Notificações Recorrentes                              [+ Nova]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 🔄 Lembrete diário noturno                         [ON]  [⋮] │ │
│  │ "Hora de registrar seus ganhos!"                              │ │
│  │ Todos os dias às 20:00 → Próximo: hoje 20:00                  │ │
│  │ 📊 Enviados: 127 | Última execução: ontem 20:00              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 🔄 Incentivo de fim de semana                      [ON]  [⋮] │ │
│  │ "Finais de semana rendem mais!"                               │ │
│  │ Sex, Sáb às 08:00 → Próximo: sex 08:00                        │ │
│  │ 📊 Enviados: 34 | Última execução: sáb passado               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 🔄 Resumo mensal                                   [OFF] [⋮] │ │
│  │ "Veja como foi seu mês!"                                      │ │
│  │ Dia 1 de cada mês às 09:00 → Próximo: 01/03                   │ │
│  │ 📊 Enviados: 2 | Última execução: 01/02                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Edge Functions

### `send-admin-notification` (Nova)
Envia notificações imediatas ou processa agendadas/recorrentes.

```text
POST /send-admin-notification

Body (envio imediato):
{
  "title": "string",
  "body": "string",
  "targetType": "all" | "pro" | "free" | "inactive" | "user",
  "targetUserId": "uuid (opcional)",
  "inactiveDays": "number (opcional)"
}

Response:
{
  "success": true,
  "sent": 45,
  "failed": 2,
  "total": 47
}
```

### `process-scheduled-notifications` (Nova)
Cron job para processar notificações agendadas e recorrentes.

```text
Executado a cada minuto via pg_cron:

1. Busca scheduled_notifications com:
   - status = 'pending'
   - scheduled_at <= now()
   
2. Busca recurring_notifications com:
   - is_active = true
   - next_run_at <= now()
   
3. Para cada item:
   - Envia notificações aos destinatários
   - Atualiza status/contadores
   - Para recorrentes: calcula e atualiza next_run_at
```

### Lógica de cálculo de `next_run_at`:

```text
FREQUENCY = 'daily':
  next_run_at = today + 1 day + time_of_day

FREQUENCY = 'weekly':
  next_run_at = próximo dia em days_of_week[] + time_of_day
  
FREQUENCY = 'monthly':
  next_run_at = próximo mês no day_of_month + time_of_day
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Migrations** | | |
| `create_push_tables.sql` | Criar | Tabelas push_templates, scheduled/recurring_notifications, push_send_logs |
| **Edge Functions** | | |
| `supabase/functions/send-admin-notification/index.ts` | Criar | Envio imediato manual |
| `supabase/functions/process-scheduled-notifications/index.ts` | Criar | Cron para agendadas/recorrentes |
| **Páginas** | | |
| `src/pages/admin/AdminNotifications.tsx` | Criar | Página principal com tabs |
| **Componentes** | | |
| `src/components/admin/NotificationTemplates.tsx` | Criar | Grid de templates clicáveis |
| `src/components/admin/NotificationForm.tsx` | Criar | Form com destinatários e agendamento |
| `src/components/admin/RecurringNotificationCard.tsx` | Criar | Card de notificação recorrente |
| `src/components/admin/RecurringNotificationsList.tsx` | Criar | Lista de recorrentes com toggle |
| `src/components/admin/ScheduledNotificationsList.tsx` | Criar | Lista de agendadas com ações |
| `src/components/admin/NotificationHistory.tsx` | Criar | Histórico de envios |
| **Hooks** | | |
| `src/hooks/useAdminNotifications.tsx` | Criar | CRUD templates, scheduled, recurring |
| **Layout** | | |
| `src/components/admin/AdminLayout.tsx` | Modificar | Adicionar item "Notificações" na sidebar |

## Templates Prontos

| Nome | Titulo | Mensagem |
|------|--------|----------|
| Sentimos sua falta | Oi, sentimos sua falta! | Faz tempo que você não registra seus ganhos. Volte e mantenha seu controle em dia! |
| Promoção PRO | Oferta especial PRO! | Por tempo limitado: assine o PRO com desconto. Não perca! |
| Novidade | Novidade no PEDY! | Acabamos de lançar uma funcionalidade nova. Venha conferir! |
| Lembrete | Registre seus ganhos! | Não esqueça de registrar os ganhos de hoje. Leva menos de 1 minuto! |
| Atualização | Atualize seu app! | Uma nova versão está disponível com melhorias importantes. |

## Segurança

- Todas as operações validam `is_admin()` via RLS e/ou Edge Function
- RLS policies restritivas em todas as tabelas de notificações
- Logs completos em `push_send_logs` e `admin_logs`
- Rate limiting: máximo 5 envios em massa por hora (prevenção de spam)

## Fluxo Completo

```text
ADMIN CRIA RECORRÊNCIA DIÁRIA
────────────────────────────────────────────────────────────────

1. Admin acessa /admin/notifications
2. Seleciona template "Lembrete"
3. Escolhe destinatários: "Todos com push"
4. Marca "Agendar recorrente" → "Diário" → 20:00
5. Clica "Criar Recorrência"

6. Sistema salva em recurring_notifications:
   - frequency: 'daily'
   - time_of_day: '20:00'
   - next_run_at: hoje 20:00 (ou amanhã se já passou)
   - is_active: true

7. Cron job (a cada minuto) verifica:
   - next_run_at <= now()? → Sim!
   - Envia para todos os endpoints em user_push_subscriptions
   - Atualiza next_run_at = tomorrow 20:00
   - Incrementa total_sent
   - Registra em push_send_logs

8. Admin pode ver na aba "Recorrentes":
   - Toggle para pausar/ativar
   - Editar horário/frequência
   - Ver estatísticas de envio
   - Excluir recorrência
```
