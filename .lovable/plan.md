
# Plano: Admin Editar Próprios Dados + Admin Editar Email de Usuários

## Resumo das Mudanças

Duas funcionalidades principais:
1. **Admin editar seus próprios dados** no painel admin
2. **Admin poder alterar o email de qualquer usuário** (usuário continua sem poder alterar seu próprio email)

## 1. Admin Editar Próprios Dados

Adicionar seção de perfil do admin no layout do painel administrativo:

```text
┌─────────────────────────────────────────────────────┐
│  Sidebar Admin (quando expandida)                   │
│  ────────────────────────────────                   │
│  👤 Admin: João Silva                               │
│     joao@admin.com                       [Editar]   │
│  ───────────────────────────────────────────────    │
│  📊 Dashboard                                       │
│  👥 Usuários                                        │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

O admin poderá editar nome e telefone próprios. O email do admin também ficará bloqueado (consistência com a regra geral).

## 2. Admin Editar Email de Usuários

Adicionar campo de email no modal de edição do AdminUsers.tsx:

```text
┌───────────────────────────────────────────────────────┐
│  Editar Dados do Usuário                              │
│                                                       │
│  Nome Completo: [João Silva____________]             │
│                                                       │
│  WhatsApp:      [(11) 99999-9999_______]             │
│                                                       │
│  Email:         [joao@email.com_________]  ← EDITÁVEL│
│                 ⚠️ Alterar email pode afetar login   │
│                                                       │
│                              [Cancelar]  [Salvar]     │
└───────────────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/admin-update-user-email/index.ts` | Criar | Edge function para alterar email via service role |
| `src/hooks/useAdmin.tsx` | Modificar | Adicionar `useAdminUpdateEmail()` |
| `src/pages/admin/AdminUsers.tsx` | Modificar | Adicionar campo email no dialog de edição |
| `src/components/admin/AdminLayout.tsx` | Modificar | Adicionar card de perfil do admin com botão editar |
| `src/components/admin/EditAdminProfileModal.tsx` | Criar | Modal para admin editar próprios dados |

## Edge Function: admin-update-user-email

A alteração de email em auth.users requer `SUPABASE_SERVICE_ROLE_KEY`, por isso precisa de uma edge function:

```typescript
// Validação de segurança
1. Verificar se chamador é admin via RPC is_admin()
2. Validar formato do novo email
3. Verificar se email já existe no sistema
4. Atualizar email via supabase.auth.admin.updateUserById()
5. Registrar ação em admin_logs
```

## Fluxo de Dados

```text
ADMIN EDITA PRÓPRIO PERFIL:
┌─────────────┐    ┌────────────────┐    ┌──────────────────┐
│ AdminLayout │───>│ useUpdateProfile│───>│ profiles (RLS)   │
│  (sidebar)  │    │    (mutate)    │    │ user_id = auth() │
└─────────────┘    └────────────────┘    └──────────────────┘

ADMIN EDITA EMAIL DE USUÁRIO:
┌───────────┐    ┌─────────────────────┐    ┌─────────────────────────┐
│ AdminUsers│───>│ useAdminUpdateEmail │───>│ admin-update-user-email │
│   Page    │    │    (mutate)          │    │ (edge function)         │
└───────────┘    └─────────────────────┘    └─────────────────────────┘
```

## Detalhes Técnicos

### Edge Function admin-update-user-email

```typescript
// Estrutura básica
interface UpdateEmailRequest {
  targetUserId: string;
  newEmail: string;
}

// 1. Verificar admin
const { data: isAdmin } = await supabaseUser.rpc("is_admin");

// 2. Validar email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 3. Atualizar via service role
await supabaseAdmin.auth.admin.updateUserById(targetUserId, { 
  email: newEmail,
  email_confirm: true // Confirma automaticamente
});

// 4. Logar ação
await supabaseAdmin.from("admin_logs").insert({...});
```

### Modificação em AdminUsers.tsx

Adicionar estado `editEmail` e campo de input para email no dialog `edit_profile`. Chamar a nova mutation para email quando houver alteração.

### Hook useAdminUpdateEmail

```typescript
export function useAdminUpdateEmail() {
  return useMutation({
    mutationFn: async ({ targetUserId, newEmail }) => {
      const { data, error } = await supabase.functions.invoke('admin-update-user-email', {
        body: { targetUserId, newEmail },
      });
      if (error) throw error;
      return data;
    },
    // ... invalidate queries e toast
  });
}
```

### EditAdminProfileModal

Componente similar ao `EditProfileModal` do usuário, mas para o admin editar seus próprios dados no painel admin. Usa o mesmo `useUpdateProfile()` existente.

## Validações de Segurança

1. **Email do usuário editando próprio perfil**: Continua bloqueado (UI disabled)
2. **Email editado por admin**: Permitido via edge function com verificação `is_admin()`
3. **Validação de email**: Formato válido, não duplicado
4. **Logs**: Toda alteração de email registrada em admin_logs
5. **Confirmação automática**: Email já confirmado após alteração pelo admin

## Interface de Aviso

Ao alterar email de um usuário, exibir aviso:

```text
⚠️ Atenção: Alterar o email afetará o login do usuário.
O usuário precisará usar o novo email para acessar a conta.
```
