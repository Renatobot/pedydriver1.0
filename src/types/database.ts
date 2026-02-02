export type VehicleType = 'carro' | 'moto' | 'bicicleta' | 'bicicleta_eletrica';
export type CostDistributionRule = 'km' | 'horas' | 'receita';
export type ServiceType = 'corrida' | 'entrega' | 'outro';
export type EarningType = 'corrida_entrega' | 'gorjeta' | 'bonus' | 'ajuste';
export type PaymentType = 'imediato' | 'app';
export type ExpenseCategory = 'combustivel' | 'manutencao' | 'alimentacao' | 'seguro' | 'aluguel' | 'aluguel_veiculo' | 'financiamento' | 'internet' | 'pedagio_estacionamento' | 'outros';

export interface Platform {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Earning {
  id: string;
  user_id: string;
  date: string;
  platform_id: string | null;
  service_type: ServiceType;
  earning_type: EarningType;
  payment_type: PaymentType;
  amount: number;
  service_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  platform?: Platform;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  platform_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  platform?: Platform;
}

export interface Shift {
  id: string;
  user_id: string;
  date: string;
  platform_id: string | null;
  platform_ids: string[] | null;
  hours_worked: number;
  km_driven: number;
  created_at: string;
  updated_at: string;
  platform?: Platform;
  platforms?: Platform[];
}

export interface UserSettings {
  id: string;
  user_id: string;
  cost_per_km: number;
  vehicle_type: VehicleType;
  vehicle_model: string | null;
  cost_distribution_rule: CostDistributionRule;
  week_starts_on: 'domingo' | 'segunda';
  weekly_goal_earnings: number;
  weekly_goal_services: number;
  weekly_goal_km: number;
  weekly_goal_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalRevenue: number;
  immediateRevenue: number;
  appRevenue: number;
  totalExpenses: number;
  realProfit: number;
  totalServices: number;
  revenuePerHour: number;
  revenuePerKm: number;
  totalHours: number;
  totalKm: number;
}

export interface PlatformMetrics {
  platform: Platform;
  revenue: number;
  directExpenses: number;
  sharedExpenses: number;
  kmCost: number;
  profit: number;
  services: number;
  avgPerService: number;
  hours: number;
  km: number;
  revenuePerHour: number;
  revenuePerKm: number;
}
