import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Lock } from 'lucide-react';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentPhone: string | null;
  email: string;
}

export function EditProfileModal({
  open,
  onOpenChange,
  currentName,
  currentPhone,
  email,
}: EditProfileModalProps) {
  const [fullName, setFullName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone || '');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (open) {
      setFullName(currentName);
      setPhone(currentPhone || '');
    }
  }, [open, currentName, currentPhone]);

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara brasileira
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

  const handleSave = () => {
    updateProfile.mutate(
      { 
        full_name: fullName, 
        phone: phone || null 
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isValid = fullName.trim().length > 0 && fullName.length <= 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Informações</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais. O email não pode ser alterado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
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
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-muted-foreground">
              Email
              <Lock className="w-3 h-3" />
            </Label>
            <Input
              id="email"
              value={email}
              disabled
              className="h-11 bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado por segurança
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid || updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
