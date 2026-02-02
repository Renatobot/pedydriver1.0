import { VehicleType } from '@/types/database';

export interface VehicleData {
  name: string;
  type: VehicleType;
  consumptionCity: number; // km/l ou km/kWh para elétricos
  consumptionHighway: number; // km/l ou km/kWh para elétricos
}

// Base de dados de veículos populares no Brasil para motoristas de aplicativo
export const vehicleDatabase: VehicleData[] = [
  // =============================================
  // CARROS A COMBUSTÃO - Populares para App
  // =============================================
  
  // Chevrolet
  { name: 'Onix 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Onix 1.0 Turbo', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.5 },
  { name: 'Onix Plus 1.0 Turbo', type: 'carro', consumptionCity: 11.5, consumptionHighway: 14.0 },
  { name: 'Prisma 1.4', type: 'carro', consumptionCity: 10.5, consumptionHighway: 13.0 },
  { name: 'Cobalt 1.4', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Cobalt 1.8', type: 'carro', consumptionCity: 9.5, consumptionHighway: 12.0 },
  { name: 'Spin 1.8', type: 'carro', consumptionCity: 9.5, consumptionHighway: 11.5 },
  { name: 'Tracker 1.0 Turbo', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.0 },
  
  // Hyundai
  { name: 'HB20 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'HB20 1.0 Turbo', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'HB20S 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'HB20S 1.0 Turbo', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Creta 1.0 Turbo', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  
  // Renault
  { name: 'Kwid 1.0', type: 'carro', consumptionCity: 13.0, consumptionHighway: 14.5 },
  { name: 'Sandero 1.0', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Sandero 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.0 },
  { name: 'Logan 1.0', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Logan 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.0 },
  { name: 'Stepway 1.0 Turbo', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Duster 1.3 Turbo', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.0 },
  
  // Fiat
  { name: 'Mobi 1.0', type: 'carro', consumptionCity: 13.5, consumptionHighway: 14.5 },
  { name: 'Argo 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Argo 1.3', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Cronos 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Cronos 1.3', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Pulse 1.0 Turbo', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'Fastback 1.0 Turbo', type: 'carro', consumptionCity: 11.0, consumptionHighway: 12.5 },
  { name: 'Strada 1.3', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Fiorino 1.4', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.0 },
  { name: 'Doblo 1.4', type: 'carro', consumptionCity: 9.0, consumptionHighway: 11.0 },
  { name: 'Doblo 1.8', type: 'carro', consumptionCity: 8.5, consumptionHighway: 10.5 },
  
  // Volkswagen
  { name: 'Gol 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Gol 1.6', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Voyage 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 13.5 },
  { name: 'Voyage 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.5 },
  { name: 'Polo 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Polo 1.0 TSI', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.5 },
  { name: 'Virtus 1.0 TSI', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.5 },
  { name: 'Nivus 1.0 TSI', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.0 },
  { name: 'T-Cross 1.0 TSI', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Taos 1.4 TSI', type: 'carro', consumptionCity: 9.5, consumptionHighway: 11.5 },
  
  // Ford
  { name: 'Ka 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Ka 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Ka Sedan 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Ka Sedan 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  
  // Toyota
  { name: 'Etios 1.3', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.5 },
  { name: 'Etios 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Etios Sedan 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Yaris 1.3', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.0 },
  { name: 'Yaris 1.5', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Yaris Sedan 1.5', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Corolla 2.0', type: 'carro', consumptionCity: 9.5, consumptionHighway: 12.0 },
  
  // Honda
  { name: 'City 1.5', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.5 },
  { name: 'Civic 2.0', type: 'carro', consumptionCity: 9.5, consumptionHighway: 12.0 },
  { name: 'HR-V 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'Fit 1.5', type: 'carro', consumptionCity: 11.5, consumptionHighway: 13.5 },
  { name: 'WR-V 1.5', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  
  // Nissan
  { name: 'Versa 1.6', type: 'carro', consumptionCity: 11.0, consumptionHighway: 13.0 },
  { name: 'Kicks 1.6', type: 'carro', consumptionCity: 10.5, consumptionHighway: 12.5 },
  { name: 'March 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'March 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.0 },
  
  // Peugeot/Citroën
  { name: 'Peugeot 208 1.0', type: 'carro', consumptionCity: 12.0, consumptionHighway: 14.0 },
  { name: 'Peugeot 208 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.5 },
  { name: 'Citroën C3 1.0', type: 'carro', consumptionCity: 12.5, consumptionHighway: 14.0 },
  { name: 'Citroën C3 1.6', type: 'carro', consumptionCity: 10.0, consumptionHighway: 12.0 },
  
  // Kia
  { name: 'Kia Bongo 2.5', type: 'carro', consumptionCity: 8.0, consumptionHighway: 10.0 },
  
  // =============================================
  // CARROS ELÉTRICOS E HÍBRIDOS (consumo em km/kWh)
  // =============================================
  { name: 'BYD Dolphin Mini (Elétrico)', type: 'carro', consumptionCity: 7.5, consumptionHighway: 8.5 },
  { name: 'BYD Dolphin (Elétrico)', type: 'carro', consumptionCity: 6.5, consumptionHighway: 7.5 },
  { name: 'BYD Yuan Plus (Elétrico)', type: 'carro', consumptionCity: 5.5, consumptionHighway: 6.5 },
  { name: 'Renault Kwid E-Tech (Elétrico)', type: 'carro', consumptionCity: 7.0, consumptionHighway: 8.0 },
  { name: 'Fiat 500e (Elétrico)', type: 'carro', consumptionCity: 6.0, consumptionHighway: 7.0 },
  { name: 'GWM Ora 03 (Elétrico)', type: 'carro', consumptionCity: 6.0, consumptionHighway: 7.0 },
  { name: 'JAC E-JS1 (Elétrico)', type: 'carro', consumptionCity: 6.5, consumptionHighway: 7.5 },
  { name: 'Caoa Chery iCar (Elétrico)', type: 'carro', consumptionCity: 6.0, consumptionHighway: 7.0 },
  { name: 'Toyota Corolla Hybrid (Híbrido)', type: 'carro', consumptionCity: 16.0, consumptionHighway: 14.5 },
  { name: 'Toyota Corolla Cross Hybrid (Híbrido)', type: 'carro', consumptionCity: 14.5, consumptionHighway: 13.0 },
  { name: 'Honda City Hybrid (Híbrido)', type: 'carro', consumptionCity: 17.0, consumptionHighway: 15.0 },
  
  // =============================================
  // MOTOS A COMBUSTÃO - Honda
  // =============================================
  { name: 'CG 125 Fan', type: 'moto', consumptionCity: 48.0, consumptionHighway: 53.0 },
  { name: 'CG 160 Start', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'CG 160 Fan', type: 'moto', consumptionCity: 43.0, consumptionHighway: 48.0 },
  { name: 'CG 160 Titan', type: 'moto', consumptionCity: 42.0, consumptionHighway: 47.0 },
  { name: 'Bros 160', type: 'moto', consumptionCity: 38.0, consumptionHighway: 42.0 },
  { name: 'Pop 110', type: 'moto', consumptionCity: 50.0, consumptionHighway: 55.0 },
  { name: 'Biz 125', type: 'moto', consumptionCity: 48.0, consumptionHighway: 52.0 },
  { name: 'Elite 125', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'PCX 160', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'ADV 160', type: 'moto', consumptionCity: 38.0, consumptionHighway: 42.0 },
  { name: 'SH 160i', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
  { name: 'XRE 190', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
  { name: 'XRE 300', type: 'moto', consumptionCity: 28.0, consumptionHighway: 35.0 },
  { name: 'CB 250 Twister', type: 'moto', consumptionCity: 30.0, consumptionHighway: 35.0 },
  { name: 'CB 300R Twister', type: 'moto', consumptionCity: 28.0, consumptionHighway: 33.0 },
  
  // =============================================
  // MOTOS A COMBUSTÃO - Yamaha
  // =============================================
  { name: 'Factor 125', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'Factor 150', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Fazer 150', type: 'moto', consumptionCity: 42.0, consumptionHighway: 47.0 },
  { name: 'Fazer 250', type: 'moto', consumptionCity: 32.0, consumptionHighway: 38.0 },
  { name: 'YBR 150', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Neo 125', type: 'moto', consumptionCity: 42.0, consumptionHighway: 47.0 },
  { name: 'Fluo 125', type: 'moto', consumptionCity: 44.0, consumptionHighway: 48.0 },
  { name: 'NMax 160', type: 'moto', consumptionCity: 38.0, consumptionHighway: 42.0 },
  { name: 'Crosser 150', type: 'moto', consumptionCity: 38.0, consumptionHighway: 43.0 },
  { name: 'Lander 250', type: 'moto', consumptionCity: 28.0, consumptionHighway: 33.0 },
  
  // =============================================
  // MOTOS A COMBUSTÃO - Shineray
  // =============================================
  { name: 'Shineray Phoenix 50', type: 'moto', consumptionCity: 55.0, consumptionHighway: 60.0 },
  { name: 'Shineray Jet 125', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'Shineray Worker 150', type: 'moto', consumptionCity: 42.0, consumptionHighway: 47.0 },
  { name: 'Shineray SHI 175', type: 'moto', consumptionCity: 38.0, consumptionHighway: 43.0 },
  { name: 'Shineray XY 150-5', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Shineray XY 200-5', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
  
  // =============================================
  // MOTOS A COMBUSTÃO - Outras Marcas
  // =============================================
  { name: 'Dafra Apache 150', type: 'moto', consumptionCity: 38.0, consumptionHighway: 43.0 },
  { name: 'Dafra NH 190', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
  { name: 'Haojue DK 160', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Haojue DR 160', type: 'moto', consumptionCity: 38.0, consumptionHighway: 43.0 },
  { name: 'Bajaj Dominar 250', type: 'moto', consumptionCity: 30.0, consumptionHighway: 35.0 },
  { name: 'Suzuki Intruder 125', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'Suzuki Burgman 125', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  
  // =============================================
  // MOTOS ELÉTRICAS (consumo em km/kWh)
  // =============================================
  { name: 'Voltz EV1 (Elétrico)', type: 'moto', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'Voltz EVS (Elétrico)', type: 'moto', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Shineray SE3 (Elétrico)', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },
  { name: 'Super Soco TC Max (Elétrico)', type: 'moto', consumptionCity: 30.0, consumptionHighway: 35.0 },
  { name: 'NIU NQi GTS (Elétrico)', type: 'moto', consumptionCity: 35.0, consumptionHighway: 40.0 },

  // =============================================
  // BICICLETAS COMUNS
  // =============================================
  { name: 'Bicicleta Comum (Simples)', type: 'bicicleta', consumptionCity: 0, consumptionHighway: 0 },
  { name: 'Bicicleta Comum (Com Bag)', type: 'bicicleta', consumptionCity: 0, consumptionHighway: 0 },
  { name: 'Bicicleta Speed/Road', type: 'bicicleta', consumptionCity: 0, consumptionHighway: 0 },
  { name: 'Bicicleta Mountain Bike', type: 'bicicleta', consumptionCity: 0, consumptionHighway: 0 },
  { name: 'Bicicleta Fixa/Single Speed', type: 'bicicleta', consumptionCity: 0, consumptionHighway: 0 },
  { name: 'Bicicleta Cargo/Cargueira', type: 'bicicleta', consumptionCity: 0, consumptionHighway: 0 },

  // =============================================
  // BICICLETAS ELÉTRICAS (consumo em km/kWh)
  // =============================================
  { name: 'Caloi E-Vibe City (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 50.0, consumptionHighway: 55.0 },
  { name: 'Caloi E-Vibe Urbam (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'Caloi E-Vibe Easy Rider (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 48.0, consumptionHighway: 53.0 },
  { name: 'Sense Impulse E-Trail (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 40.0, consumptionHighway: 45.0 },
  { name: 'Oggi Big Wheel 8.3 E-Bike (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 38.0, consumptionHighway: 42.0 },
  { name: 'Tembici E-Bike (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 55.0, consumptionHighway: 60.0 },
  { name: 'Muuv Veloster (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 42.0, consumptionHighway: 47.0 },
  { name: 'Vibe Bikes V1 (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 45.0, consumptionHighway: 50.0 },
  { name: 'E-Bike Genérica (Elétrico)', type: 'bicicleta_eletrica', consumptionCity: 45.0, consumptionHighway: 50.0 },
];

// Custo de manutenção por tipo de veículo (R$/km)
export const maintenanceCostPerKm: Record<VehicleType, number> = {
  carro: 0.08,
  moto: 0.04,
  bicicleta: 0.02,
  bicicleta_eletrica: 0.03,
};

// Custo de manutenção reduzido para veículos elétricos (R$/km)
export const electricMaintenanceCostPerKm: Record<VehicleType, number> = {
  carro: 0.03,
  moto: 0.02,
  bicicleta: 0.02,
  bicicleta_eletrica: 0.03,
};

// Custo base de desgaste por tipo (R$/km)
export const wearCostPerKm: Record<VehicleType, number> = {
  carro: 0.05,
  moto: 0.02,
  bicicleta: 0.01,
  bicicleta_eletrica: 0.01,
};

// Custo de desgaste reduzido para veículos elétricos (R$/km)
export const electricWearCostPerKm: Record<VehicleType, number> = {
  carro: 0.02,
  moto: 0.01,
  bicicleta: 0.01,
  bicicleta_eletrica: 0.01,
};

// Preços de referência
export const DEFAULT_FUEL_PRICE = 5.89; // R$/L gasolina
export const DEFAULT_ELECTRICITY_PRICE = 0.85; // R$/kWh residencial

// Detectar se veículo é elétrico ou híbrido
export function isElectricVehicle(vehicle: VehicleData): boolean {
  return vehicle.name.includes('(Elétrico)') || vehicle.name.includes('(Híbrido)') || vehicle.type === 'bicicleta_eletrica';
}

// Detectar se é bicicleta comum (sem custo de energia)
export function isBicycle(vehicle: VehicleData): boolean {
  return vehicle.type === 'bicicleta';
}

// Detectar se o veículo tem custo de energia (não é bicicleta comum)
export function hasEnergyCost(vehicle: VehicleData): boolean {
  return vehicle.type !== 'bicicleta';
}

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

// Obter unidade de consumo baseado no tipo de veículo
export function getConsumptionUnit(vehicle: VehicleData): string {
  return isElectricVehicle(vehicle) ? 'km/kWh' : 'km/l';
}

// Obter label de energia baseado no tipo de veículo
export function getEnergyLabel(vehicle: VehicleData): string {
  return isElectricVehicle(vehicle) ? 'Energia' : 'Combustível';
}

// Obter label de preço baseado no tipo de veículo
export function getEnergyPriceLabel(vehicle: VehicleData): string {
  return isElectricVehicle(vehicle) ? 'R$/kWh' : 'R$/L';
}

// Calcular custo por km
export interface CostBreakdown {
  fuelCost: number;
  maintenanceCost: number;
  wearCost: number;
  totalCost: number;
  isElectric: boolean;
  isBicycle: boolean;
}

export function calculateCostPerKm(
  vehicle: VehicleData,
  fuelPrice: number,
  mileage?: number,
  useHighwayConsumption: boolean = false
): CostBreakdown {
  const isElectric = isElectricVehicle(vehicle);
  const isBike = isBicycle(vehicle);
  
  // Para bicicletas comuns, não há custo de energia
  let fuelCost = 0;
  
  if (!isBike) {
    // Usar consumo médio entre cidade e estrada (mais realista para app drivers)
    const consumption = useHighwayConsumption 
      ? vehicle.consumptionHighway 
      : (vehicle.consumptionCity + vehicle.consumptionHighway) / 2;
    
    // Custo de combustível/energia = preço por unidade / consumo
    fuelCost = consumption > 0 ? fuelPrice / consumption : 0;
  }
  
  // Custo de manutenção base (menor para elétricos)
  let maintenanceCost = isElectric 
    ? electricMaintenanceCostPerKm[vehicle.type]
    : maintenanceCostPerKm[vehicle.type];
  
  // Custo de desgaste base (menor para elétricos)
  let wearCost = isElectric
    ? electricWearCostPerKm[vehicle.type]
    : wearCostPerKm[vehicle.type];
  
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
    isElectric,
    isBicycle: isBike,
  };
}
