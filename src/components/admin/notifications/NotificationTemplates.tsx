import { usePushTemplates } from '@/hooks/useAdminNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationTemplatesProps {
  onSelect: (template: {
    title: string;
    body: string;
    icon: string;
    url: string | null;
  }) => void;
}

export function NotificationTemplates({ onSelect }: NotificationTemplatesProps) {
  const { data: templates, isLoading } = usePushTemplates();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Templates Rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Templates Rápidos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {templates?.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelect({
              title: template.title,
              body: template.body,
              icon: template.icon,
              url: template.url
            })}
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-1">{template.icon}</div>
              <p className="text-xs font-medium truncate">{template.name}</p>
            </CardContent>
          </Card>
        ))}
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
          onClick={() => onSelect({ title: '', body: '', icon: '📢', url: null })}
        >
          <CardContent className="p-3 text-center">
            <div className="text-2xl mb-1">✨</div>
            <p className="text-xs font-medium text-muted-foreground">Personalizado</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
