import { VehicleType } from '@/types/database';

export interface VehicleData {
  name: string;
  type: VehicleType;
  consumptionCity: number; // km/l
  consumptionHighway: number; // km/l
}

// Base de dados de veículos populares no Brasil para motoristas de aplicativo
export const vehicleDatabase: VehicleData[] = [
  // Carros
  { name: 'Onix 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Onix 1.0 Turbo', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.5 },
  { name: 'HB20 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'HB20 1.0 Turbo', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Kwid 1.0', type: 'carro', consumptionCity: 13.0, consumptionHighway: 14.5 },
  { name: 'Mobi 1.0', type: 'carro', consumptionCity: 13.5, consumptionHighway: 14.5 },
  { name: 'Gol 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Gol 1.6', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Argo 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Argo 1.3', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Sandero 1.0', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Cronos 1.3', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Polo 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Polo 1.0 TSI', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.5 },
  { name: 'Virtus 1.0 TSI', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.5 },
  { name: 'Ka 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Ka 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Prisma 1.4', type: 'carro', consumptionCity: 10.5, consumptionHighway: 13.0 },
  { name: 'Etios 1.3', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.5 },
  { name: 'Etios 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Yaris 1.3', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.0 },
  { name: 'Yaris 1.5', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Corolla 2.0', type: 'carro', consumptionCity: 9.5, consumptionHighway: 12.0 },
  { name: 'Civic 2.0', type: 'carro', consumptionCity: 9.5, consumptionHighway: 12.0 },
  { name: 'Spin 1.8', type: 'carro', consumptionCity: 9.5, consumptionHighway: 11.5 },
  { name: 'Cobalt 1.4', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Logan 1.0', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Voyage 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Voyage 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.5 },
  
  // Motos
  { name: 'CG 160 Start', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'CG 160 Fan', type: 'moto', consumptionCity: 43.0, consumptionHighway: 48.0 },
  { name: 'CG 160 Titan', type: 'moto', consumptionCity: 42.0, consumptionHighway: 47.0 },
  { name: 'Factor 150', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Fazer 250', type: 'moto', consumptionCity: 32.0, consumptionHighway: 38.0 },
  { name: 'Bros 160', type: 'moto', consumptionCity: 38.0, consumptionHighway: 42.0 },
  { name: 'Pop 110', type: 'moto', consumptionCity: 50.0, consumptionHighway: 55.0 },
  { name: 'Biz 125', type: 'moto', consumptionCity: 48.0, consumptionHighway: 52.0 },
  { name: 'PCX 160', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'NMax 160', type: 'moto', consumptionCity: 38.0, consumptionHighway: 42.0 },
  { name: 'XRE 190', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
  { name: 'XRE 300', type: 'moto', consumptionCity: 28.0, consumptionHighway: 35.0 },
  { name: 'CB 250 Twister', type: 'moto', consumptionCity: 30.0, consumptionHighway: 35.0 },
  { name: 'Crosser 150', type: 'moto', consumptionCity: 38.0, consumptionHighway: 43.0 },
  { name: 'Lander 250', type: 'moto', consumptionCity: 28.0, consumptionHighway: 33.0 },
];

// Custo de manutenção por tipo de veículo (R$/km)
export const maintenanceCostPerKm: Record<VehicleType, number> = {
  carro: 0.08,
  moto: 0.04,
};

// Custo base de desgaste por tipo (R$/km)
export const wearCostPerKm: Record<VehicleType, number> = {
  carro: 0.05,
  moto: 0.02,
};

// Buscar veículos por nome (fuzzy search simples)
export function searchVehicles(query: string, type?: VehicleType): VehicleData[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return type ? vehicleDatabase.filter(v => v.type === type) : vehicleDatabase;
  }
  
  return vehicleDatabase.filter(vehicle => {
    const matchesType = type ? vehicle.type === type : true;
    const matchesQuery = vehicle.name.toLowerCase().includes(normalizedQuery);
    return matchesType && matchesQuery;
  });
}

// Obter veículos por tipo
export function getVehiclesByType(type: VehicleType): VehicleData[] {
  return vehicleDatabase.filter(v => v.type === type);
}

// Calcular custo por km
export interface CostBreakdown {
  fuelCost: number;
  maintenanceCost: number;
  wearCost: number;
  totalCost: number;
}

export function calculateCostPerKm(
  vehicle: VehicleData,
  fuelPrice: number,
  mileage?: number,
  useHighwayConsumption: boolean = false
): CostBreakdown {
  // Usar consumo médio entre cidade e estrada (mais realista para app drivers)
  const consumption = useHighwayConsumption 
    ? vehicle.consumptionHighway 
    : (vehicle.consumptionCity + vehicle.consumptionHighway) / 2;
  
  // Custo de combustível = preço do litro / consumo (km/l)
  const fuelCost = fuelPrice / consumption;
  
  // Custo de manutenção base
  let maintenanceCost = maintenanceCostPerKm[vehicle.type];
  
  // Custo de desgaste base
  let wearCost = wearCostPerKm[vehicle.type];
  
  // Ajuste por quilometragem (veículos com mais de 100k km têm +20% de custo)
  if (mileage && mileage > 100000) {
    const extraWearFactor = 1.2;
    maintenanceCost *= extraWearFactor;
    wearCost *= extraWearFactor;
  } else if (mileage && mileage > 50000) {
    // Entre 50k e 100k km: +10%
    const extraWearFactor = 1.1;
    maintenanceCost *= extraWearFactor;
    wearCost *= extraWearFactor;
  }
  
  const totalCost = fuelCost + maintenanceCost + wearCost;
  
  return {
    fuelCost: Math.round(fuelCost * 100) / 100,
    maintenanceCost: Math.round(maintenanceCost * 100) / 100,
    wearCost: Math.round(wearCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
