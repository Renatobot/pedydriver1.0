import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Search, UserPlus, Check, X, Calendar, Clock, AlertCircle, AlertTriangle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PendingPayment {
  id: string;
  email: string;
  amount: number;
  transaction_id: string | null;
  status: string;
  linked_user_id: string | null;
  linked_user_email: string | null;
  linked_user_name: string | null;
  linked_at: string | null;
  created_at: string;
  intent_id: string | null;
}

type FilterType = 'all' | 'pending' | 'orphan' | 'linked';

interface AdminUser {
  user_id: string;
  full_name: string | null;
  email: string;
}

export default function AdminPendingPayments() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAnnual, setIsAnnual] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Fetch pending payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_payments');
      if (error) throw error;
      return data as PendingPayment[];
    },
  });

  // Fetch users for linking
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-for-link'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      return data as AdminUser[];
    },
  });

  // Link payment mutation
  const linkPayment = useMutation({
    mutationFn: async ({ paymentId, userId, annual }: { paymentId: string; userId: string; annual: boolean }) => {
      const { data, error } = await supabase.rpc('admin_link_payment_to_user', {
        _payment_id: paymentId,
        _target_user_id: userId,
        _is_annual: annual,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Pagamento vinculado e plano PRO ativado!');
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      setShowLinkDialog(false);
      setSelectedPayment(null);
      setSelectedUserId('');
    },
    onError: (error) => {
      toast.error('Erro ao vincular pagamento: ' + error.message);
    },
  });

  // Cancel payment mutation
  const cancelPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.rpc('admin_cancel_pending_payment', {
        _payment_id: paymentId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Pagamento cancelado');
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
    },
    onError: (error) => {
      toast.error('Erro ao cancelar: ' + error.message);
    },
  });

  const handleOpenLinkDialog = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setUserSearchTerm(payment.email);
    // Try to detect if annual based on amount (R$ 90+ = annual)
    setIsAnnual(payment.amount >= 9000);
    setShowLinkDialog(true);
  };

  const handleLinkPayment = () => {
    if (!selectedPayment || !selectedUserId) return;
    linkPayment.mutate({
      paymentId: selectedPayment.id,
      userId: selectedUserId,
      annual: isAnnual,
    });
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    // Text search filter
    const matchesSearch = 
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Status/type filter
    switch (filterType) {
      case 'pending':
        return p.status === 'pending';
      case 'orphan':
        return p.status === 'pending' && !p.intent_id;
      case 'linked':
        return p.status === 'linked';
      default:
        return true;
    }
  });

  // Filter users for search
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const orphanCount = payments.filter(p => p.status === 'pending' && !p.intent_id).length;

  const formatAmount = (amount: number) => {
    // Amount might be in cents or reais depending on source
    const value = amount >= 100 ? amount / 100 : amount;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Pagamentos Pendentes
            </h1>
            <p className="text-muted-foreground">
              Vincule pagamentos a usuários quando o email não corresponder
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou ID da transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">
                <span className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Pendentes ({pendingCount})
                </span>
              </SelectItem>
              <SelectItem value="orphan">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Órfãos ({orphanCount})
                </span>
              </SelectItem>
              <SelectItem value="linked">
                <span className="flex items-center gap-2">
                  <Check className="w-3 h-3" />
                  Vinculados
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payments List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando...
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento pendente'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPayments.map((payment) => (
              <Card
                key={payment.id}
                className={cn(
                  payment.status === 'pending' && 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20',
                  payment.status === 'linked' && 'border-green-300 dark:border-green-700',
                  payment.status === 'cancelled' && 'opacity-60'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {payment.email}
                        <Badge
                          variant={
                            payment.status === 'pending' ? 'default' :
                            payment.status === 'linked' ? 'outline' : 'secondary'
                          }
                          className={cn(
                            payment.status === 'pending' && 'bg-purple-500',
                            payment.status === 'linked' && 'border-green-500 text-green-600'
                          )}
                        >
                          {payment.status === 'pending' && 'Pendente'}
                          {payment.status === 'linked' && 'Vinculado'}
                          {payment.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                        {payment.status === 'pending' && !payment.intent_id && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Órfão
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                        <span className="font-medium text-foreground">
                          {formatAmount(payment.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {payment.transaction_id && (
                          <span className="text-xs font-mono">
                            ID: {payment.transaction_id.slice(0, 12)}...
                          </span>
                        )}
                      </CardDescription>
                    </div>

                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleOpenLinkDialog(payment)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Vincular
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelPayment.mutate(payment.id)}
                          disabled={cancelPayment.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {payment.status === 'linked' && payment.linked_user_email && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      Vinculado a: {payment.linked_user_name || payment.linked_user_email}
                      {payment.linked_at && (
                        <span className="text-muted-foreground">
                          em {format(new Date(payment.linked_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Link Payment Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Pagamento</DialogTitle>
            <DialogDescription>
              Selecione o usuário que fez este pagamento para ativar o plano PRO.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email do pagamento:</span>
                  <span className="font-medium">{selectedPayment.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">{formatAmount(selectedPayment.amount)}</span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-amber-800 dark:text-amber-200">
                  Verifique se o usuário selecionado é realmente quem fez o pagamento.
                </span>
              </div>

              {/* User Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar usuário:</label>
                <Input
                  placeholder="Digite email ou nome..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              {/* User List */}
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Nenhum usuário encontrado
                    </p>
                  ) : (
                    filteredUsers.slice(0, 20).map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => setSelectedUserId(user.user_id)}
                        className={cn(
                          'w-full text-left p-2 rounded-md transition-colors',
                          selectedUserId === user.user_id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        <p className="font-medium text-sm">{user.full_name || 'Sem nome'}</p>
                        <p className={cn(
                          'text-xs',
                          selectedUserId === user.user_id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {user.email}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Plan Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de plano:</label>
                <Select value={isAnnual ? 'annual' : 'monthly'} onValueChange={(v) => setIsAnnual(v === 'annual')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Mensal (1 mês)
                      </div>
                    </SelectItem>
                    <SelectItem value="annual">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Anual (1 ano)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleLinkPayment}
              disabled={!selectedUserId || linkPayment.isPending}
            >
              {linkPayment.isPending ? 'Vinculando...' : 'Vincular e Ativar PRO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
