
# Plano: Adicionar Ganhos e Gastos ao Finalizar Turno

## Contexto
Atualmente, quando o motorista finaliza um turno, o sistema apenas salva o registro de horas e km rodados, mas não oferece a opção de registrar os ganhos e gastos daquele período de trabalho. Isso não faz sentido porque o principal objetivo do turno é acompanhar a rentabilidade.

## Solução Proposta
Transformar o modal de "Finalizar Turno" em um fluxo de 2 etapas:

```text
+------------------+     +------------------------+     +-----------------------+
|  ETAPA 1         | --> |  ETAPA 2               | --> |  RESUMO FINAL         |
|  Km Final        |     |  Adicionar Ganhos/     |     |  (Toast com totais)   |
|                  |     |  Gastos (opcional)     |     |                       |
+------------------+     +------------------------+     +-----------------------+
```

## O que o motorista verá

### Etapa 1 - Km Final (como está hoje)
- Informar o km final do odômetro
- Ver o resumo de duração e km inicial
- Botão "Continuar" ao invés de "Finalizar"

### Etapa 2 - Registrar Ganhos e Gastos
- Card com resumo do turno (duração, km rodados, plataformas)
- Seção para adicionar ganhos rápidos:
  - Campo de valor
  - Quantidade de serviços
  - Já vem com a plataforma do turno selecionada
  - Botão "+ Adicionar Ganho"
  - Lista dos ganhos já adicionados nesse turno
- Seção para adicionar gastos rápidos:
  - Campo de valor
  - Categoria (combustível, alimentação, etc)
  - Botão "+ Adicionar Gasto"
  - Lista dos gastos já adicionados nesse turno
- Botão "Pular" para quem não quer adicionar nada
- Botão "Finalizar Turno" para salvar tudo

### Resumo Final
- Toast mostrando: "Turno finalizado! X horas, Y km, R$ Z em ganhos, R$ W em gastos"

## Arquivos a serem modificados

### 1. `src/components/shifts/EndShiftModal.tsx`
- Adicionar estado para controlar a etapa atual (`step: 1 | 2`)
- Adicionar estados para lista de ganhos e gastos temporários
- Criar interface simplificada para adicionar ganhos/gastos
- Modificar botão "Finalizar" da etapa 1 para "Continuar"
- Adicionar etapa 2 com formulários simplificados

### 2. `src/hooks/useActiveShift.tsx`
- Modificar `endShiftMutation` para aceitar lista de ganhos e gastos opcionais
- Salvar todos os registros juntos (turno + ganhos + gastos)
- Retornar totais no resultado para exibir no toast

## Detalhes Técnicos

### Estrutura dos dados temporários
```typescript
interface TempEarning {
  id: string; // UUID temporário para remover da lista
  amount: number;
  service_count: number;
  platform_id: string;
}

interface TempExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
}
```

### Fluxo de dados
1. Usuário preenche km final na etapa 1
2. Clica "Continuar" → vai para etapa 2
3. Pode adicionar múltiplos ganhos e gastos
4. Clica "Finalizar Turno" ou "Pular"
5. Hook salva tudo no banco:
   - Cria registro do turno (shifts)
   - Cria cada ganho (earnings) com data do turno
   - Cria cada gasto (expenses) com data do turno
6. Deleta o turno ativo (active_shifts)
7. Toast com resumo completo

### Considerações de UX
- Plataformas do turno já vêm pré-selecionadas nos ganhos
- Data já vem preenchida com a data do turno
- Formulário simplificado (apenas campos essenciais)
- Pode adicionar vários ganhos de uma vez
- Lista mostra o que já foi adicionado com opção de remover
- Botão "Pular" visível para quem quer finalizar rápido
