import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface SendAllConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientCount: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SendAllConfirmModal({
  open,
  onOpenChange,
  recipientCount,
  onConfirm,
  isLoading,
}: SendAllConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Confirmar envio em massa
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a enviar uma notificação para{' '}
              <strong className="text-foreground">{recipientCount} usuários</strong>.
            </p>
            <p>
              Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Enviando...' : `Enviar para ${recipientCount} usuários`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
