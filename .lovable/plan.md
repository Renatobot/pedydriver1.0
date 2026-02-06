
# Plano: Modo Visitante com Persistência Local

## ✅ Status: IMPLEMENTADO

## Objetivo
Permitir que visitantes experimentem o app sem cadastro, salvando dados localmente, e solicitar criação de conta apenas quando tentarem salvar definitivamente ou acessar funcionalidades que requerem autenticação.

---

## Visão Geral do Fluxo

```text
Landing Page → CTA "Testar Grátis"
       ↓
   /demo (Modo Visitante)
       ↓
  Uso local (IndexedDB)
       ↓
  Tenta salvar/histórico/relatórios
       ↓
  Modal de Cadastro Amigável
       ↓
  Cadastro → Migração de dados → App completo
```

---

## O que será implementado

### 1. Nova rota /demo (Modo Visitante)
- Acesso público direto da Landing Page
- Badge "Modo Visitante" fixo no topo
- Formulário de entrada rápida funcional (simulação de corrida)
- Dados salvos APENAS no IndexedDB local (sem user_id)
- Métricas calculadas em tempo real (R$/km, R$/hora, lucro líquido)

### 2. Contexto GuestModeContext
Novo contexto para gerenciar o estado de visitante:
- `isGuest: boolean` — indica se está em modo visitante
- `guestEntries: GuestEntry[]` — dados locais do visitante
- `addGuestEntry()` — salva entrada no IndexedDB
- `getGuestEntries()` — recupera entradas locais
- `migrateToUser()` — migra dados para conta após cadastro
- `clearGuestData()` — limpa dados locais

### 3. Persistência local dedicada (IndexedDB)
Nova store `guestData` no offlineDB.ts:
- Armazena ganhos, gastos e turnos do visitante
- Dados marcados com `isGuest: true`
- Expira após 7 dias sem uso
- Migração automática para backend ao criar conta

### 4. Gatilhos para solicitar cadastro
Modal amigável aparece quando visitante tenta:
- Acessar /history (Histórico)
- Acessar /reports (Relatórios semanais/mensais)
- Acessar /settings (Configurações)
- Clicar em "Salvar e acompanhar evolução"

### 5. Modal de Cadastro (SignupPromptModal)
Design amigável com:
- Ícone motivacional
- Texto: "Crie sua conta grátis para salvar seus dados, acompanhar sua evolução e descobrir onde está seu lucro de verdade."
- Botão principal: "Criar conta grátis"
- Texto secundário: "Leva 1 minuto • Sem cartão"
- Link discreto: "Já tenho conta → Entrar"

### 6. Transparência sobre recursos pagos
Nos componentes bloqueados do plano gratuito:
- Preview esmaecido com blur (já existe via FeatureGate)
- Ícone de cadeado (já existe)
- Texto atualizado: "Recurso disponível no plano Pro. Você pode testar grátis por 7 dias após receber um link de indicação."

### 7. Ajustes na página de Login (/auth)
- Botão "Criar conta grátis" visualmente maior e mais destacado
- Manter banner de conversão no topo
- Ao clicar no banner → scroll automático + foco no formulário (já implementado)

### 8. Resumo pré-cadastro
Antes de finalizar o cadastro, pequeno resumo:
- O que está incluso no plano gratuito (30 registros/mês, 1 plataforma, histórico 7 dias)
- O que é exclusivo do Pro (sem limites, relatórios avançados, etc.)
- Linguagem simples e direta

---

## Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/GuestModeContext.tsx` | Contexto para gerenciar estado de visitante |
| `src/pages/Demo.tsx` | Página de demonstração pública |
| `src/components/guest/GuestModeBanner.tsx` | Badge "Modo Visitante" |
| `src/components/guest/SignupPromptModal.tsx` | Modal amigável de cadastro |
| `src/components/guest/DemoQuickEntry.tsx` | Formulário simplificado para visitantes |
| `src/components/guest/GuestMetrics.tsx` | Métricas calculadas localmente |
| `src/components/auth/PlanSummary.tsx` | Resumo dos planos antes do cadastro |

