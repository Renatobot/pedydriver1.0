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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminUsers, useUpdateSubscription, useToggleUserBlock, useResetMonthlyLimit, AdminUser } from '@/hooks/useAdmin';
import { Search, MoreHorizontal, Crown, Ban, RefreshCw, Eye, UserX, UserCheck, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const updateSubscription = useUpdateSubscription();
  const toggleUserBlock = useToggleUserBlock();
  const resetMonthlyLimit = useResetMonthlyLimit();
  
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogType, setDialogType] = useState<'view' | 'block' | 'unblock' | 'pro' | 'free' | 'reset' | null>(null);

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
  ) ?? [];

  const handleAction = () => {
    if (!selectedUser) return;

    switch (dialogType) {
      case 'block':
        toggleUserBlock.mutate({ targetUserId: selectedUser.user_id, isBlocked: true });
        break;
      case 'unblock':
        toggleUserBlock.mutate({ targetUserId: selectedUser.user_id, isBlocked: false });
        break;
      case 'pro':
        updateSubscription.mutate({
          targetUserId: selectedUser.user_id,
          plan: 'pro',
          status: 'active',
          expiresAt: null,
        });
        break;
      case 'free':
        updateSubscription.mutate({
          targetUserId: selectedUser.user_id,
          plan: 'free',
          status: 'active',
          expiresAt: null,
        });
        break;
      case 'reset':
        resetMonthlyLimit.mutate(selectedUser.user_id);
        break;
    }
    setDialogType(null);
    setSelectedUser(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getDialogContent = () => {
    switch (dialogType) {
      case 'view':
        return {
          title: 'Detalhes do Usuário',
          description: '',
          action: null,
        };
      case 'block':
        return {
          title: 'Bloquear Usuário',
          description: `Tem certeza que deseja bloquear ${selectedUser?.full_name || selectedUser?.email}? O usuário não poderá acessar o sistema.`,
          action: 'Bloquear',
        };
      case 'unblock':
        return {
          title: 'Desbloquear Usuário',
          description: `Tem certeza que deseja desbloquear ${selectedUser?.full_name || selectedUser?.email}?`,
          action: 'Desbloquear',
        };
      case 'pro':
        return {
          title: 'Ativar Plano PRO',
          description: `Ativar plano PRO para ${selectedUser?.full_name || selectedUser?.email}?`,
          action: 'Ativar PRO',
        };
      case 'free':
        return {
          title: 'Desativar Plano PRO',
          description: `Desativar plano PRO para ${selectedUser?.full_name || selectedUser?.email}? O usuário voltará para o plano gratuito.`,
          action: 'Desativar PRO',
        };
      case 'reset':
        return {
          title: 'Resetar Limite Mensal',
          description: `Resetar o limite de registros mensais de ${selectedUser?.full_name || selectedUser?.email}?`,
          action: 'Resetar',
        };
      default:
        return { title: '', description: '', action: null };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerenciar usuários do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Usuários</CardTitle>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email / Telefone</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.full_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.email || '-'}</div>
                          {user.phone && (
                            <a 
                              href={`https://wa.me/${user.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {user.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(user.last_login_at)}
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
                          {user.is_blocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogType('view');
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.plan === 'pro' ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDialogType('free');
                                  }}
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  Desativar PRO
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDialogType('pro');
                                  }}
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  Ativar PRO
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogType('reset');
                                }}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resetar Limite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_blocked ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDialogType('unblock');
                                  }}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Desbloquear
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDialogType('block');
                                  }}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Bloquear
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Action/View Dialog */}
        <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogContent.title}</DialogTitle>
              {dialogContent.description && (
                <DialogDescription>{dialogContent.description}</DialogDescription>
              )}
            </DialogHeader>

            {dialogType === 'view' && selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{selectedUser.full_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedUser.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">WhatsApp:</span>
                    {selectedUser.phone ? (
                      <a 
                        href={`https://wa.me/${selectedUser.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-green-600 hover:text-green-700 hover:underline"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {selectedUser.phone}
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cadastro:</span>
                    <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Último Acesso:</span>
                    <p className="font-medium">{formatDate(selectedUser.last_login_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">
                      {selectedUser.is_blocked ? 'Bloqueado' : 'Ativo'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plano:</span>
                    <p className="font-medium">{selectedUser.plan.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status do Plano:</span>
                    <p className="font-medium">{selectedUser.plan_status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início do Plano:</span>
                    <p className="font-medium">{formatDate(selectedUser.plan_started_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expiração:</span>
                    <p className="font-medium">{formatDate(selectedUser.plan_expires_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {dialogContent.action && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogType(null)}>
                  Cancelar
                </Button>
                <Button
                  variant={dialogType === 'block' ? 'destructive' : 'default'}
                  onClick={handleAction}
                  disabled={
                    updateSubscription.isPending ||
                    toggleUserBlock.isPending ||
                    resetMonthlyLimit.isPending
                  }
                >
                  {dialogContent.action}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
