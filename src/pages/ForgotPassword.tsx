import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Mail, Lock, User, Eye, EyeOff, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const resetSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  phone: z.string().min(10, 'Telefone inválido').max(15).regex(/^[0-9]+$/, 'Apenas números'),
  fullName: z.string().min(2, 'Nome muito curto').max(100),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres').max(100),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres').max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type ResetData = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
  });

  const handleReset = async (data: ResetData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('reset-password-verified', {
        body: {
          email: data.email.trim().toLowerCase(),
          phone: data.phone,
          fullName: data.fullName.trim(),
          newPassword: data.newPassword,
        },
      });

      if (response.error) {
        setError(response.error.message || 'Erro ao resetar senha');
        return;
      }

      if (response.data?.error) {
        setError(response.data.error);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 safe-top safe-bottom">
        <div className="w-full max-w-xs sm:max-w-sm bg-card rounded-2xl p-6 border border-border/50 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Senha Alterada!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sua senha foi alterada com sucesso. Agora você pode entrar com a nova senha.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="w-full bg-gradient-profit hover:opacity-90"
          >
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-profit flex items-center justify-center mx-auto mb-3 sm:mb-4 glow-profit">
          <Car className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Recuperar Senha</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          Confirme seus dados para criar uma nova senha
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-xs sm:max-w-sm bg-card rounded-2xl p-4 sm:p-6 border border-border/50 animate-fade-in">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleReset)} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Como cadastrou"
                className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                {...form.register('fullName')}
              />
            </div>
            {form.formState.errors.fullName && (
              <p className="text-2xs sm:text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="seu@email.com"
                className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-2xs sm:text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Telefone (WhatsApp)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="11999999999"
                className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                {...form.register('phone')}
              />
            </div>
            <p className="text-2xs sm:text-xs text-muted-foreground">DDD + número (sem espaços)</p>
            {form.formState.errors.phone && (
              <p className="text-2xs sm:text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs text-muted-foreground mb-3">Nova senha</p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className="pl-9 sm:pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base"
                {...form.register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            {form.formState.errors.newPassword && (
              <p className="text-2xs sm:text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                {...form.register('confirmPassword')}
              />
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-2xs sm:text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-profit hover:opacity-90 touch-feedback"
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Alterar Senha'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}
