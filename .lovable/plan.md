
# Calculadora de Custo por KM do Veículo

## Objetivo
Adicionar uma funcionalidade que ajuda o usuário a calcular o custo estimado por quilômetro do seu veículo, informando apenas o modelo. O sistema irá considerar consumo de combustível, manutenção e desgaste para chegar a um valor realista.

## Como Funcionará

O usuário clicará em um botão "Calcular meu custo" na tela de Configurações. Um modal será aberto onde ele poderá:

1. Selecionar o tipo de veículo (Carro ou Moto)
2. Informar o modelo/marca ou selecionar de uma lista pré-definida
3. Informar o preço médio do combustível na sua região
4. Opcionalmente informar a quilometragem atual do veículo

O sistema então calculará o custo por km baseado em:
- **Combustível**: Consumo médio do modelo (km/l) × preço do combustível
- **Manutenção preventiva**: Custo médio de manutenção por km baseado no tipo de veículo
- **Desgaste/Depreciação**: Estimativa de desgaste de pneus, freios, etc.

## Fluxo do Usuário

```text
┌─────────────────────────────────────────┐
│         Tela de Configurações           │
│                                         │
│  Custo por Km: R$ 0,50                  │
│  [  Não sabe? Calcular meu custo   ]    │
│                                         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Modal: Calculadora de Custo        │
│                                         │
│  Tipo: [Carro] [Moto]                   │
│                                         │
│  Modelo do veículo:                     │
│  [  Ex: Onix, HB20, Fazer 250...   ]    │
│                                         │
│  Preço do combustível (R$/L):           │
│  [  5.89  ]                             │
│                                         │
│  Km rodados (opcional):                 │
│  [  50000  ]                            │
│                                         │
│  [    Calcular Custo    ]               │
│                                         │
│  ─────────────────────────────          │
│  Resultado:                             │
│  Combustível: R$ 0,42/km                │
│  Manutenção:  R$ 0,08/km                │
│  Desgaste:    R$ 0,05/km                │
│  ─────────────────────────────          │
│  TOTAL:       R$ 0,55/km                │
│                                         │
│  [  Usar este valor  ]                  │
└─────────────────────────────────────────┘
```

## Dados de Veículos

Criaremos uma base de dados local com os veículos mais populares no Brasil para motoristas de aplicativo:

**Carros populares:**
| Modelo | Consumo Cidade (km/l) | Consumo Estrada (km/l) |
|--------|----------------------|------------------------|
| Onix 1.0 | 12.5 | 14.0 |
| HB20 1.0 | 12.0 | 13.5 |
| Kwid 1.0 | 13.0 | 14.5 |
| Mobi 1.0 | 13.5 | 14.5 |
| Gol 1.0 | 12.0 | 13.5 |
| Argo 1.0 | 12.0 | 13.5 |
| Sandero 1.0 | 11.5 | 13.0 |
| Cronos 1.3 | 11.0 | 13.0 |

**Motos populares:**
| Modelo | Consumo (km/l) |
|--------|---------------|
| CG 160 | 45.0 |
| Factor 150 | 40.0 |
| Fazer 250 | 32.0 |
| Bros 160 | 38.0 |
| Pop 110 | 50.0 |
| Biz 125 | 48.0 |

## Fórmula de Cálculo

```text
Custo Total por Km = Custo Combustível + Custo Manutenção + Custo Desgaste

Onde:
- Custo Combustível = Preço do Litro / Consumo Médio (km/l)
- Custo Manutenção = Valor fixo por tipo (Carro: R$0,08/km | Moto: R$0,04/km)
- Custo Desgaste = Ajustado pela quilometragem (veículos > 100k km têm +20%)
```

## Componentes a Criar

1. **`VehicleCostCalculator.tsx`** - Modal com o formulário e cálculo
2. **`vehicleData.ts`** - Base de dados com consumo dos veículos populares
3. **Atualização em `Settings.tsx`** - Adicionar botão para abrir a calculadora

---

## Detalhes Técnicos

### Arquivos a Criar

**1. `src/lib/vehicleData.ts`**
- Lista de veículos populares com dados de consumo
- Função para buscar veículo por nome (fuzzy search)
- Constantes de custo de manutenção por tipo

**2. `src/components/settings/VehicleCostCalculator.tsx`**
- Componente de modal usando Dialog do shadcn/ui
- Formulário com react-hook-form + zod
- Autocomplete/Select para seleção de modelo
- Exibição detalhada do cálculo
- Botão para aplicar o valor calculado às configurações

### Modificações em Arquivos Existentes

**`src/pages/Settings.tsx`**
- Importar e renderizar VehicleCostCalculator
- Adicionar estado para controlar abertura do modal
- Adicionar botão "Calcular meu custo" abaixo do input de custo por km

