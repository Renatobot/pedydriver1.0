import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationForm } from '@/components/admin/notifications/NotificationForm';
import { NotificationTemplates } from '@/components/admin/notifications/NotificationTemplates';
import { ScheduledNotificationsList } from '@/components/admin/notifications/ScheduledNotificationsList';
import { RecurringNotificationsList } from '@/components/admin/notifications/RecurringNotificationsList';
import { NotificationHistory } from '@/components/admin/notifications/NotificationHistory';
import { Bell, Clock, Repeat, History } from 'lucide-react';

export default function AdminNotifications() {
  const [selectedTemplate, setSelectedTemplate] = useState<{
    title: string;
    body: string;
    icon: string;
    url: string | null;
  } | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notificações Push</h1>
          <p className="text-muted-foreground">
            Envie notificações para os usuários do app
          </p>
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Agendadas</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              <span className="hidden sm:inline">Recorrentes</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <NotificationTemplates onSelect={setSelectedTemplate} />
            <NotificationForm 
              initialValues={selectedTemplate}
              onClearTemplate={() => setSelectedTemplate(null)}
            />
          </TabsContent>

          <TabsContent value="scheduled">
            <ScheduledNotificationsList />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringNotificationsList />
          </TabsContent>

          <TabsContent value="history">
            <NotificationHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
