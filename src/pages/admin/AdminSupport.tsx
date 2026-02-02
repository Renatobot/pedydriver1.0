import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search, Clock, CheckCircle, MessageCircle, Send, X, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

type FilterType = 'all' | 'open' | 'replied' | 'closed';

export default function AdminSupport() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  // Check admin status
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin-check'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 30_000,
  });

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_support_tickets');
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: isAdmin === true,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, reply }: { ticketId: string; reply: string }) => {
      const { data, error } = await supabase.rpc('admin_reply_ticket', {
        _ticket_id: ticketId,
        _reply: reply,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Resposta enviada!');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      setShowReplyDialog(false);
      setSelectedTicket(null);
      setReplyText('');
    },
    onError: (error) => {
      toast.error('Erro ao responder: ' + error.message);
    },
  });

  // Close ticket mutation
  const closeMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase.rpc('admin_close_ticket', {
        _ticket_id: ticketId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Ticket fechado');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: (error) => {
      toast.error('Erro ao fechar: ' + error.message);
    },
  });

  const handleOpenReply = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.admin_reply || '');
    setShowReplyDialog(true);
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      reply: replyText.trim(),
    });
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterType) {
      case 'open':
        return t.status === 'open';
      case 'replied':
        return t.status === 'replied';
      case 'closed':
        return t.status === 'closed';
      default:
        return true;
    }
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        );
      case 'replied':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30">
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Suporte
            </h1>
            <p className="text-muted-foreground">
              Mensagens de suporte dos usuários
            </p>
          </div>
          {openCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {openCount} aguardando
            </Badge>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nome ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">
                <span className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Aguardando ({openCount})
                </span>
              </SelectItem>
              <SelectItem value="replied">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-3 h-3 text-green-500" />
                  Respondidos
                </span>
              </SelectItem>
              <SelectItem value="closed">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Fechados
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Admin guard */}
        {isAdminLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Verificando permissão...
            </CardContent>
          </Card>
        ) : isAdmin === false ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sem permissão de administrador</CardTitle>
            </CardHeader>
          </Card>
        ) : null}

        {/* Tickets List */}
        {isAdmin && (
          <>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum ticket encontrado' : 'Nenhum ticket de suporte'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={cn(
                      ticket.status === 'open' && 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20',
                      ticket.status === 'replied' && 'border-green-300 dark:border-green-700'
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            {ticket.subject}
                            {getStatusBadge(ticket.status)}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="font-medium text-foreground">
                              {ticket.user_name || ticket.user_email}
                            </span>
                            <span>
                              {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </CardDescription>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleOpenReply(ticket)}>
                            <Send className="w-4 h-4 mr-1" />
                            {ticket.admin_reply ? 'Editar' : 'Responder'}
                          </Button>
                          {ticket.status !== 'closed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => closeMutation.mutate(ticket.id)}
                              disabled={closeMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>

                      {ticket.admin_reply && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                            Sua resposta:
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{ticket.admin_reply}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket?.user_name || selectedTicket?.user_email}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">{selectedTicket.subject}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sua resposta:</label>
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? 'Enviando...' : 'Enviar Resposta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
