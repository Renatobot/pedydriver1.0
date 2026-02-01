
# Plano: Controle de Turno por Odômetro e Métricas Bruto vs Líquido

## Visão Geral

Implementar duas funcionalidades importantes:

1. **Iniciar/Finalizar Turno por Odômetro**: Registrar a quilometragem no início e fim do turno
2. **Métricas Bruto vs Líquido**: Exibir R$/km e R$/hora baseado tanto na receita bruta quanto no lucro líquido

---

## Feature 1: Controle de Turno por Odômetro

### Nova Tabela no Banco

```sql
CREATE TABLE active_shifts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  platform_id UUID,
  started_at TIMESTAMPTZ DEFAULT now(),
  start_km NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Com índice único por usuário e RLS policies
```

### Novos Componentes

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useActiveShift.tsx` | Hook para gerenciar turno ativo |
| `src/components/shifts/ActiveShiftBanner.tsx` | Banner mostrando turno em andamento |
| `src/components/shifts/StartShiftModal.tsx` | Modal para iniciar turno |
| `src/components/shifts/EndShiftModal.tsx` | Modal para finalizar turno |

### Fluxo do Usuário

```text
1. Usuário clica "Iniciar Turno" no Dashboard
   ↓
2. Informa plataforma + km atual do odômetro
   ↓
3. Banner aparece: "Turno ativo desde XX:XX"
   ↓
4. Ao finalizar, informa km final
   ↓
5. Sistema calcula: km_final - km_inicial = km rodados
   Sistema calcula: now() - started_at = horas trabalhadas
   ↓
6. Cria registro na tabela shifts automaticamente
```

---

## Feature 2: Métricas Bruto vs Líquido

### Fórmulas

```typescript
// Bruto (receita / trabalho)
brutoPorKm = totalRevenue / totalKm
brutoPorHora = totalRevenue / totalHours

// Líquido (lucro / trabalho)
liquidoPorKm = realProfit / totalKm
liquidoPorHora = realProfit / totalHours
```

### Alterações no Dashboard

- Atualizar `useDashboard.tsx` para retornar métricas brutas e líquidas
- Atualizar `MetricCard.tsx` para suportar valor secundário (bruto como principal, líquido como subtítulo)
- Cards de R$/hora e R$/km mostrarão ambos valores

### Alterações no QuickEntry

- Importar `costPerKm` das configurações do usuário
- Calcular e exibir tanto bruto quanto líquido em tempo real
- Nova UI com 4 cards: R$/km Bruto, R$/hora Bruto, R$/km Líquido, R$/hora Líquido

---

## Arquivos a Criar

1. `src/hooks/useActiveShift.tsx` - Hook para turno ativo
2. `src/components/shifts/ActiveShiftBanner.tsx` - Banner no dashboard
3. `src/components/shifts/StartShiftModal.tsx` - Modal início
4. `src/components/shifts/EndShiftModal.tsx` - Modal fim

## Arquivos a Modificar

1. **Migração SQL** - Criar tabela `active_shifts`
2. `src/hooks/useDashboard.tsx` - Adicionar métricas brutas
3. `src/pages/Dashboard.tsx` - Adicionar banner + botão iniciar turno
4. `src/pages/QuickEntry.tsx` - Mostrar métricas bruto/líquido
5. `src/components/dashboard/MetricCard.tsx` - Suportar valor secundário
6. `src/components/forms/ShiftForm.tsx` - Toggle modo rápido/odômetro (opcional)

---

## Resultado Final

O motorista poderá:

- Iniciar turno informando apenas o km do odômetro
- Ver banner com tempo decorrido durante o trabalho
- Finalizar turno informando km final (sistema calcula tudo)
- Ver claramente quanto ganha bruto vs líquido por km/hora
- Entender a diferença real entre receita aparente e lucro
