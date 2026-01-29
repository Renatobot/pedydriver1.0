

# Plano: Corrigir Unidades para Veículos Elétricos

## Problema Identificado

A interface está usando **km/l** (quilômetros por litro) para veículos elétricos, mas eles consomem **kWh** (quilowatt-hora) e não litros de combustível.

### Pontos a Corrigir

| Local | Problema | Correção |
|-------|----------|----------|
| Lista de veículos | "120 km/l cidade" | "8.3 km/kWh cidade" |
| Campo de preço | "Preço do Combustível (R$/L)" | "Preço da Energia (R$/kWh)" |
| Resultado | "Combustível" | "Energia" |
| Ícone | Fuel (bomba) | Zap (raio) para elétricos |

---

## Dados Corrigidos para Elétricos

Os valores atuais estão invertidos. Para elétricos, o consumo é medido em **km/kWh** (quantos km roda por kWh):

| Modelo | Atual (errado) | Correto |
|--------|----------------|---------|
| BYD Dolphin Mini | 120 km/l | ~8.0 km/kWh |
| BYD Dolphin | 100 km/l | ~6.5 km/kWh |
| Voltz EV1 | 80 km/l | ~50 km/kWh |

Os valores precisam ser ajustados para refletir dados reais de consumo.

---

## Arquivos a Modificar

### 1. src/lib/vehicleData.ts

**Alterar interface para indicar unidade:**

```typescript
export interface VehicleData {
  name: string;
  type: VehicleType;
  consumptionCity: number;
  consumptionHighway: number;
  isElectric?: boolean; // Nova flag explícita
}
```

**Corrigir valores de consumo dos elétricos:**

Valores reais aproximados:
- BYD Dolphin Mini: 7.5 km/kWh
- BYD Dolphin: 6.5 km/kWh  
- BYD Yuan Plus: 5.5 km/kWh
- Voltz EV1: 50 km/kWh (motos elétricas são muito eficientes)
- etc.

### 2. src/lib/vehicleData.ts - Função helper

Adicionar funções auxiliares:

```typescript
export function getConsumptionUnit(vehicle: VehicleData): string {
  return isElectricVehicle(vehicle) ? 'km/kWh' : 'km/l';
}

export function getEnergyLabel(vehicle: VehicleData): string {
  return isElectricVehicle(vehicle) ? 'Energia' : 'Combustível';
}

export function getEnergyPriceLabel(vehicle: VehicleData): string {
  return isElectricVehicle(vehicle) ? 'R$/kWh' : 'R$/L';
}
```

### 3. src/components/settings/VehicleCostCalculator.tsx

**Na listagem de veículos (linha 130):**

De:
```tsx
{vehicle.name} ({vehicle.consumptionCity} km/l cidade)
```

Para:
```tsx
{vehicle.name} ({vehicle.consumptionCity} {getConsumptionUnit(vehicle)} cidade)
```

**No campo de preço (linhas 139-155):**

Tornar dinâmico baseado no veículo selecionado:
- Label: "Preço do Combustível (R$/L)" ou "Preço da Energia (R$/kWh)"
- Placeholder: "5.89" ou "0.85" (preço médio kWh residencial)
- Ícone: Fuel ou Zap

**No resultado (linha 196-204):**

- Label: "Combustível" ou "Energia"
- Ícone: orange Fuel ou yellow Zap

---

## Preços de Referência

Adicionar constantes com preços médios:

```typescript
export const DEFAULT_FUEL_PRICE = 5.89; // R$/L gasolina
export const DEFAULT_ELECTRICITY_PRICE = 0.85; // R$/kWh residencial
```

---

## Implementação

### Ordem de Execução

1. Atualizar valores de consumo dos elétricos em `vehicleData.ts`
2. Adicionar funções helper para labels dinâmicos
3. Modificar `VehicleCostCalculator.tsx` para usar labels dinâmicos
4. Adicionar lógica para trocar preço default quando selecionar elétrico

### Mudanças Detalhadas

**vehicleData.ts - Elétricos corrigidos:**

```typescript
// CARROS ELÉTRICOS (km/kWh)
{ name: 'BYD Dolphin Mini (Elétrico)', type: 'carro', consumptionCity: 7.5, consumptionHighway: 8.5 },
{ name: 'BYD Dolphin (Elétrico)', type: 'carro', consumptionCity: 6.5, consumptionHighway: 7.5 },
{ name: 'BYD Yuan Plus (Elétrico)', type: 'carro', consumptionCity: 5.5, consumptionHighway: 6.5 },
{ name: 'Renault Kwid E-Tech (Elétrico)', type: 'carro', consumptionCity: 7.0, consumptionHighway: 8.0 },
{ name: 'Fiat 500e (Elétrico)', type: 'carro', consumptionCity: 6.0, consumptionHighway: 7.0 },
{ name: 'GWM Ora 03 (Elétrico)', type: 'carro', consumptionCity: 6.0, consumptionHighway: 7.0 },
{ name: 'JAC E-JS1 (Elétrico)', type: 'carro', consumptionCity: 6.5, consumptionHighway: 7.5 },
{ name: 'Caoa Chery iCar (Elétrico)', type: 'carro', consumptionCity: 6.0, consumptionHighway: 7.0 },

// MOTOS ELÉTRICAS (km/kWh) - muito mais eficientes
{ name: 'Voltz EV1 (Elétrico)', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
{ name: 'Voltz EVS (Elétrico)', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
{ name: 'Shineray SE3 (Elétrico)', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
{ name: 'Super Soco TC Max (Elétrico)', type: 'moto', consumptionCity: 30.0, consumptionHighway: 35.0 },
{ name: 'NIU NQi GTS (Elétrico)', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
```

**VehicleCostCalculator.tsx - UI dinâmica:**

```tsx
// Importar funções helper
import { 
  getVehiclesByType, 
  VehicleData, 
  calculateCostPerKm, 
  CostBreakdown,
  isElectricVehicle,
  getConsumptionUnit,
  DEFAULT_FUEL_PRICE,
  DEFAULT_ELECTRICITY_PRICE
} from '@/lib/vehicleData';

// No Select de veículos
<SelectItem key={vehicle.name} value={vehicle.name}>
  {vehicle.name} ({vehicle.consumptionCity} {getConsumptionUnit(vehicle)} cidade)
</SelectItem>

// No campo de preço
<Label>
  {selectedVehicle && isElectricVehicle(selectedVehicle) ? (
    <>
      <Zap className="w-4 h-4" />
      Preço da Energia (R$/kWh)
    </>
  ) : (
    <>
      <Fuel className="w-4 h-4" />
      Preço do Combustível (R$/L)
    </>
  )}
</Label>

// No resultado
<div className="flex items-center gap-2">
  {result.isElectric ? (
    <Zap className="w-4 h-4 text-yellow-500" />
  ) : (
    <Fuel className="w-4 h-4 text-orange-500" />
  )}
  <span>{result.isElectric ? 'Energia' : 'Combustível'}</span>
</div>
```

---

## Resultado Esperado

**Antes (veículo elétrico):**
```
BYD Dolphin (120 km/l cidade)
Preço do Combustível (R$/L): 5.89
→ Combustível: R$ 0.05/km
```

**Depois (veículo elétrico):**
```
BYD Dolphin (6.5 km/kWh cidade)
Preço da Energia (R$/kWh): 0.85
→ Energia: R$ 0.13/km
```

