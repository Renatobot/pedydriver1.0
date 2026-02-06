import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ErrorData {
  error_message: string;
  count: number;
  percentage: number;
}

interface AnalyticsErrorsTableProps {
  data: ErrorData[] | null;
  isLoading: boolean;
}

export function AnalyticsErrorsTable({ data, isLoading }: AnalyticsErrorsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Erros de Cadastro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Erros de Cadastro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">Nenhum erro registrado no período</p>
            <p className="text-xs text-muted-foreground mt-1">Isso é ótimo! 🎉</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalErrors = data.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Erros de Cadastro
          <span className="text-sm font-normal text-muted-foreground">
            ({totalErrors} total)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((error, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-foreground flex-1">
                  {error.error_message || 'Erro desconhecido'}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium">{error.count}x</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {error.percentage?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-destructive/70 transition-all duration-500"
                  style={{ width: `${error.percentage || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> O erro mais comum "{data[0]?.error_message}" representa {data[0]?.percentage?.toFixed(1)}% dos problemas. 
              Considere adicionar orientações mais claras no formulário.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
