
# Plano: Edição de Informações Pessoais (Usuário e Admin)

## Resumo

Adicionar funcionalidade para usuários e administradores editarem informações pessoais (nome e telefone), mantendo o email bloqueado para edição para evitar criação de múltiplas contas.

## Componentes a Implementar

### 1. Banco de Dados

Criar uma função RPC `admin_update_user_profile` para permitir que administradores atualizem dados de perfil de qualquer usuário de forma segura.

```text
┌─────────────────────────────────────────────────────────────┐
│                    Funções a Criar                          │
├─────────────────────────────────────────────────────────────┤
│ admin_update_user_profile(_target_user_id, _full_name,      │
│                           _phone)                           │
│ - Verifica se chamador é admin                              │
│ - Atualiza profiles.full_name e profiles.phone              │
│ - Registra ação em admin_logs                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Frontend - Lado do Usuário

Adicionar modal/formulário de edição no Settings.tsx onde o usuário pode editar seus dados pessoais:

```text
┌───────────────────────────────────────────────────────────┐
│  Card Atual (somente leitura)                             │
│  ┌─────┐  Nome: João Silva                               │
│  │ 👤  │  Email: joao@email.com                          │
│  └─────┘                                        [Editar]  │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│  Modal de Edição                                          │
│                                                           │
│  Nome Completo: [João Silva____________]                 │
│                                                           │
│  WhatsApp:      [(11) 99999-9999_______]                 │
│                                                           │
│  Email:         [joao@email.com_________] 🔒 (bloqueado) │
│                                                           │
│                              [Cancelar]  [Salvar]         │
└───────────────────────────────────────────────────────────┘
```

### 3. Frontend - Lado do Admin

Adicionar opção "Editar Dados" no menu de ações do AdminUsers.tsx:

```text
┌─────────────────────────────────────────────────────────────┐
│  Menu de Ações do Usuário                                   │
│  ────────────────────────                                   │
│  👁️  Ver Detalhes                                          │
│  ✏️  Editar Dados       ← NOVO                             │
│  ─────────────────                                          │
│  👑  Ativar/Desativar PRO                                  │
│  🔄  Resetar Limite                                         │
│  🔑  Resetar Senha                                          │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### 4. Hooks a Criar/Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useProfile.tsx` | Novo hook com `useProfile()` e `useUpdateProfile()` |
| `src/hooks/useAdmin.tsx` | Adicionar `useAdminUpdateProfile()` |

## Fluxo de Dados

```text
USUÁRIO EDITA PRÓPRIO PERFIL:
┌──────────┐    ┌────────────────┐    ┌──────────────────┐
│ Settings │───>│ useUpdateProfile│───>│ profiles (RLS)   │
│   Page   │    │    (mutate)    │    │ user_id = auth() │
└──────────┘    └────────────────┘    └──────────────────┘

ADMIN EDITA PERFIL DE USUÁRIO:
┌───────────┐    ┌─────────────────────┐    ┌────────────────────┐
│ AdminUsers│───>│ useAdminUpdateProfile│───>│ admin_update_      │
│   Page    │    │    (mutate)          │    │ user_profile RPC   │
└───────────┘    └─────────────────────┘    └────────────────────┘
```

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Migração SQL | Criar | Função RPC `admin_update_user_profile` |
| `src/hooks/useProfile.tsx` | Criar | Hook para usuário gerenciar próprio perfil |
| `src/hooks/useAdmin.tsx` | Modificar | Adicionar mutation para admin editar perfil |
| `src/pages/Settings.tsx` | Modificar | Adicionar botão "Editar" e modal de edição |
| `src/pages/admin/AdminUsers.tsx` | Modificar | Adicionar opção "Editar Dados" e dialog |

## Validações de Segurança

1. **Email bloqueado**: Campo desabilitado na UI, não aceito nas mutations
2. **Usuário só edita próprio perfil**: RLS policy existente (`auth.uid() = user_id`)
3. **Admin pode editar qualquer perfil**: Via RPC com verificação `is_admin()`
4. **Logs de auditoria**: Toda edição de admin registrada em `admin_logs`

## Validação de Entrada

- Nome: máximo 100 caracteres, não pode ser vazio
- Telefone: formato brasileiro, validação com regex
- Ambos os campos sanitizados antes de enviar

## Detalhes Técnicos

### Hook useUpdateProfile (Usuário)

```typescript
// Atualiza diretamente a tabela profiles via Supabase client
// RLS garante que só pode atualizar próprio perfil
const { data, error } = await supabase
  .from('profiles')
  .update({ full_name, phone })
  .eq('user_id', user.id)
  .select()
  .single();
```

### RPC admin_update_user_profile

```sql
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  _target_user_id uuid,
  _full_name text,
  _phone text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  UPDATE profiles 
  SET full_name = _full_name, 
      phone = _phone, 
      updated_at = now()
  WHERE user_id = _target_user_id;
  
  -- Log da ação
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'update_user_profile', _target_user_id, 
          jsonb_build_object('full_name', _full_name, 'phone', _phone));
END;
$$;
```

### Componente de Edição (Usuário)

Modal com formulário validado por zod:
- Input para nome (required, max 100 chars)
- Input para telefone com máscara brasileira
- Email exibido mas disabled
- Botões Cancelar/Salvar
