import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelData {
  landing_views: number;
  cta_clicks: number;
  auth_views: number;
  form_starts: number;
  form_submits: number;
  signup_complete: number;
}

interface AnalyticsFunnelProps {
  data: FunnelData | null;
  isLoading: boolean;
}

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export function AnalyticsFunnel({ data, isLoading }: AnalyticsFunnelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const steps: FunnelStep[] = [
    { label: 'Landing Page', value: data.landing_views, color: 'bg-blue-500' },
    { label: 'Clique no CTA', value: data.cta_clicks, color: 'bg-indigo-500' },
    { label: 'Página de Auth', value: data.auth_views, color: 'bg-purple-500' },
    { label: 'Início do Formulário', value: data.form_starts, color: 'bg-pink-500' },
    { label: 'Envio do Formulário', value: data.form_submits, color: 'bg-orange-500' },
    { label: 'Cadastro Completo', value: data.signup_complete, color: 'bg-green-500' },
  ];

  const maxValue = Math.max(...steps.map(s => s.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const percentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
            const prevStep = index > 0 ? steps[index - 1] : null;
            const conversionRate = prevStep && prevStep.value > 0 
              ? ((step.value / prevStep.value) * 100).toFixed(1)
              : null;

            return (
              <div key={step.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.value}</span>
                    {conversionRate && (
                      <span className={`text-xs ${parseFloat(conversionRate) < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        ({conversionRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${step.color} transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  >
                    {percentage > 15 && (
                      <span className="text-xs text-white font-medium">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall conversion rate */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Conversão Total</span>
            <span className="text-lg font-bold text-primary">
              {data.landing_views > 0 
                ? ((data.signup_complete / data.landing_views) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.signup_complete} cadastros de {data.landing_views} visitantes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
