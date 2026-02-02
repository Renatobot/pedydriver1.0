
# Plano: Preço Âncora de R$ 29,90 no PIX

## Resumo
Atualizar a exibição de preços no card PRO e na seção de pagamento para mostrar o preço "original" de R$ 29,90 riscado, com o preço real de R$ 14,90 em destaque, criando uma percepção de 50% de desconto via PIX.

---

## Alterações Visuais

### Card PRO - Seção de Preço (linha 131-139)
**Antes:**
```
R$ 14,90/mês
ou R$ 99/ano (economize 45%)
```

**Depois:**
```
~R$ 29,90~ R$ 14,90/mês ← preço riscado + preço real
ou R$ 149/ano ~R$ 99~ (economize 34%) ← ajustar proporcionalmente
```

### Seção de Pagamento (linha 179-184)
**Antes:**
```
💳 Pagamento seguro via PIX ou Cartão
PIX sem taxa • Cartão com taxa da operadora
```

**Depois:**
```
💳 Pagamento seguro

PIX (sem taxa adicional)
~R$ 29,90~ → R$ 14,90/mês

Cartão de crédito
R$ 14,90/mês + taxa da operadora
```

---

## Estilo Visual

| Elemento | Estilo |
|----------|--------|
| R$ 29,90 riscado | `text-muted-foreground line-through text-lg` |
| R$ 14,90 real | `text-3xl font-bold text-emerald-500` (destaque verde) |
| Badge PIX | Pequeno badge verde "sem taxa" |
| Info cartão | Texto neutro, menor, discreto |

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Upgrade.tsx` | Atualizar exibição de preços com âncora de R$ 29,90 riscado |

---

## Implementação

1. Modificar a seção de preço do card PRO (linhas 131-139) para mostrar:
   - R$ 29,90 riscado em cinza
   - R$ 14,90 em destaque verde
   - Manter info do plano anual

2. Redesenhar a seção de pagamento (linhas 179-184) para:
   - Separar claramente PIX vs Cartão
   - Mostrar preço âncora riscado no PIX
   - Indicar taxa adicional no cartão de forma discreta
