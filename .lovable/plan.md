
# Plano: Melhorar Aviso de Multiplataforma

## Situação Atual
O aviso já existe (linhas 156-163), mas é muito resumido. Precisa explicar melhor a lógica de cálculo.

## O que será alterado

Expandir o texto do aviso que aparece quando o usuário PRO seleciona mais de uma plataforma:

**Texto atual:**
> "Ao usar múltiplas plataformas simultaneamente, não será possível identificar qual é a mais rentável individualmente nos relatórios."

**Novo texto (mais completo):**
> "Ao usar múltiplas plataformas, horas e km serão distribuídos proporcionalmente pela receita de cada uma. O sistema não conseguirá identificar qual é mais rentável. Para análise individual, registre os ganhos de cada plataforma separadamente."

## Arquivo a modificar

`src/components/shifts/StartShiftModal.tsx` - linhas 156-163

Apenas alterar o texto dentro do parágrafo existente, mantendo o mesmo estilo visual (ícone Info, fundo amber, etc).
