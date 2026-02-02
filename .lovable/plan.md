
# Plano: Distribuir Custos Proporcionalmente por Receita

## O Problema

Atualmente, o código filtra turnos diretamente por `platform_id`:
```typescript
const platformShifts = shifts.filter(s => s.platform_id === platformId);
const hours = platformShifts.reduce(...);
const km = platformShifts.reduce(...);
```

Isso faz com que **uma plataforma carregue 100% dos custos** (todas as horas e KMs) enquanto outras aparecem com 0h e 0km, distorcendo completamente o lucro.

---

## A Solução: Distribuição por Receita

**Lógica simples:**
- Se você ganhou R$ 500 no Uber (71%) e R$ 200 no 99 (29%)
- Provavelmente rodou 71% do tempo/km no Uber e 29% no 99
- Distribuir os custos proporcionalmente

**Exemplo prático:**
| Plataforma | Receita | % do Total | Horas (de 10h) | KM (de 100km) |
|------------|---------|------------|----------------|---------------|
| Uber       | R$ 500  | 71%        | 7,1h           | 71km          |
| 99         | R$ 200  | 29%        | 2,9h           | 29km          |

---

## Alteração Técnica

Modificar `src/hooks/useDashboard.tsx` na função `platformMetrics`:

**ANTES (linha 133-139):**
```typescript
const platformShifts = shifts.filter(s => s.platform_id === platformId);
const hours = platformShifts.reduce((sum, s) => sum + Number(s.hours_worked), 0);
const km = platformShifts.reduce((sum, s) => sum + Number(s.km_driven), 0);
```

**DEPOIS:**
```typescript
// Calcular proporção baseada na receita desta plataforma
const revenueShare = totalRevenue > 0 ? revenue / totalRevenue : 0;

// Distribuir horas e KMs proporcionalmente pela receita
const hours = totalHours * revenueShare;
const km = totalKm * revenueShare;
```

---

## Benefícios

1. **Justiça**: Nenhuma plataforma "carrega" todos os custos sozinha
2. **Realismo**: Quem gera mais receita provavelmente consumiu mais tempo/km
3. **Simplicidade**: Não precisa que o usuário informe manualmente
4. **Compatibilidade**: Funciona para turnos únicos com múltiplas plataformas ou turnos separados

---

## Resultado Esperado

Com os dados da imagem (R$ 320 Uber + R$ 120 99):
- **Uber**: 73% da receita → 73% dos custos → lucro proporcional
- **99**: 27% da receita → 27% dos custos → lucro proporcional

Ambas mostrarão lucro positivo (se a operação total foi lucrativa), refletindo a realidade.

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDashboard.tsx` | Calcular horas/km por proporção de receita em vez de filtrar por platform_id |
