import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FuelType } from '@/types/database';
import { FUEL_PRICES } from '@/lib/vehicleData';
import { LocationData } from '@/hooks/useGeolocation';

export interface FuelPriceStats {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
  lastUpdated: string | null;
}

export interface FuelPriceContribution {
  fuelType: FuelType;
  price: number;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

export function useFuelPrices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [currentFuelType, setCurrentFuelType] = useState<FuelType>('gasolina');

  // Buscar preço médio da região
  const { data: priceStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['fuel-prices', currentLocation?.state, currentLocation?.city, currentFuelType],
    queryFn: async (): Promise<FuelPriceStats | null> => {
      if (!currentLocation?.state) return null;

      // Primeiro tentar buscar por cidade
      const { data: cityData, error: cityError } = await supabase
        .rpc('get_average_fuel_price', {
          _state: currentLocation.state,
          _city: currentLocation.city,
          _fuel_type: currentFuelType,
          _days_ago: 30
        });

      if (cityError) {
        console.error('Erro ao buscar preço por cidade:', cityError);
      }

      // Se tiver dados da cidade com amostras suficientes, usar
      if (cityData && cityData.length > 0 && cityData[0].sample_count >= 3) {
        const row = cityData[0];
        return {
          avgPrice: Number(row.avg_price) || FUEL_PRICES[currentFuelType],
          minPrice: Number(row.min_price) || 0,
          maxPrice: Number(row.max_price) || 0,
          sampleCount: Number(row.sample_count) || 0,
          lastUpdated: row.last_updated
        };
      }

      // Senão, buscar por estado (região mais ampla)
      const { data: stateData, error: stateError } = await supabase
        .rpc('get_average_fuel_price', {
          _state: currentLocation.state,
          _city: null,
          _fuel_type: currentFuelType,
          _days_ago: 30
        });

      if (stateError) {
        console.error('Erro ao buscar preço por estado:', stateError);
        return null;
      }

      if (stateData && stateData.length > 0 && stateData[0].sample_count > 0) {
        const row = stateData[0];
        return {
          avgPrice: Number(row.avg_price) || FUEL_PRICES[currentFuelType],
          minPrice: Number(row.min_price) || 0,
          maxPrice: Number(row.max_price) || 0,
          sampleCount: Number(row.sample_count) || 0,
          lastUpdated: row.last_updated
        };
      }

      return null;
    },
    enabled: !!currentLocation?.state
  });

  // Verificar última contribuição do usuário (para evitar spam)
  const { data: lastContribution } = useQuery({
    queryKey: ['my-fuel-contribution', user?.id, currentFuelType],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('fuel_prices')
        .select('created_at, price, city, state')
        .eq('user_id', user.id)
        .eq('fuel_type', currentFuelType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar última contribuição:', error);
        return null;
      }

      return data;
    },
    enabled: !!user
  });

  // Contribuir com preço
  const contributeMutation = useMutation({
    mutationFn: async (contribution: FuelPriceContribution) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('fuel_prices')
        .insert({
          user_id: user.id,
          fuel_type: contribution.fuelType,
          price: contribution.price,
          city: contribution.city,
          state: contribution.state,
          latitude: contribution.latitude,
          longitude: contribution.longitude
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['my-fuel-contribution'] });
    }
  });

  // Verificar se pode contribuir (não contribuiu nas últimas 24h para o mesmo tipo)
  const canContribute = useCallback(() => {
    if (!lastContribution) return true;
    
    const lastDate = new Date(lastContribution.created_at);
    const now = new Date();
    const hoursSinceLastContribution = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastContribution >= 24;
  }, [lastContribution]);

  // Obter preço sugerido (média regional ou padrão)
  const getSuggestedPrice = useCallback((fuelType: FuelType): number => {
    if (priceStats && priceStats.sampleCount >= 3) {
      return priceStats.avgPrice;
    }
    return FUEL_PRICES[fuelType];
  }, [priceStats]);

  // Atualizar localização para buscar preços
  const setLocation = useCallback((location: LocationData) => {
    setCurrentLocation(location);
  }, []);

  // Atualizar tipo de combustível
  const setFuelType = useCallback((fuelType: FuelType) => {
    setCurrentFuelType(fuelType);
  }, []);

  return {
    priceStats,
    isLoadingStats,
    lastContribution,
    canContribute: canContribute(),
    contribute: contributeMutation.mutate,
    isContributing: contributeMutation.isPending,
    contributeError: contributeMutation.error,
    getSuggestedPrice,
    setLocation,
    setFuelType,
    currentLocation,
    currentFuelType,
    refetchStats
  };
}
