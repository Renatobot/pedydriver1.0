import { Car, ChevronRight } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Link } from 'react-router-dom';

export function VehicleSetupReminder() {
  const { data: settings, isLoading } = useUserSettings();

  // Don't show if loading or if vehicle model is already configured
  if (isLoading || settings?.vehicle_model) {
    return null;
  }

  return (
    <Link
      to="/settings"
      className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors touch-feedback"
    >
      <div className="p-2 rounded-lg bg-amber-500/20">
        <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Configure seu veículo
        </p>
        <p className="text-xs text-muted-foreground">
          Cadastre o modelo para calcular seu lucro real com precisão
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}
