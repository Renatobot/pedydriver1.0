
# Suporte a Tipos de Combustível

## Resumo
Adicionar a opção de escolher o tipo de combustível (Gasolina, Etanol, GNV) nas Configurações e na Calculadora de Custo por Km, para que o cálculo reflita o combustível real utilizado pelo motorista.

---

## O que será implementado

### 1. Seletor de tipo de combustível nas Configurações
Um novo campo abaixo do modelo do veículo onde o usuário escolhe:
- **Gasolina** (padrão)
- **Etanol**
- **GNV** (Gás Natural Veicular)

Este campo só aparece para veículos a combustão (carros e motos não-elétricos).

### 2. Atualização da Calculadora de Custo
A calculadora passará a:
- Mostrar o tipo de combustível selecionado pelo usuário
- Usar o preço de referência correto para cada tipo
- Ajustar o consumo automaticamente para etanol (que rende ~30% menos que gasolina)

### 3. Preços de referência por combustível
| Combustível | Preço Sugerido |
|-------------|----------------|
| Gasolina    | R$ 5,89/L     |
| Etanol      | R$ 3,89/L     |
| GNV         | R$ 3,99/m³    |

---

## Fluxo do usuário

```text
Configurações
    │
    ├── Tipo de Veículo: [Carro] [Moto] [Bicicleta] [E-Bike]
    │
    ├── Modelo: [Onix 1.0 ▼]
    │
    ├── Combustível: [Gasolina ▼]  ← NOVO CAMPO
    │                  - Gasolina
    │                  - Etanol
    │                  - GNV
    │
    └── Custo por Km: [0.50]
            │
            └── [Calcular meu custo] → Abre calculadora
                                        com combustível
                                        pré-selecionado
```

---

## Detalhes Técnicos

### Banco de Dados
Adicionar uma nova coluna `fuel_type` na tabela `user_settings`:
- Tipo: `text`
- Valores permitidos: `gasolina`, `etanol`, `gnv`, `eletrico`
- Valor padrão: `gasolina`

### Arquivos a serem modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/types/database.ts` | Novo tipo `FuelType` e campo em `UserSettings` |
| `src/lib/vehicleData.ts` | Novos preços de referência + fator de ajuste para etanol |
| `src/pages/Settings.tsx` | Adicionar seletor de combustível |
| `src/components/settings/VehicleCostCalculator.tsx` | Suporte a tipo de combustível no cálculo |

### Lógica de ajuste de consumo
O etanol tem eficiência ~30% menor que a gasolina. Isso será considerado no cálculo:

```
Consumo efetivo (etanol) = consumo_gasolina × 0.70
```

Para GNV, o consumo é similar à gasolina em termos de km/m³.

### Quando mostrar o seletor
O campo de combustível só aparece quando:
- Veículo é **carro** ou **moto**
- Modelo selecionado **NÃO** é elétrico ou híbrido

---

## Comportamento esperado

1. **Usuário seleciona Carro → Onix 1.0**
   - Aparece seletor de combustível: Gasolina (padrão)
   
2. **Usuário muda para Etanol**
   - Preço de referência muda para R$ 3,89
   - Ao calcular, sistema aplica fator de 0.70 no consumo
   
3. **Usuário seleciona veículo elétrico**
   - Seletor de combustível fica oculto
   - Sistema usa preço de energia (R$/kWh)

4. **Configuração persiste**
   - Ao reabrir Configurações ou Calculadora, combustível escolhido aparece selecionado
