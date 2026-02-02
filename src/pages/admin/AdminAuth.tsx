import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import adminLogo from '@/assets/admin-logo.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AdminAuth() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data: LoginData) => {
    setError(null);
    
    const { error: signInError } = await signIn(data.email, data.password);
    
    if (signInError) {
      if (signInError.message.includes('Invalid login')) {
        setError('Email ou senha incorretos');
      } else {
        setError(signInError.message);
      }
      return;
    }

    // Check if user is admin after login
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin');
    
    if (roleError || !isAdmin) {
      // Sign out if not admin
      await supabase.auth.signOut();
      setError('Acesso não autorizado. Apenas administradores podem acessar este painel.');
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Back to user login */}
      <Link 
        to="/auth" 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Login de Usuário
      </Link>

      {/* Admin Logo */}
      <div className="mb-6 sm:mb-8 text-center relative z-10">
        <img 
          src={adminLogo} 
          alt="PEDY Driver Admin" 
          className="max-w-[280px] sm:max-w-[320px] mx-auto mb-4"
        />
        <p className="text-muted-foreground text-sm sm:text-base">Painel Administrativo</p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-xs sm:max-w-sm bg-[hsl(220,18%,10%)] rounded-2xl p-5 sm:p-6 border border-[hsl(220,14%,18%)] shadow-2xl relative z-10">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-foreground/90">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="admin@pedy.com.br"
                className="pl-10 h-12 text-sm sm:text-base bg-[hsl(220,16%,14%)] border-[hsl(220,14%,22%)] focus:border-primary/50 focus:ring-primary/30"
                {...loginForm.register('email')}
              />
            </div>
            {loginForm.formState.errors.email && (
              <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-foreground/90">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10 h-12 text-sm sm:text-base bg-[hsl(220,16%,14%)] border-[hsl(220,14%,22%)] focus:border-primary/50 focus:ring-primary/30"
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
              <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-sm sm:text-base font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            disabled={loginForm.formState.isSubmitting}
          >
            {loginForm.formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Acessar Painel
              </span>
            )}
          </Button>
        </form>

        {/* Security note */}
        <div className="mt-5 pt-4 border-t border-[hsl(220,14%,18%)]">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Acesso restrito a administradores autorizados
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 sm:mt-8 text-xs text-muted-foreground/60 text-center relative z-10">
        PEDY Driver © 2025 — Painel Administrativo
      </p>
    </div>
  );
}
