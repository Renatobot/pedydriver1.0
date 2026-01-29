import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nome muito curto').max(100),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  const handleLogin = async (data: LoginData) => {
    setError(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      if (error.message.includes('Invalid login')) {
        setError('Email ou senha incorretos');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (data: SignupData) => {
    setError(null);
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-profit flex items-center justify-center mx-auto mb-3 sm:mb-4 glow-profit">
          <Car className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">DriverPay</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">Controle financeiro para motoristas</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-secondary mb-4 sm:mb-6 w-full max-w-xs sm:max-w-sm">
        <button
          onClick={() => setMode('login')}
          className={cn(
            'flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px]',
            mode === 'login'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          )}
        >
          Entrar
        </button>
        <button
          onClick={() => setMode('signup')}
          className={cn(
            'flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px]',
            mode === 'signup'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          )}
        >
          Criar Conta
        </button>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-xs sm:max-w-sm bg-card rounded-2xl p-4 sm:p-6 border border-border/50 animate-fade-in">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                  {...loginForm.register('email')}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-2xs sm:text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  className="pl-9 sm:pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base"
                  {...loginForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-2xs sm:text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-profit hover:opacity-90 touch-feedback"
              disabled={loginForm.formState.isSubmitting}
            >
              {loginForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Seu nome"
                  className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                  {...signupForm.register('fullName')}
                />
              </div>
              {signupForm.formState.errors.fullName && (
                <p className="text-2xs sm:text-xs text-destructive">{signupForm.formState.errors.fullName.message}</p>
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
                  {...signupForm.register('email')}
                />
              </div>
              {signupForm.formState.errors.email && (
                <p className="text-2xs sm:text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-9 sm:pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base"
                  {...signupForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-2xs sm:text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-profit hover:opacity-90 touch-feedback"
              disabled={signupForm.formState.isSubmitting}
            >
              {signupForm.formState.isSubmitting ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 sm:mt-8 text-2xs sm:text-xs text-muted-foreground text-center max-w-xs sm:max-w-sm px-4">
        Saiba quanto você ganha de verdade trabalhando com apps de transporte e entrega
      </p>
    </div>
  );
}
