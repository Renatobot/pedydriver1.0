import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { useAdminUsers, useUpdateSubscription, AdminUser } from '@/hooks/useAdmin';
import { Search, Crown, Edit, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSubscriptions() {
  const { data: users, isLoading } = useAdminUsers();
  const updateSubscription = useUpdateSubscription();
  
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<'free' | 'pro'>('free');
  const [editStatus, setEditStatus] = useState<'active' | 'cancelled' | 'expired' | 'trialing'>('active');
  const [editExpiration, setEditExpiration] = useState<'none' | '1month' | '3months' | '1year'>('none');

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setEditStatus(user.plan_status);
    setEditExpiration('none');
    setIsEditOpen(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;

    let expiresAt: string | null = null;
    if (editExpiration !== 'none') {
      const now = new Date();
      switch (editExpiration) {
        case '1month':
          expiresAt = addMonths(now, 1).toISOString();
          break;
        case '3months':
          expiresAt = addMonths(now, 3).toISOString();
          break;
        case '1year':
          expiresAt = addYears(now, 1).toISOString();
          break;
      }
    }

    updateSubscription.mutate({
      targetUserId: selectedUser.user_id,
      plan: editPlan,
      status: editStatus,
      expiresAt,
    });

    setIsEditOpen(false);
    setSelectedUser(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      case 'trialing':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">Gerenciar planos e assinaturas dos usuários</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Planos dos Usuários</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ativação</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                            {user.plan === 'pro' ? (
                              <><Crown className="w-3 h-3 mr-1" /> PRO</>
                            ) : (
                              'Grátis'
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.plan_status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(user.plan_started_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.plan_expires_at ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.plan_expires_at)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem expiração</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Subscription Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Assinatura</DialogTitle>
              <DialogDescription>
                Alterar plano de {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={editPlan} onValueChange={(v) => setEditPlan(v as 'free' | 'pro')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Grátis</SelectItem>
                    <SelectItem value="pro">PRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editStatus} 
                  onValueChange={(v) => setEditStatus(v as typeof editStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trialing">Trial</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Definir Expiração</Label>
                <Select value={editExpiration} onValueChange={(v) => setEditExpiration(v as typeof editExpiration)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Manter atual / Sem expiração</SelectItem>
                    <SelectItem value="1month">+1 Mês a partir de hoje</SelectItem>
                    <SelectItem value="3months">+3 Meses a partir de hoje</SelectItem>
                    <SelectItem value="1year">+1 Ano a partir de hoje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateSubscription.isPending}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
