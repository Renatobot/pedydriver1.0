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
import { useAdminUsers, useUpdateSubscription, useToggleUserBlock, useResetMonthlyLimit, useAdminResetPassword, useDeleteUser, useAdminUpdateProfile, useAdminUpdateEmail, AdminUser } from '@/hooks/useAdmin';
import { Search, MoreHorizontal, Crown, Ban, RefreshCw, Eye, UserX, UserCheck, MessageCircle, KeyRound, Trash2, Bell, Clock, Pencil, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const updateSubscription = useUpdateSubscription();
  const toggleUserBlock = useToggleUserBlock();
  const resetMonthlyLimit = useResetMonthlyLimit();
  const adminResetPassword = useAdminResetPassword();
  const deleteUser = useDeleteUser();
  const adminUpdateProfile = useAdminUpdateProfile();
  const adminUpdateEmail = useAdminUpdateEmail();
  
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogType, setDialogType] = useState<'view' | 'block' | 'unblock' | 'pro' | 'free' | 'reset' | 'password' | 'delete' | 'notify_inactive' | 'edit_profile' | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [filterInactive, setFilterInactive] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search);
    
    const matchesInactiveFilter = !filterInactive || user.days_inactive >= 30;
    
    return matchesSearch && matchesInactiveFilter;
  }) ?? [];

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
      case 'password':
        if (newPassword.length >= 6) {
          adminResetPassword.mutate({ 
            targetUserId: selectedUser.user_id, 
            newPassword 
          });
          setNewPassword('');
        }
        break;
      case 'delete':
        deleteUser.mutate({ targetUserId: selectedUser.user_id });
        break;
      case 'notify_inactive':
        deleteUser.mutate({ targetUserId: selectedUser.user_id, sendNotification: true });
        break;
      case 'edit_profile':
        if (editName.trim()) {
          // First update profile (name/phone)
          adminUpdateProfile.mutate({
            targetUserId: selectedUser.user_id,
            fullName: editName,
            phone: editPhone || null,
          }, {
            onSuccess: () => {
              // Then update email if changed
              if (editEmail !== originalEmail && editEmail.trim()) {
                adminUpdateEmail.mutate({
                  targetUserId: selectedUser.user_id,
                  newEmail: editEmail.trim(),
                });
              }
            }
          });
        }
        break;
    }
    setDialogType(null);
    setSelectedUser(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const openEditProfile = (user: AdminUser) => {
    setSelectedUser(user);
    setEditName(user.full_name || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setOriginalEmail(user.email || '');
    setDialogType('edit_profile');
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
      case 'password':
        return {
          title: 'Resetar Senha',
          description: `Definir uma nova senha para ${selectedUser?.full_name || selectedUser?.email}`,
          action: 'Alterar Senha',
        };
      case 'delete':
        return {
          title: '⚠️ Excluir Usuário Permanentemente',
          description: `ATENÇÃO: Esta ação é IRREVERSÍVEL! Todos os dados de ${selectedUser?.full_name || selectedUser?.email} serão excluídos permanentemente, incluindo ganhos, despesas, turnos e configurações.`,
          action: 'Excluir Permanentemente',
        };
      case 'notify_inactive':
        return {
          title: 'Enviar Aviso de Inatividade',
          description: `Enviar notificação para ${selectedUser?.full_name || selectedUser?.email} avisando sobre a inatividade da conta?`,
          action: 'Enviar Notificação',
        };
      case 'edit_profile':
        return {
          title: 'Editar Dados do Usuário',
          description: `Editar informações de ${selectedUser?.full_name || selectedUser?.email}`,
          action: 'Salvar',
        };
      default:
        return { title: '', description: '', action: null };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerenciar usuários do sistema</p>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg sm:text-xl">Lista de Usuários</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filterInactive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterInactive(!filterInactive)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Inativos 30+ dias
                  {filterInactive && users && (
                    <Badge variant="secondary" className="ml-1">
                      {users.filter(u => u.days_inactive >= 30).length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {isLoading ? (
              <div className="space-y-3 px-3 sm:px-0">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 sm:h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3 px-3">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div 
                        key={user.user_id} 
                        className="p-3 rounded-lg border border-border bg-card space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{user.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {user.phone && (
                              <a 
                                href={`https://wa.me/${user.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-green-600 mt-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {user.phone}
                              </a>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
                              <DropdownMenuItem
                                onClick={() => openEditProfile(user)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar Dados
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
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogType('password');
                                }}
                              >
                                <KeyRound className="w-4 h-4 mr-2" />
                                Resetar Senha
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
                              {user.days_inactive >= 30 && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDialogType('notify_inactive');
                                  }}
                                >
                                  <Bell className="w-4 h-4 mr-2" />
                                  Enviar Aviso de Inatividade
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogType('delete');
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'} className="text-xs">
                            {user.plan === 'pro' ? (
                              <><Crown className="w-3 h-3 mr-1" /> PRO</>
                            ) : (
                              'Grátis'
                            )}
                          </Badge>
                          {user.is_blocked ? (
                            <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              Ativo
                            </Badge>
                          )}
                          {user.days_inactive >= 30 && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                              <Clock className="w-3 h-3 mr-1" />
                              {user.days_inactive}d inativo
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDate(user.last_login_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
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
                              <div className="flex gap-1 flex-wrap">
                                {user.is_blocked ? (
                                  <Badge variant="destructive">Bloqueado</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Ativo
                                  </Badge>
                                )}
                                {user.days_inactive >= 30 && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {user.days_inactive}d
                                  </Badge>
                                )}
                              </div>
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
                                  <DropdownMenuItem
                                    onClick={() => openEditProfile(user)}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar Dados
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setDialogType('password');
                                    }}
                                  >
                                    <KeyRound className="w-4 h-4 mr-2" />
                                    Resetar Senha
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
                                  {user.days_inactive >= 30 && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setDialogType('notify_inactive');
                                      }}
                                    >
                                      <Bell className="w-4 h-4 mr-2" />
                                      Enviar Aviso de Inatividade
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setDialogType('delete');
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir Usuário
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
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

            {dialogType === 'password' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nova Senha</label>
                  <Input
                    type="text"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-xs text-destructive">Senha deve ter no mínimo 6 caracteres</p>
                  )}
                </div>
              </div>
            )}

            {dialogType === 'edit_profile' && selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Nome Completo</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do usuário"
                    maxLength={100}
                  />
                  {editName.length > 0 && editName.trim().length === 0 && (
                    <p className="text-xs text-destructive">Nome não pode ser vazio</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">WhatsApp</Label>
                  <Input
                    id="editPhone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                  {editEmail !== originalEmail && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Atenção: Alterar o email afetará o login do usuário. O usuário precisará usar o novo email para acessar a conta.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {dialogContent.action && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogType(null)}>
                  Cancelar
                </Button>
                <Button
                  variant={dialogType === 'block' || dialogType === 'delete' ? 'destructive' : 'default'}
                  onClick={handleAction}
                  disabled={
                    updateSubscription.isPending ||
                    toggleUserBlock.isPending ||
                    resetMonthlyLimit.isPending ||
                    adminResetPassword.isPending ||
                    deleteUser.isPending ||
                    adminUpdateProfile.isPending ||
                    adminUpdateEmail.isPending ||
                    (dialogType === 'password' && newPassword.length < 6) ||
                    (dialogType === 'edit_profile' && !editName.trim())
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
