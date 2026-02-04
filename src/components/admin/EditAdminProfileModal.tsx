import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useAdminUpdateEmail } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface EditAdminProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentPhone: string | null;
  email: string;
}

export function EditAdminProfileModal({
  open,
  onOpenChange,
  currentName,
  currentPhone,
  email,
}: EditAdminProfileModalProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone || '');
  const [newEmail, setNewEmail] = useState(email);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const updateProfile = useUpdateProfile();
  const updateEmail = useAdminUpdateEmail();

  useEffect(() => {
    if (open) {
      setFullName(currentName);
      setPhone(currentPhone || '');
      setNewEmail(email);
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open, currentName, currentPhone, email]);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSave = async () => {
    updateProfile.mutate(
      { 
        full_name: fullName, 
        phone: phone || null 
      },
      {
        onSuccess: () => {
          if (newEmail !== email && user?.id) {
            updateEmail.mutate(
              { targetUserId: user.id, newEmail },
              {
                onSuccess: () => {
                  onOpenChange(false);
                },
              }
            );
          } else {
            onOpenChange(false);
          }
        },
      }
    );
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'Erro',
          description: 'Senha atual incorreta',
          variant: 'destructive',
        });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          title: 'Erro',
          description: updateError.message.includes('weak') 
            ? 'Senha muito fraca. Use uma combinação mais forte.' 
            : 'Erro ao alterar senha',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso',
      });
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar senha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const emailChanged = newEmail !== email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(newEmail);
  const isValid = fullName.trim().length > 0 && fullName.length <= 100 && isEmailValid;
  const isPasswordValid = currentPassword.length >= 6 && newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Meu Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="adminFullName">Nome Completo</Label>
            <Input
              id="adminFullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              maxLength={100}
              className="h-11"
            />
            {fullName.length > 0 && fullName.trim().length === 0 && (
              <p className="text-xs text-destructive">Nome não pode ser vazio</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPhone">WhatsApp</Label>
            <Input
              id="adminPhone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11"
            />
            {newEmail && !isEmailValid && (
              <p className="text-xs text-destructive">Formato de email inválido</p>
            )}
            {emailChanged && isEmailValid && (
              <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Alterar o email afetará seu login. Você precisará usar o novo email para acessar.
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Password Section */}
          {!showPasswordSection ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowPasswordSection(true)}
            >
              <KeyRound className="w-4 h-4" />
              Alterar Senha
            </Button>
          ) : (
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Alterar Senha</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminCurrentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="adminCurrentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••"
                    className="h-11 pr-10"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNewPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="adminNewPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-11 pr-10"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-xs text-destructive">Mínimo 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminConfirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="adminConfirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="h-11"
                  maxLength={100}
                />
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={!isPasswordValid || isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? 'Alterando...' : 'Confirmar Nova Senha'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid || updateProfile.isPending || updateEmail.isPending}
          >
            {(updateProfile.isPending || updateEmail.isPending) ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
