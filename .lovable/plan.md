
# Plano: Adicionar Visualizacao Diaria no Dashboard

## Objetivo
Adicionar a opcao "Hoje" no seletor de periodo do dashboard, permitindo que o motorista veja o resumo do dia atual alem da semana e mes.

## Arquivos a Modificar

### 1. src/hooks/useDashboard.tsx
- Atualizar o tipo `DateRange` para incluir `'day'`
- Adicionar logica para calcular o intervalo de datas do dia atual usando `startOfDay` e `endOfDay`

### 2. src/components/dashboard/DateRangeSelector.tsx
- Adicionar novo botao "Hoje" antes de "Semana" e "Mes"
- Manter o mesmo estilo visual dos botoes existentes

### 3. src/components/dashboard/ProfitEvolutionChart.tsx
- Adicionar tratamento especial para quando `range === 'day'`
- Para visualizacao diaria, mostrar as horas do dia (0h-24h) em vez de dias
- Alternativa: esconder o grafico de evolucao quando for dia (pois nao faz sentido evolucao em um unico dia)

### 4. src/pages/Dashboard.tsx
- Atualizar o estado inicial para `'day'` como padrao (opcional)
- Ou manter `'week'` como padrao atual

## Detalhes Tecnicos

```text
+--------+----------+--------+
|  Hoje  |  Semana  |   Mes  |
+--------+----------+--------+
```

### Calculo do Intervalo Diario
```typescript
if (range === 'day') {
  const today = format(now, 'yyyy-MM-dd');
  return {
    start: today,
    end: today
  };
}
```

### Tratamento do Grafico de Evolucao
Para o modo "dia", temos duas opcoes:
1. **Esconder o grafico** - ja que um unico dia nao mostra "evolucao"
2. **Mostrar resumo simplificado** - um card com os valores do dia

Recomendacao: Esconder o grafico `ProfitEvolutionChart` quando for visualizacao diaria, pois ele nao adiciona valor com apenas um ponto de dados.

## Ordem de Implementacao
1. Atualizar tipo `DateRange` em `useDashboard.tsx`
2. Adicionar logica de calculo de data para 'day'
3. Atualizar `DateRangeSelector.tsx` com novo botao
4. Atualizar `ProfitEvolutionChart.tsx` para tratar 'day'
5. Ajustar `Dashboard.tsx` se necessario
