
# Plano: Implementar Notificações Push para Admin

## Situação Atual

Os **alertas já funcionam** e estão sendo criados corretamente no banco de dados (tabela `admin_alerts`) quando há novos cadastros e upgrades PRO. Porém, eles só aparecem quando o admin abre o painel e visualiza o sino.

O que você precisa é de **notificações push reais** - aquelas que aparecem no celular/computador mesmo quando o navegador está fechado ou em segundo plano.

## Arquitetura da Solução

```text
+-------------------+     +-------------------+     +-------------------+
|   Novo Usuário    |     |   Database        |     |   Edge Function   |
|   se Cadastra     | --> |   Trigger         | --> |   send-admin-push |
+-------------------+     |   (admin_alerts)  |     +-------------------+
                          +-------------------+              |
                                                             v
                          +-------------------+     +-------------------+
                          |   Navegador do    | <-- |   Web Push API    |
                          |   Administrador   |     |   (FCM/VAPID)     |
                          +-------------------+     +-------------------+
```

## O que será implementado

### 1. Nova Tabela: `admin_push_subscriptions`

Armazena as credenciais de push de cada admin inscrito:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| admin_id | UUID | ID do admin (referência) |
| endpoint | TEXT | URL do serviço de push |
| p256dh | TEXT | Chave pública do cliente |
| auth | TEXT | Token de autenticação |
| created_at | TIMESTAMP | Data de inscrição |

### 2. Nova Edge Function: `send-admin-push`

Responsável por enviar a notificação push para todos os admins inscritos:
- Recebe o tipo de evento e dados do alerta
- Busca todas as assinaturas push ativas
- Envia notificação para cada uma usando Web Push API

### 3. Trigger no Banco de Dados

Configurar um Database Webhook que dispara a Edge Function automaticamente quando um novo registro é inserido na tabela `admin_alerts`.

### 4. Interface de Ativação

Adicionar um botão no Dashboard do Admin: **"Ativar Notificações Push"**
- Solicita permissão do navegador
- Registra o Service Worker
- Salva a subscription no banco

### 5. Service Worker Customizado

Arquivo que escuta eventos `push` e exibe a notificação nativa:
- Exibe título, mensagem e ícone do app
- Ao clicar, abre o painel admin

## Configuração Necessária

Será necessário gerar e configurar **chaves VAPID**:
- VAPID_PUBLIC_KEY (usada no frontend)
- VAPID_PRIVATE_KEY (usada na Edge Function)

Essas chaves são geradas uma única vez e ficam no ambiente.

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Nova tabela + trigger para webhook |
| `supabase/functions/send-admin-push/index.ts` | Nova Edge Function |
| `public/sw-push.js` | Service Worker customizado |
| `src/hooks/useAdminPush.tsx` | Hook para gerenciar push |
| `src/pages/admin/AdminDashboard.tsx` | Botão de ativar notificações |

## Fluxo Final

```text
Evento (cadastro/PRO)
        |
        v
Trigger cria admin_alert
        |
        v
Database Webhook dispara
        |
        v
Edge Function send-admin-push
        |
        v
Web Push para cada admin inscrito
        |
        v
Notificação aparece no dispositivo
```

## Benefícios

- Notificações instantâneas mesmo com navegador fechado
- Funciona em celular e desktop
- Não requer app nativo
- Admin pode ativar/desativar quando quiser
