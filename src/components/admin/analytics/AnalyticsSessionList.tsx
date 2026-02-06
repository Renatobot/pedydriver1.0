import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Smartphone, Monitor, Tablet, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionEvent {
  type: string;
  page: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SessionData {
  session_id: string;
  first_seen: string;
  last_seen: string;
  device_type: string;
  referrer: string;
  completed: boolean;
  events: SessionEvent[];
}

interface AnalyticsSessionListProps {
  data: SessionData[] | null;
  isLoading: boolean;
  filter: 'all' | 'completed' | 'abandoned';
  onFilterChange: (filter: 'all' | 'completed' | 'abandoned') => void;
}

const EVENT_LABELS: Record<string, string> = {
  page_view: '👁️ Visualizou',
  cta_click: '🖱️ Clicou CTA',
  scroll_depth: '📜 Scroll',
  mode_switch: '🔄 Mudou modo',
  form_start: '✏️ Iniciou formulário',
  field_focus: '📝 Focou campo',
  form_submit: '📤 Enviou formulário',
  signup_error: '❌ Erro',
  signup_complete: '✅ Cadastro completo',
  section_view: '📖 Viu seção',
};

const DeviceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

function SessionItem({ session }: { session: SessionData }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(session.last_seen), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <DeviceIcon type={session.device_type} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {session.session_id.substring(0, 12)}...
              </span>
              {session.completed ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {timeAgo} • {session.referrer}
            </span>
          </div>
        </div>
        <Badge variant={session.completed ? 'default' : 'secondary'} className="text-xs">
          {session.events.length} eventos
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {session.events.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs"
              >
                <span className="text-muted-foreground w-16 flex-shrink-0">
                  {new Date(event.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="flex-1">
                  {EVENT_LABELS[event.type] || event.type}
                  {event.page && event.page !== '/auth' && (
                    <span className="text-muted-foreground"> em {event.page}</span>
                  )}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <span className="text-muted-foreground">
                      {' '}
                      ({Object.entries(event.metadata)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalyticsSessionList({
  data,
  isLoading,
  filter,
  onFilterChange,
}: AnalyticsSessionListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessões Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Sessões Recentes</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('completed')}
          >
            Convertidas
          </Button>
          <Button
            variant={filter === 'abandoned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('abandoned')}
          >
            Abandonadas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Nenhuma sessão encontrada
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((session) => (
              <SessionItem key={session.session_id} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
