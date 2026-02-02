

# Plano: Atualizar Logo do Tutorial e Traduzir Erros para Português

## Problemas Identificados

### 1. Logo Desatualizada no Tutorial
O tutorial de onboarding está usando a logo antiga (`logo-optimized.webp`), enquanto a nova logo 3D é `logo-3d-optimized.webp`.

### 2. Erros de Senha em Inglês
Quando o usuário tenta cadastrar com uma senha fraca, o sistema exibe mensagens de erro diretamente do backend (em inglês), como:
- "Password should be at least 6 characters"
- "Password is too weak"
- "Password should contain at least one character of each..."

---

## Solução

### Parte 1: Atualizar Logo do Tutorial

**Arquivo:** `src/components/onboarding/OnboardingTutorial.tsx`

Alterar a importação da logo na linha 17:
```
Antes:  import logoWebp from '@/assets/logo-optimized.webp';
Depois: import logoWebp from '@/assets/logo-3d-optimized.webp';
```

### Parte 2: Traduzir Mensagens de Erro para Português

**Arquivo:** `src/pages/Auth.tsx`

Criar uma função de tradução e aplicá-la em todos os pontos onde erros são exibidos:

```text
┌─────────────────────────────────────────────────────────────┐
│  translateAuthError(message)                                │
├─────────────────────────────────────────────────────────────┤
│  Entrada (Inglês)              │  Saída (Português)         │
│  ──────────────────────────────│─────────────────────────── │
│  "Invalid login credentials"   │  Email ou senha incorretos │
│  "already registered"          │  Este email já está        │
│                                │  cadastrado                │
│  "Email not confirmed"         │  Email não confirmado      │
│  "password...6 characters"     │  A senha deve ter no       │
│                                │  mínimo 6 caracteres       │
│  "Password is too weak"        │  Senha muito fraca         │
│  "among most common passwords" │  Senha muito comum         │
│  "signup is disabled"          │  Cadastro desativado       │
└─────────────────────────────────────────────────────────────┘
```

**Pontos de aplicação:**
- `handleLogin` (linha ~57-61)
- `handleSignup` (linha ~72-77)  
- `handlePhoneLogin` (linha ~108-115)

---

## Detalhes Técnicos

### Função de Tradução
```typescript
const translateAuthError = (message: string): string => {
  const msg = message.toLowerCase();
  
  // Erros de login
  if (msg.includes('invalid login')) 
    return 'Email ou senha incorretos';
  
  // Erros de cadastro
  if (msg.includes('already registered')) 
    return 'Este email já está cadastrado';
  if (msg.includes('email not confirmed')) 
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  
  // Erros de senha
  if (msg.includes('password should be at least 6 characters') || 
      msg.includes('password must be at least 6')) 
    return 'A senha deve ter no mínimo 6 caracteres';
  if (msg.includes('password is too weak')) 
    return 'Sua senha é muito fraca. Use letras, números e símbolos.';
  if (msg.includes('most common passwords')) 
    return 'Esta senha é muito comum. Escolha outra mais segura.';
  if (msg.includes('contain at least one character of each')) 
    return 'A senha deve conter letras maiúsculas, minúsculas, números e símbolos.';
  if (msg.includes('should not contain your email')) 
    return 'A senha não pode conter seu email.';
  
  // Erros gerais
  if (msg.includes('signup is currently disabled')) 
    return 'O cadastro está temporariamente desativado.';
  if (msg.includes('rate limit')) 
    return 'Muitas tentativas. Aguarde alguns minutos.';
  
  return message; // Retorna original se não encontrar tradução
};
```

### Arquivos Modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/onboarding/OnboardingTutorial.tsx` | Atualizar import da logo |
| `src/pages/Auth.tsx` | Adicionar função de tradução e aplicar nos handlers |

---

## Resultado Esperado
- O tutorial de onboarding exibirá a nova logo 3D
- Todas as mensagens de erro do sistema de autenticação serão exibidas em Português brasileiro
- Experiência do usuário totalmente localizada em PT-BR

