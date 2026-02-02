
# Plano: Correção do Nome/Logo e Valor Bruto no ProfitCard

## Problema 1: Nome e Logo do PWA

### Diagnóstico
Os arquivos de configuração (`manifest.json`, `index.html`) já estão corretos com o nome "PEDY Driver". O problema está nos **ícones do PWA** que provavelmente ainda são os ícones padrão do Lovable:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

### Solução
Substituir os ícones por novos ícones personalizados do PEDY Driver. O design seguirá o estilo do favicon.svg existente:
- Fundo escuro (#0f1419)
- Gradiente verde (#10b981 → #059669)
- Símbolo de check/dinheiro

### Arquivos a modificar
| Arquivo | Ação |
|---------|------|
| `public/icons/icon-192.png` | Substituir por ícone PEDY Driver |
| `public/icons/icon-512.png` | Substituir por ícone PEDY Driver |

---

## Problema 2: ProfitCard sem Valor Bruto

### Diagnóstico
O componente `ProfitCard.tsx` mostra apenas o lucro líquido:
```typescript
<ProfitCard value={metrics.realProfit} />
```

O usuário quer ver também o valor bruto (receita total) para comparação.

### Solução
Atualizar o `ProfitCard` para aceitar e exibir um valor secundário (bruto), similar ao que foi implementado no `MetricCard`. Isso inclui:
1. Adicionar prop `secondaryValue` opcional
2. Exibir o valor bruto abaixo do líquido
3. Adicionar tooltip explicativo

### Arquivos a modificar
| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/ProfitCard.tsx` | Adicionar suporte a valor bruto |
| `src/pages/Dashboard.tsx` | Passar `totalRevenue` como valor secundário |

---

## Implementação Detalhada

### ProfitCard Atualizado

O card principal mostrará:
- **Valor grande**: Lucro Real (líquido)
- **Valor secundário**: Receita Bruta (para comparação)
- **Tooltip**: Explicação da diferença

Layout visual:
```text
+--------------------------------------------------+
| LUCRO REAL                              [↑/↓]    |
|                                                  |
|            R$ 450,00    (líquido)                |
|            R$ 680,00 bruto                       |
+--------------------------------------------------+
```

### Uso no Dashboard

```typescript
<ProfitCard 
  value={metrics.realProfit}           // Líquido (principal)
  secondaryValue={metrics.totalRevenue} // Bruto (secundário)
/>
```

---

## Resultado Final

1. **PWA**: Ícones personalizados PEDY Driver aparecerão quando o usuário instalar o app
2. **Dashboard**: Card principal mostrará lucro líquido E receita bruta para fácil comparação
