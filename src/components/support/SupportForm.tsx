import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export function SupportForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Fetch user's tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });

  // Submit ticket mutation
  const submitTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mensagem enviada! Responderemos em breve.');
      setSubject('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: (error) => {
      toast.error('Erro ao enviar: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    submitTicket.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        );
      case 'replied':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            <MessageCircle className="w-3 h-3 mr-1" />
            Respondido
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Fechado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* New Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Enviar Mensagem de Suporte
          </CardTitle>
          <CardDescription>
            Descreva seu problema ou dúvida. Responderemos o mais breve possível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input
                placeholder="Ex: Problema com pagamento"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                placeholder="Descreva seu problema ou dúvida em detalhes..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/1000
              </p>
            </div>
            <Button
              type="submit"
              disabled={submitTicket.isPending || !subject.trim() || !message.trim()}
              className="w-full"
            >
              {submitTicket.isPending ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Tickets */}
      {tickets.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Minhas Mensagens</h3>
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={cn(
                ticket.status === 'replied' && 'border-green-300 dark:border-green-700'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{ticket.subject}</CardTitle>
                  {getStatusBadge(ticket.status)}
                </div>
                <CardDescription>
                  {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.message}
                </p>

                {ticket.admin_reply && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                      Resposta do Suporte:
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{ticket.admin_reply}</p>
                    {ticket.replied_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(ticket.replied_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading && (
        <p className="text-center text-muted-foreground py-4">Carregando...</p>
      )}
    </div>
  );
}
