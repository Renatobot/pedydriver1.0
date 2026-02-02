
# Plano: Sistema de Indicação com Proteção Anti-Fraude

## Visão Geral

Implementar um programa de indicação ("Indique e Ganhe") onde usuários podem convidar amigos. Para evitar fraudes (mesma pessoa criando várias contas), usaremos **fingerprinting de dispositivo** para detectar e bloquear indicações suspeitas.

---

## Como Funciona

### Fluxo do Usuário

1. **Indicador** acessa "Indique Amigos" nas Configurações
2. Copia seu código/link único de indicação
3. **Indicado** se cadastra usando o link/código
4. Sistema valida que são dispositivos diferentes
5. Ambos recebem recompensa (ex: 7 dias PRO grátis)

### Proteção Anti-Fraude

O sistema gera uma "impressão digital" do dispositivo usando:
- Resolução de tela
- Fuso horário
- Idioma do navegador
- Número de cores
- Plataforma (mobile/desktop)
- Canvas fingerprint (forma como o navegador renderiza gráficos)

Isso cria um hash único que identifica o dispositivo sem coletar dados pessoais.

---

## Regras de Validação

| Situação | Ação |
|----------|------|
| Dispositivo novo + código válido | Indicação aceita |
| Mesmo dispositivo do indicador | Indicação rejeitada |
| Dispositivo já registrou outra conta | Indicação rejeitada |
| Código expirado ou inválido | Indicação rejeitada |

---

## Recompensas Sugeridas

| Quem | Recompensa |
|------|------------|
| Indicador | 7 dias PRO grátis (acumula) |
| Indicado | 7 dias PRO grátis |

---

## Alterações Técnicas

### 1. Nova Tabela: `referrals`

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, rejected
  referrer_device_fingerprint TEXT NOT NULL,
  referred_device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

### 2. Nova Tabela: `device_fingerprints`

```sql
CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fingerprint)
);
```

### 3. Novo Hook: `useDeviceFingerprint.tsx`

Gera o fingerprint do dispositivo usando:
- Canvas fingerprint
- Screen resolution
- Timezone
- Language
- Color depth

### 4. Modificar: `Auth.tsx`

- Detectar código de indicação na URL (`?ref=CODIGO`)
- Salvar no localStorage antes do cadastro
- Após cadastro, validar e registrar indicação

### 5. Nova Seção em: `Settings.tsx`

- Card "Indique Amigos"
- Mostrar código único do usuário
- Botão para copiar link
- Contador de indicações bem-sucedidas
- Lista de recompensas ganhas

### 6. Lógica de Validação no Backend

Função RPC ou Edge Function que:
1. Verifica se o código existe
2. Compara fingerprints (indicador vs indicado)
3. Verifica se o dispositivo já foi usado
4. Se válido, marca indicação como completada
5. Aplica bônus de dias PRO para ambos

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useDeviceFingerprint.tsx` | Criar - gera fingerprint |
| `src/hooks/useReferral.tsx` | Criar - gerencia indicações |
| `src/components/settings/ReferralCard.tsx` | Criar - UI de indicação |
| `src/pages/Auth.tsx` | Modificar - detectar código na URL |
| `src/pages/Settings.tsx` | Modificar - adicionar card de indicação |
| Migração SQL | Criar tabelas `referrals` e `device_fingerprints` |

---

## Fluxo de Segurança

```text
Indicado acessa ?ref=ABC123
        │
        ▼
Gera fingerprint do dispositivo
        │
        ▼
Usuário se cadastra
        │
        ▼
Sistema compara fingerprints
        │
        ├─── Diferentes → Indicação aceita ✓
        │                  Aplica 7 dias PRO
        │
        └─── Iguais/Suspeito → Indicação rejeitada ✗
                               Cadastro continua normal
                               (sem bônus)
```

---

## Limitações Conhecidas

1. **Não é 100% infalível**: Usuário pode usar dispositivo diferente para fraudar
2. **Navegadores diferentes**: Mesmo dispositivo com Chrome vs Safari terá fingerprints diferentes
3. **Modo anônimo**: Pode afetar alguns componentes do fingerprint

**Mitigação**: Combinar fingerprint com análise de IP e comportamento (fase futura)

---

## Resultado Esperado

- Interface simples para compartilhar código
- Proteção razoável contra fraude básica
- Incentivo para usuários indicarem amigos reais
- Crescimento orgânico da base de usuários
