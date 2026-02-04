

# Plano de Implementação: 6 Novas Funcionalidades Leves

## Visão Geral

Implementação de 6 funcionalidades que utilizam dados já existentes no sistema, sem adicionar dependências pesadas ou queries complexas.

---

## Funcionalidade 1: Visualização das Metas Semanais no Dashboard

### Objetivo
Mostrar barras de progresso das 4 metas semanais (ganhos, serviços, km, horas) diretamente no Dashboard, permitindo acompanhamento rápido sem navegar para outras páginas.

### Implementação

**Novo componente:** `src/components/dashboard/WeeklyGoalsProgress.tsx`

Card compacto com 4 barras de progresso horizontais mostrando:
- Meta de Ganhos: R$ atual / R$ meta
- Meta de Serviços: X / Y serviços
- Meta de KM: X / Y km
- Meta de Horas: X / Y horas

Cada barra terá cores diferentes baseadas no progresso:
- Verde quando >= 100%
- Amarelo quando >= 70%
- Vermelho quando < 70%

**Modificação:** `src/pages/Dashboard.tsx`
- Adicionar import do novo componente
- Inserir após o GamificationCard

### Dados Utilizados
- `useGamification().weeklyProgress` - progresso atual
- `useGamification().weeklyGoals` - metas configuradas

---

## Funcionalidade 2: Análise de Melhores Horários (Faixas Horárias)

### Objetivo
Expandir a análise de "Melhor dia para trabalhar" para incluir também quais faixas horárias rendem mais.

### Implementação

**Modificação:** `src/components/reports/BestTimesAnalysis.tsx`

Adicionar nova seção após o gráfico de dias da semana com faixas horárias:
- Manhã: 06:00 - 12:00
- Tarde: 12:00 - 18:00
- Noite: 18:00 - 24:00
- Madrugada: 00:00 - 06:00

**Lógica:**
- Usar o campo `created_at` dos earnings para extrair a hora
- Agrupar por faixa horária
- Calcular média de ganho por hora em cada faixa
- Mostrar ranking com barras de progresso

### Dados Utilizados
- Earnings com `created_at` (já passado ao componente)
- Shifts com `created_at` (já passado ao componente)

---

## Funcionalidade 3: Sistema de Lembretes de Manutenção

### Objetivo
Permitir que o usuário configure alertas de manutenção baseados em quilometragem acumulada.

### Implementação

**Nova tabela no banco:** `maintenance_reminders`

```text
┌─────────────────────────────────────────────────┐
│              maintenance_reminders              │
├─────────────────────────────────────────────────┤
│ id          UUID PRIMARY KEY                    │
│ user_id     UUID (ref auth.users)               │
│ name        TEXT (ex: "Troca de óleo")          │
│ interval_km INTEGER (ex: 10000)                 │
│ last_km     NUMERIC (quando foi feita)          │
│ created_at  TIMESTAMPTZ                         │
│ updated_at  TIMESTAMPTZ                         │
└─────────────────────────────────────────────────┘
```

**Novos arquivos:**
- `src/hooks/useMaintenanceReminders.tsx` - CRUD de lembretes
- `src/components/settings/MaintenanceRemindersSettings.tsx` - Configuração
- `src/components/dashboard/MaintenanceAlertBanner.tsx` - Alertas no Dashboard

**Templates pré-definidos:**
- Troca de óleo: 5.000 km ou 10.000 km
- Revisão de freios: 20.000 km
- Troca de pneus: 40.000 km
- Revisão geral: 30.000 km

---

## Funcionalidade 4: Métricas de Eficiência de Combustível

### Objetivo
Adicionar gráficos comparando custo de combustível por 100km ao longo do tempo, correlacionando dados de gastos com combustível e quilometragem rodada.

### Implementação

**Novo componente:** `src/components/reports/FuelEfficiencyChart.tsx`

Exibirá:
- Gráfico de linha: custo por 100km ao longo do tempo
- Média do período selecionado
- Comparação com período anterior (se disponível)
- Dicas de economia baseadas nos dados

**Lógica de cálculo:**

```text
Custo por 100km = (Gastos com combustível no período / KM rodados) × 100
```

**Modificação:** `src/pages/Reports.tsx`
- Adicionar nova seção "Eficiência de Combustível"
- Inserir após BestTimesAnalysis

### Dados Utilizados
- Expenses com categoria `combustivel`
- Shifts com `km_driven`
- Agrupamento por semana/mês

---

## Funcionalidade 5: Atalhos Rápidos para Apps de Corrida

### Objetivo
Adicionar botões de acesso rápido que abrem diretamente os apps de corrida/entrega instalados no dispositivo.

### Implementação

**Novo componente:** `src/components/dashboard/QuickAppLinks.tsx`

Cards horizontais com deep links para:
- Uber Driver: `uberdriver://`
- 99 Motorista: `motorista99://`
- iFood Entregador: `ifood-entregador://`

**Lógica de fallback:**
- Tentar abrir deep link
- Se falhar (app não instalado), abrir loja de apps correspondente