---

## Arquivos a modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/App.tsx` | Adicionar rota /demo pública |
| `src/lib/offlineDB.ts` | Adicionar store `guestData` com funções dedicadas |
| `src/components/landing/HeroSection.tsx` | CTA "Testar grátis" aponta para /demo |
| `src/components/landing/FinalCTA.tsx` | CTA secundário para /demo |
| `src/pages/Auth.tsx` | Adicionar PlanSummary antes do botão de cadastro |
| `src/components/subscription/FeatureGate.tsx` | Ajustar texto sobre trial de indicação |
| `src/components/subscription/UpgradeCard.tsx` | Ajustar mensagem sobre trial |

---

## Detalhes Técnicos

### Estrutura de dados do visitante (IndexedDB)

```typescript
interface GuestEntry {
  id: string;           // UUID temporário
  type: 'earning' | 'expense' | 'shift';
  amount: number;
  km?: number;
  minutes?: number;
  platform_name: string;  // Nome da plataforma (não ID)
  date: string;
  created_at: number;     // timestamp
}
```

### Migração de dados ao cadastrar

```typescript
async function migrateGuestData(userId: string) {
  const entries = await getGuestEntries();
  
  for (const entry of entries) {
    // Busca ou cria a plataforma pelo nome
    const platform = await findOrCreatePlatform(entry.platform_name);
    
    // Insere no Supabase com o user_id real
    await supabase.from('earnings').insert({
      ...entry,
      user_id: userId,
      platform_id: platform.id,
    });
  }
  
  // Limpa dados locais
  await clearGuestData();
}
```

### Fluxo de cadastro com migração

```text
1. Visitante preenche dados em /demo
2. Dados salvos no IndexedDB (guestData)
3. Visitante clica em "Salvar evolução" ou tenta acessar /history
4. Modal SignupPromptModal aparece
5. Visitante clica "Criar conta grátis"
6. Redirecionado para /auth com state { fromDemo: true }
7. Após cadastro bem-sucedido:
   a. migrateGuestData() é chamado
   b. Dados são transferidos para o Supabase
   c. IndexedDB é limpo
   d. Usuário redirecionado para Dashboard
8. Toast: "Seus dados foram salvos! 🎉"
```

---

## Textos e Mensagens

### Modal de Cadastro
```text
Título: "Crie sua conta grátis"
Subtítulo: "Salve seus dados, acompanhe sua evolução e descubra onde está seu lucro de verdade."
Botão: "Criar conta grátis"
Microtexto: "Leva 1 minuto • Sem cartão"
Link: "Já tenho conta → Entrar"
```

### Recursos bloqueados (atualizado)
```text
"Recurso disponível no plano Pro.
Convide amigos e ganhe 7 dias grátis!"
```

### Resumo pré-cadastro
```text
Plano Gratuito inclui:
✓ 30 registros por mês
✓ 1 plataforma
✓ Histórico dos últimos 7 dias
✓ Cálculo de lucro real

Plano PRO desbloqueia:
✓ Registros ilimitados
✓ Todas as plataformas
✓ Histórico completo
✓ Relatórios avançados
✓ Melhores horários para trabalhar
```

---

## Considerações de Segurança

1. **Dados locais são efêmeros** — expiram após 7 dias sem uso
2. **Migração segura** — validação do user_id antes de inserir
3. **Sem fingerprint para visitantes** — fingerprint só usado após cadastro (indicação)
4. **Dados nunca sobrescrevem** — migração verifica duplicatas por data/valor

---

## Ordem de implementação

1. Atualizar `offlineDB.ts` com store de visitante
2. Criar `GuestModeContext.tsx`
3. Criar página `/demo` com entrada rápida
4. Criar `SignupPromptModal` e `GuestModeBanner`
5. Atualizar Landing Page CTAs
6. Implementar lógica de migração no Auth
7. Atualizar textos do FeatureGate/UpgradeCard
8. Adicionar PlanSummary na página de cadastro
9. Testes end-to-end do fluxo completo
