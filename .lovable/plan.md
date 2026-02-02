
# Plano: Adicionar Suporte a Bicicletas (Comum e Elétrica)

## Objetivo
Expandir o sistema para suportar bicicletas comuns e bicicletas elétricas como tipos de veículo, atendendo entregadores que utilizam esses meios de transporte.

---

## Escopo das Alterações

### 1. Banco de Dados (Migration)
Alterar o ENUM `vehicle_type` para incluir os novos tipos:
- `bicicleta` - Bicicleta comum
- `bicicleta_eletrica` - Bicicleta elétrica

### 2. Tipos TypeScript
Atualizar o tipo `VehicleType` em `src/types/database.ts`:
```typescript
export type VehicleType = 'carro' | 'moto' | 'bicicleta' | 'bicicleta_eletrica';
```

### 3. Dados de Veículos (`src/lib/vehicleData.ts`)
Adicionar modelos de bicicletas com custos apropriados:

**Bicicletas Comuns:**
- Bicicleta Comum (Simples)
- Bicicleta Comum (Com Bag)
- Bicicleta Speed/Road
- Bicicleta Mountain Bike

**Bicicletas Elétricas:**
- Caloi E-Vibe City
- Caloi E-Vibe Urbam
- Sense Impulse E-Trail
- Oggi Big Wheel 8.3 E-Bike
- Tembici E-Bike
- Modelo Genérico (E-Bike)

Definir custos específicos:
- **Manutenção**: R$ 0,02/km (bicicleta) e R$ 0,03/km (e-bike)
- **Desgaste**: R$ 0,01/km (ambas, menor que veículos motorizados)
- **Energia**: 0 para bicicleta comum, cálculo baseado em km/kWh para e-bikes

### 4. Calculadora de Custo (`VehicleCostCalculator.tsx`)
- Adicionar botões para selecionar "Bicicleta" e "E-Bike"
- Adaptar UI para 4 tipos (grid 2x2 ou scroll horizontal)
- Para bicicleta comum: mostrar apenas custos de manutenção e desgaste (sem combustível)
- Para e-bike: manter lógica similar à moto elétrica

### 5. Página de Configurações (`Settings.tsx`)
- Expandir seletor de tipo de veículo para 4 opções
- Usar grid 2x2 para manter boa UX mobile
- Ícones: usar `Bike` do lucide-react para ambos (ou um ícone diferenciado)

### 6. Outros Componentes
Atualizar ícones e referências em:
- `PlatformCard.tsx` - Adicionar ícone de bicicleta no mapa
- Qualquer lugar que renderize ícone baseado no tipo de veículo

---

## Lógica de Custo para Bicicletas

### Bicicleta Comum
- **Custo de energia**: R$ 0,00/km (esforço humano)
- **Manutenção**: R$ 0,02/km (pneus, corrente, freios)
- **Desgaste**: R$ 0,01/km (menor vida útil de peças)
- **Total estimado**: ~R$ 0,03/km

### Bicicleta Elétrica
- **Custo de energia**: ~R$ 0,01-0,02/km (bateria)
- **Manutenção**: R$ 0,03/km (inclui bateria e motor)
- **Desgaste**: R$ 0,01/km
- **Total estimado**: ~R$ 0,05-0,06/km

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/...` | Nova migration para alterar ENUM |
| `src/types/database.ts` | Adicionar novos tipos ao VehicleType |
| `src/lib/vehicleData.ts` | Adicionar dados de bicicletas e custos |
| `src/components/settings/VehicleCostCalculator.tsx` | Adaptar UI para 4 tipos |
| `src/pages/Settings.tsx` | Expandir seletor de veículos |
| `src/components/dashboard/PlatformCard.tsx` | Adicionar ícone bike ao mapa |

---

## Considerações Técnicas

1. **Migrations PostgreSQL**: Alterar ENUMs existentes requer usar `ALTER TYPE ... ADD VALUE`
2. **Retrocompatibilidade**: Usuários existentes mantêm seus tipos atuais
3. **UI Mobile**: O grid 2x2 funciona bem, mas pode considerar scroll horizontal se mais tipos forem adicionados futuramente
4. **Ícones**: Lucide tem o ícone `Bike` que pode representar bicicleta; para diferenciar e-bike, podemos usar `Zap` junto

---

## Benefícios

- Atende um público significativo de entregadores de bicicleta
- Custos muito menores por km (atrativo para cálculo de lucro real)
- Diferencial competitivo vs outros apps de controle financeiro
- Base para futura expansão (patinetes elétricos, etc.)