**Modificação:** `src/pages/Dashboard.tsx`
- Adicionar seção "Abrir Apps" abaixo do botão "Iniciar Turno"

### Deep Links

| App | Deep Link | Play Store Fallback |
|-----|-----------|---------------------|
| Uber Driver | `uberdriver://` | Play Store do Uber Driver |
| 99 Motorista | `motorista99://` | Play Store do 99 |
| iFood Entregador | `ifood-entregador://` | Play Store do iFood |

---

## Funcionalidade 6: Rankings Anônimos da Comunidade

### Objetivo
Exibir métricas de desempenho relativo comparando o usuário com outros motoristas da plataforma de forma anônima (ex: "Você está entre os Top 10% da sua cidade").

### Implementação

**Nova tabela no banco:** `community_stats` (agregações periódicas)

```text
┌─────────────────────────────────────────────────┐
│                 community_stats                 │
├─────────────────────────────────────────────────┤
│ id          UUID PRIMARY KEY                    │
│ period      TEXT (ex: "2025-01")                │
│ metric      TEXT (ex: "revenue_per_hour")       │
│ p10         NUMERIC (percentil 10)              │
│ p25         NUMERIC (percentil 25)              │
│ p50         NUMERIC (percentil 50 - mediana)    │
│ p75         NUMERIC (percentil 75)              │
│ p90         NUMERIC (percentil 90)              │
│ avg         NUMERIC (média)                     │
│ count       INTEGER (qtd usuários)              │
│ updated_at  TIMESTAMPTZ                         │
└─────────────────────────────────────────────────┘
```

**Edge Function:** `supabase/functions/calculate-community-stats/index.ts`
- Executada via cron (1x por dia)
- Calcula percentis para: R$/hora, R$/km, ganho semanal médio
- Armazena na tabela `community_stats`
- Dados 100% anônimos (apenas agregações)

**Novo componente:** `src/components/dashboard/CommunityRanking.tsx`

Exibirá cards como:
- "Seu R$/hora está acima de 75% dos motoristas"
- "Você está no Top 10% em ganhos semanais"
- Ícone de troféu/medalha para rankings altos

**Modificação:** `src/pages/Dashboard.tsx`
- Adicionar CommunityRanking após as métricas principais

### Privacidade
- Nenhum dado individual é exposto
- Apenas percentis agregados
- Mínimo de 10 usuários para exibir (evita identificação)

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/dashboard/WeeklyGoalsProgress.tsx` | Card de progresso das metas semanais |
| `src/components/dashboard/MaintenanceAlertBanner.tsx` | Banner de alerta de manutenção |
| `src/components/dashboard/QuickAppLinks.tsx` | Atalhos para apps de corrida |
| `src/components/dashboard/CommunityRanking.tsx` | Rankings anônimos da comunidade |
| `src/components/settings/MaintenanceRemindersSettings.tsx` | Configuração de lembretes |
| `src/components/reports/FuelEfficiencyChart.tsx` | Gráfico de eficiência de combustível |
| `src/hooks/useMaintenanceReminders.tsx` | Hook para CRUD de lembretes |
| `src/hooks/useCommunityStats.tsx` | Hook para buscar stats da comunidade |
| `supabase/functions/calculate-community-stats/index.ts` | Edge function para calcular percentis |

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/Dashboard.tsx` | Adicionar WeeklyGoalsProgress, MaintenanceAlertBanner, QuickAppLinks, CommunityRanking |
| `src/pages/Settings.tsx` | Adicionar MaintenanceRemindersSettings |
| `src/pages/Reports.tsx` | Adicionar FuelEfficiencyChart |
| `src/components/reports/BestTimesAnalysis.tsx` | Adicionar análise por faixa horária |

## Migrações de Banco

```text
Tabela 1: maintenance_reminders
- id, user_id, name, interval_km, last_km, created_at, updated_at
- RLS: usuário só vê seus próprios lembretes

Tabela 2: community_stats
- id, period, metric, p10, p25, p50, p75, p90, avg, count, updated_at
- RLS: leitura pública (dados anônimos), escrita apenas via service_role
```

---

## Ordem de Implementação

1. **Metas Semanais no Dashboard** - Mais simples, usa dados existentes
2. **Análise de Faixas Horárias** - Modificação em componente existente
3. **Atalhos para Apps** - Novo componente, sem banco de dados
4. **Eficiência de Combustível** - Novo componente, usa dados existentes
5. **Lembretes de Manutenção** - Requer migração de banco
6. **Rankings da Comunidade** - Requer migração + edge function

---

## Impacto de Performance

| Funcionalidade | Impacto | Motivo |
|----------------|---------|--------|
| Metas Semanais | Zero | Usa hook já carregado |
| Faixas Horárias | Mínimo | Processamento local com useMemo |
| Atalhos Apps | Zero | Apenas deep links |
| Eficiência Combustível | Baixo | useMemo sobre dados já carregados |
| Lembretes Manutenção | Baixo | 1 query adicional com cache |
| Rankings Comunidade | Baixo | 1 query pequena, dados pré-calculados |

Todas as funcionalidades foram projetadas para serem leves e não impactar a experiência do usuário.

