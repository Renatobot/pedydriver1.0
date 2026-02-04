import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useAdminUpdateEmail } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

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
  const updateProfile = useUpdateProfile();
  const updateEmail = useAdminUpdateEmail();

  useEffect(() => {
    if (open) {
      setFullName(currentName);
      setPhone(currentPhone || '');
      setNewEmail(email);
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
    // Primeiro atualiza nome e telefone
    updateProfile.mutate(
      { 
        full_name: fullName, 
        phone: phone || null 
      },
      {
        onSuccess: () => {
          // Se o email foi alterado, atualiza via edge function
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

  const emailChanged = newEmail !== email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(newEmail);
  const isValid = fullName.trim().length > 0 && fullName.length <= 100 && isEmailValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Meu Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais. O email não pode ser alterado.
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
