
# Plano: Adicionar Categorias de Aluguel de Veículo e Financiamento

## Objetivo
Adicionar duas novas categorias de gasto específicas para motoristas de aplicativo:
- **Aluguel de Veículo** - Para quem aluga carro/moto semanalmente
- **Financiamento/Prestação** - Para quem paga parcelas do veículo

Isso tornará o cálculo do lucro real muito mais preciso, já que a maioria dos motoristas tem esses custos recorrentes.

## Impacto no Lucro Real
Atualmente o sistema calcula:
```text
Lucro Real = Receita - Gastos Diretos - Custo por KM - Rateio de Custos Gerais
```

Com as novas categorias, esses custos fixos do veículo serão automaticamente incluídos no cálculo, mostrando o lucro verdadeiro após pagar o carro/moto.

---

## Etapas de Implementação

### 1. Migração do Banco de Dados
Adicionar dois novos valores ao enum `expense_category`:
- `aluguel_veiculo` - Aluguel de Veículo
- `financiamento` - Financiamento/Prestação

**SQL:**
```sql
ALTER TYPE expense_category ADD VALUE 'aluguel_veiculo';
ALTER TYPE expense_category ADD VALUE 'financiamento';
```

### 2. Atualizar Tipos TypeScript
Arquivo: `src/types/database.ts`

Adicionar os novos valores ao tipo `ExpenseCategory`:
```typescript
export type ExpenseCategory = 
  'combustivel' | 'manutencao' | 'alimentacao' | 'seguro' | 
  'aluguel' | 'aluguel_veiculo' | 'financiamento' |
  'internet' | 'pedagio_estacionamento' | 'outros';
```

### 3. Atualizar Labels de Categorias
Arquivo: `src/lib/formatters.ts`

Adicionar os labels em português:
```typescript
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  alimentacao: 'Alimentação',
  seguro: 'Seguro',
  aluguel: 'Aluguel',
  aluguel_veiculo: 'Aluguel de Veículo',   // NOVO
  financiamento: 'Financiamento/Prestação', // NOVO
  internet: 'Internet',
  pedagio_estacionamento: 'Pedágio/Estac.',
  outros: 'Outros'
};
```

### 4. Atualizar Formulário de Gastos
Arquivo: `src/components/forms/ExpenseForm.tsx`

Adicionar as novas categorias ao schema Zod:
```typescript
category: z.enum([
  'combustivel', 'manutencao', 'alimentacao', 'seguro', 
  'aluguel', 'aluguel_veiculo', 'financiamento',
  'internet', 'pedagio_estacionamento', 'outros'
] as const)
```

### 5. Atualizar Modal de Edição de Gastos
Arquivo: `src/components/history/EditExpenseModal.tsx`

Mesma atualização do schema Zod para incluir as novas categorias.

### 6. Atualizar Gráfico de Categorias
Arquivo: `src/components/dashboard/ExpenseCategoryChart.tsx`

Adicionar labels e cores para as novas categorias:
```typescript
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  // ... existentes ...
  aluguel_veiculo: 'Aluguel Veículo',
  financiamento: 'Financiamento',
};

// Adicionar mais 2 cores ao array COLORS
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Adicionar valores ao enum |
| `src/types/database.ts` | Adicionar tipos |
| `src/lib/formatters.ts` | Adicionar labels |
| `src/components/forms/ExpenseForm.tsx` | Atualizar schema Zod |
| `src/components/history/EditExpenseModal.tsx` | Atualizar schema Zod |
| `src/components/dashboard/ExpenseCategoryChart.tsx` | Adicionar labels e cores |

---

## Resultado Esperado
Após a implementação, os motoristas poderão:

1. Registrar gastos de **Aluguel de Veículo** (pagamento semanal/mensal do aluguel do carro/moto)
2. Registrar gastos de **Financiamento/Prestação** (parcelas do veículo próprio)
3. Ver esses custos no gráfico de pizza de gastos
4. Ter um **lucro real mais preciso** que considera todos os custos do veículo
