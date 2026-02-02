
# Plano: Aviso sobre Análise de Plataformas em Turnos Multi-Plataforma

## Contexto
Quando o motorista trabalha com mais de uma plataforma ao mesmo tempo (ex: 99 + Uber), os dados de horas e km são registrados de forma agregada. Isso significa que não é possível calcular métricas individuais por plataforma (R$/hora, R$/km) para identificar qual seria a mais rentável.

## O que será implementado

### 1. Aviso nos Formulários de Turno
Adicionar mensagem informativa que aparece **apenas quando mais de uma plataforma está selecionada**:

**No formulário de Turno (`ShiftForm.tsx`):**
- Após a seleção de plataformas, exibir um aviso amarelo/âmbar
- Texto: "Ao usar múltiplas plataformas, não será possível identificar qual é a mais rentável individualmente"
- Ícone de informação para chamar atenção

**No modal de Iniciar Turno (`StartShiftModal.tsx`):**
- Mesmo aviso quando 2+ plataformas são selecionadas

### 2. Aviso nos Relatórios de Melhor Dia/Plataforma
**No componente de análise (`BestTimesAnalysis.tsx`):**
- Adicionar nota informativa explicando que turnos com múltiplas plataformas não permitem análise individual

---

## Detalhes Técnicos

### Arquivos a modificar:
1. `src/components/forms/ShiftForm.tsx` - Adicionar aviso condicional
2. `src/components/shifts/StartShiftModal.tsx` - Adicionar aviso condicional  
3. `src/components/reports/BestTimesAnalysis.tsx` - Adicionar nota sobre limitação

### Componente de Aviso
Criar um bloco visual com:
- Fundo amarelo/âmbar translúcido
- Ícone `AlertTriangle` ou `Info`
- Texto explicativo curto e claro
- Só aparece quando `selectedPlatforms.length > 1`

### Exemplo de código:
```tsx
{selectedPlatforms.length > 1 && (
  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
    <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-amber-600 dark:text-amber-400">
      Ao usar múltiplas plataformas simultaneamente, não será possível identificar qual é a mais rentável individualmente nos relatórios.
    </p>
  </div>
)}
```
