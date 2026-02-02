import { useState, useCallback } from 'react';

export interface LocationData {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface UseGeolocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<LocationData | null>;
}

// Mapeamento de estados brasileiros (sigla -> nome completo)
const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

// Função para fazer geocoding reverso usando API gratuita
async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; state: string } | null> {
  try {
    // Usar Nominatim (OpenStreetMap) - API gratuita
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
      {
        headers: {
          'User-Agent': 'PedyDriver/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Falha ao obter localização');
    }
    
    const data = await response.json();
    const address = data.address;
    
    // Extrair cidade e estado
    const city = address.city || address.town || address.municipality || address.village || 'Cidade desconhecida';
    const stateCode = address.state || '';
    
    // Tentar converter sigla para nome completo se necessário
    const state = STATE_NAMES[stateCode.toUpperCase()] || stateCode;
    
    return { city, state };
  } catch (error) {
    console.error('Erro no geocoding reverso:', error);
    return null;
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    // Verificar se geolocalização está disponível
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Obter coordenadas
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // Cache por 5 minutos
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Fazer geocoding reverso para obter cidade/estado
      const geoData = await reverseGeocode(latitude, longitude);
      
      if (!geoData) {
        throw new Error('Não foi possível identificar sua localização');
      }

      const locationData: LocationData = {
        city: geoData.city,
        state: geoData.state,
        latitude,
        longitude
      };

      setLocation(locationData);
      return locationData;
    } catch (err: any) {
      let errorMessage = 'Erro ao obter localização';
      
      if (err.code === 1) {
        errorMessage = 'Permissão de localização negada';
      } else if (err.code === 2) {
        errorMessage = 'Localização indisponível';
      } else if (err.code === 3) {
        errorMessage = 'Tempo esgotado ao buscar localização';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    requestLocation
  };
}
