
# Plano: Simplificar Termo "Rateio" na Interface

## Problema
A palavra "rateio" é um termo técnico/contábil que pode confundir usuários. Significa "dividir proporcionalmente", mas isso não é óbvio para todo mundo.

---

## Alterações Propostas

### 1. Configurações (`Settings.tsx`)
**Antes:** "Rateio de Custos Gerais"
**Depois:** "Dividir Custos Gerais"

A descrição já está clara: "Como distribuir gastos gerais entre as plataformas"

### 2. Formulário de Despesa (`ExpenseForm.tsx`)
**Antes:** "Geral (rateio)"
**Depois:** "Geral (divide entre todas)"

Isso deixa claro que um gasto marcado como "Geral" será dividido entre todas as plataformas proporcionalmente.

### 3. Modal de Edição (`EditExpenseModal.tsx`)
Mesma alteração: "Geral (divide entre todas)"

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Settings.tsx` | "Rateio de Custos Gerais" → "Dividir Custos Gerais" |
| `src/components/forms/ExpenseForm.tsx` | "Geral (rateio)" → "Geral (divide entre todas)" |
| `src/components/history/EditExpenseModal.tsx` | "Geral (rateio)" → "Geral (divide entre todas)" |

---

## Resultado
Linguagem mais simples e acessível, sem termos técnicos que podem confundir o usuário.
