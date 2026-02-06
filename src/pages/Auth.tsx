import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Phone, Gift, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useReferralCodeFromUrl, useReferral } from '@/hooks/useReferral';
import { useAnalytics } from '@/hooks/useAnalytics';
// Using optimized WebP icon for better performance
import logo3d from '@/assets/logo-optimized.webp';

const REFERRAL_CODE_KEY = 'pedy_referral_code';
const BANNER_DISMISS_KEY = 'pedy_auth_banner_dismissed';
const BANNER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nome muito curto').max(100),
  phone: z.string().min(10, 'Telefone inválido').max(15).regex(/^[0-9]+$/, 'Apenas números'),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10, 'Telefone inválido').max(15).regex(/^[0-9]+$/, 'Apenas números'),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;
type PhoneLoginData = z.infer<typeof phoneLoginSchema>;

// Função para traduzir mensagens de erro do Supabase Auth para português
const translateAuthError = (message: string): string => {
  const msg = message.toLowerCase();
  
  // Erros de login
  if (msg.includes('invalid login')) 
    return 'Email ou senha incorretos';
  
  // Erros de cadastro
  if (msg.includes('already registered')) 
    return 'Este email já está cadastrado';
  if (msg.includes('email not confirmed')) 
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  
  // Erros de senha
  if (msg.includes('password should be at least 6 characters') || 
      msg.includes('password must be at least 6')) 
    return 'A senha deve ter no mínimo 6 caracteres';
  if (msg.includes('password is too weak')) 
    return 'Sua senha é muito fraca. Use letras, números e símbolos.';
  // Supabase/HaveIBeenPwned style message
  if (
    msg.includes('known to be weak and easy to guess') ||
    msg.includes('password is known to be weak') ||
    msg.includes('pwned')
  )
    return 'Essa senha é considerada fraca (muito comum). Escolha uma senha mais forte.';
  if (msg.includes('most common passwords')) 
    return 'Esta senha é muito comum. Escolha outra mais segura.';
  if (msg.includes('contain at least one character of each')) 
    return 'A senha deve conter letras maiúsculas, minúsculas, números e símbolos.';
  if (msg.includes('should not contain your email')) 
    return 'A senha não pode conter seu email.';
  
  // Erros gerais
  if (msg.includes('signup is currently disabled')) 
    return 'O cadastro está temporariamente desativado.';
  if (msg.includes('rate limit')) 
    return 'Muitas tentativas. Aguarde alguns minutos.';
  if (msg.includes('email rate limit')) 
    return 'Muitas tentativas de email. Aguarde alguns minutos.';
  
  return message; // Retorna original se não encontrar tradução
};

// Check if banner should show (respects 24h cooldown after dismiss)
const shouldShowBanner = (): boolean => {
  try {
    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    if (!dismissedAt) return true;
    
    const timestamp = parseInt(dismissedAt, 10);
    if (isNaN(timestamp)) return true;
    
    // Show banner again if 24h have passed
    return Date.now() - timestamp > BANNER_COOLDOWN_MS;
  } catch {
    return true;
  }
};

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'phone'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [showConversionBanner, setShowConversionBanner] = useState(shouldShowBanner);
  const [showFormHighlight, setShowFormHighlight] = useState(false);
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Refs for scroll + focus behavior
  const signupFormRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Analytics tracking
  const { 
    trackPageView, 
    trackModeSwitch, 
    trackFormStart, 
    trackFieldFocus, 
    trackFormSubmit, 
    trackSignupError, 
    trackSignupComplete,
    trackEvent,
    hasTrackedPageView 
  } = useAnalytics();
  const formStarted = useRef(false);
  const focusedFields = useRef<Set<string>>(new Set());
  const bannerViewTracked = useRef(false);
  
  // Detect referral code from URL
  const referralCodeFromUrl = useReferralCodeFromUrl();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { registerPendingReferral, fingerprint } = useReferral();

  // Track banner view once when visible
  useEffect(() => {
    if (showConversionBanner && !bannerViewTracked.current && !referralCode) {
      trackEvent('auth_banner_view', '/auth');
      bannerViewTracked.current = true;
    }
  }, [showConversionBanner, referralCode, trackEvent]);

  // Detect URL params for mode selection
  useEffect(() => {
    const signupParam = searchParams.get('signup');
    const loginParam = searchParams.get('login');

    // URL params take priority for mode selection
    if (signupParam !== null) {
      setMode('signup');
      trackEvent('url_param_signup', '/auth');
    } else if (loginParam !== null) {
      setMode('login');
    }
  }, [searchParams, trackEvent]);

  // Track page view once
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      trackPageView('/auth');
      hasTrackedPageView.current = true;
    }
  }, [trackPageView, hasTrackedPageView]);

  // Handle redirect after login when isAdmin is determined
  useEffect(() => {
    if (pendingRedirect && user && isAdmin !== null) {
      console.log('[Auth] Redirecting based on isAdmin:', isAdmin);
      navigate(isAdmin ? '/admin' : '/', { replace: true });
      setPendingRedirect(false);
      setIsLoading(false);
    }
  }, [pendingRedirect, user, isAdmin, navigate]);

  // Store referral code when detected from URL
  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) {
      const code = refFromUrl.toUpperCase();
      setReferralCode(code);
      localStorage.setItem(REFERRAL_CODE_KEY, code);
      // Switch to signup mode when coming from referral link
      setMode('signup');
      setShowConversionBanner(false); // Hide banner when coming from referral
    } else {
      // Check if there's a stored code
      const storedCode = localStorage.getItem(REFERRAL_CODE_KEY);
      if (storedCode) {
        setReferralCode(storedCode);
      }
    }
  }, [searchParams]);

  // Handle banner click - switch to signup, scroll to form, focus first field
  const handleBannerClick = () => {
    // Track analytics
    trackEvent('auth_banner_click', '/auth');
    trackModeSwitch('signup');
    
    // Switch to signup mode
    setMode('signup');
    
    // Small delay to let React update the DOM
    setTimeout(() => {
      // Scroll to form
      signupFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Focus first input after scroll
      setTimeout(() => {
        firstInputRef.current?.focus();
        
        // Highlight form temporarily
        setShowFormHighlight(true);
        setTimeout(() => setShowFormHighlight(false), 1500);
      }, 300);
    }, 50);
  };

  // Handle banner dismiss - save to localStorage with timestamp
  const handleBannerDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering banner click
    trackEvent('auth_banner_dismissed', '/auth');
    localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString());
    setShowConversionBanner(false);
  };

  // Register pending referral after successful signup (does NOT grant bonus immediately)
  useEffect(() => {
    const storedCode = localStorage.getItem(REFERRAL_CODE_KEY);
    if (user && storedCode && fingerprint) {
      // Small delay to ensure user is fully created
      const timer = setTimeout(() => {
        registerPendingReferral();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, fingerprint, registerPendingReferral]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  const phoneLoginForm = useForm<PhoneLoginData>({
    resolver: zodResolver(phoneLoginSchema),
  });

  const handleLogin = async (data: LoginData) => {
    setError(null);
    setIsLoading(true);
    trackFormSubmit('/auth', 'login');
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        setError(translateAuthError(error.message));
        setIsLoading(false);
      } else {
        // Set pending redirect - will navigate once isAdmin is determined by context
        setPendingRedirect(true);
      }
    } catch {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupData) => {
    setError(null);
    trackFormSubmit('/auth', 'signup');
    const formattedPhone = data.phone.startsWith('+') ? data.phone : '+55' + data.phone;
    const { error } = await signUp(data.email, data.password, data.fullName, formattedPhone);
    if (error) {
      const translatedError = translateAuthError(error.message);
      setError(translatedError);
      trackSignupError(translatedError);
    } else {
      trackSignupComplete();
      // After signup, always go to user dashboard (new users are never admins)
      navigate('/');
    }
  };

  const handlePhoneLogin = async (data: PhoneLoginData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      let formattedPhone = data.phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+55' + formattedPhone;
      }
      
      // Look up the email associated with this phone number
      const { data: email, error: lookupError } = await supabase
        .rpc('get_email_by_phone', { _phone: formattedPhone });
      
      if (lookupError) {
        setError('Erro ao buscar telefone. Tente novamente.');
        setIsLoading(false);
        return;
      }
      
      if (!email) {
        setError('Telefone não encontrado. Verifique o número ou cadastre-se.');
        setIsLoading(false);
        return;
      }
      
      // Now sign in with the email and password
      const { error: signInError } = await signIn(email, data.password);
      
      if (signInError) {
        setError(translateAuthError(signInError.message));
        setIsLoading(false);
      } else {
        // Set pending redirect - will navigate once isAdmin is determined by context
        setPendingRedirect(true);
      }
      
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 safe-top safe-bottom">
      {/* Conversion Banner - Shows for non-referral visitors, respects 24h cooldown */}
      {showConversionBanner && mode !== 'phone' && !referralCode && (
        <div 
          onClick={handleBannerClick}
          className="w-full max-w-xs sm:max-w-sm mb-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/40 animate-fade-in cursor-pointer relative group hover:border-primary/60 transition-colors"
        >
          {/* Close button */}
          <button 
            onClick={handleBannerDismiss}
            className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-full transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-profit flex items-center justify-center flex-shrink-0 shadow-lg">
              <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            
            {/* Content */}
            <div className="flex-1 pr-6">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                🎉 Primeira vez aqui, motorista?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua conta grátis e descubra seu lucro real hoje.
              </p>
              
              {/* CTA Button */}
              <Button 
                size="default"
                className="mt-4 w-full bg-gradient-profit hover:opacity-90 text-sm sm:text-base font-bold h-11 sm:h-12 shadow-md group-hover:shadow-lg transition-shadow"
              >
                Criar conta grátis
              </Button>
              
              {/* Microtexto */}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Sem cartão • Leva 1 minuto
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referral Banner */}
      {referralCode && (
        <div className="w-full max-w-xs sm:max-w-sm mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Você foi indicado!</p>
              <p className="text-xs text-muted-foreground">
                Cadastre-se e ganhe <span className="text-primary font-semibold">7 dias de PRO grátis</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="mt-2 text-xs">
            Código: {referralCode}
          </Badge>
        </div>
      )}

      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
        <img src={logo3d} alt="PEDY Driver" className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl mx-auto mb-3 sm:mb-4 shadow-xl" width={128} height={128} loading="eager" fetchPriority="high" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">PEDY Driver</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">Controle seus ganhos como motorista de aplicativo</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary mb-4 sm:mb-6 w-full max-w-xs sm:max-w-sm">
        <button
          onClick={() => { setMode('login'); setError(null); trackModeSwitch('login'); }}
          className={cn(
            'flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-feedback min-h-[40px]',
            mode === 'login'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          )}
        >
          Entrar
        </button>
        <button
          onClick={() => { setMode('signup'); setError(null); trackModeSwitch('signup'); }}
          className={cn(
            'flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-feedback min-h-[40px]',
            mode === 'signup'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          )}
        >
          Criar Conta
        </button>
        <button
          onClick={() => { setMode('phone'); setError(null); trackModeSwitch('phone'); }}
          className={cn(
            'flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-feedback min-h-[40px]',
            mode === 'phone'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          )}
        >
          Telefone
        </button>
      </div>

      {/* Form Container */}
      <div className={cn(
        "w-full max-w-xs sm:max-w-sm bg-card rounded-2xl p-4 sm:p-6 border border-border/50 animate-fade-in transition-all duration-300",
        showFormHighlight && "form-highlight"
      )}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          </div>
        )}

        {mode === 'login' && (
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
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-2xs sm:text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-profit hover:opacity-90 touch-feedback"
              disabled={loginForm.formState.isSubmitting || isLoading}
            >
              {(loginForm.formState.isSubmitting || isLoading) ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        )}

        {mode === 'signup' && (
          <form ref={signupFormRef} onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  ref={firstInputRef}
                  type="text"
                  placeholder="Seu nome"
                  className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                  onFocus={() => {
                    if (!formStarted.current) {
                      formStarted.current = true;
                      trackFormStart('/auth');
                    }
                    if (!focusedFields.current.has('fullName')) {
                      focusedFields.current.add('fullName');
                      trackFieldFocus('fullName', '/auth');
                    }
                  }}
                  {...signupForm.register('fullName')}
                />
              </div>
              {signupForm.formState.errors.fullName && (
                <p className="text-2xs sm:text-xs text-destructive">{signupForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="11999999999"
                  className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                  onFocus={() => {
                    if (!formStarted.current) {
                      formStarted.current = true;
                      trackFormStart('/auth');
                    }
                    if (!focusedFields.current.has('phone')) {
                      focusedFields.current.add('phone');
                      trackFieldFocus('phone', '/auth');
                    }
                  }}
                  {...signupForm.register('phone')}
                />
              </div>
              <p className="text-2xs sm:text-xs text-muted-foreground">DDD + número (sem espaços)</p>
              {signupForm.formState.errors.phone && (
                <p className="text-2xs sm:text-xs text-destructive">{signupForm.formState.errors.phone.message}</p>
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
                  onFocus={() => {
                    if (!formStarted.current) {
                      formStarted.current = true;
                      trackFormStart('/auth');
                    }
                    if (!focusedFields.current.has('email')) {
                      focusedFields.current.add('email');
                      trackFieldFocus('email', '/auth');
                    }
                  }}
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
                  onFocus={() => {
                    if (!formStarted.current) {
                      formStarted.current = true;
                      trackFormStart('/auth');
                    }
                    if (!focusedFields.current.has('password')) {
                      focusedFields.current.add('password');
                      trackFieldFocus('password', '/auth');
                    }
                  }}
                  {...signupForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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

            {/* Legal consent text */}
            <p className="text-2xs text-muted-foreground text-center mt-3">
              Ao criar sua conta, você concorda com os{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </p>
          </form>
        )}

        {mode === 'phone' && (
          <form onSubmit={phoneLoginForm.handleSubmit(handlePhoneLogin)} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Telefone (WhatsApp)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="11999999999"
                  className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                  {...phoneLoginForm.register('phone')}
                />
              </div>
              <p className="text-2xs sm:text-xs text-muted-foreground">DDD + número (sem espaços)</p>
              {phoneLoginForm.formState.errors.phone && (
                <p className="text-2xs sm:text-xs text-destructive">{phoneLoginForm.formState.errors.phone.message}</p>
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
                  {...phoneLoginForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {phoneLoginForm.formState.errors.password && (
                <p className="text-2xs sm:text-xs text-destructive">{phoneLoginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-profit hover:opacity-90 touch-feedback"
              disabled={isLoading || phoneLoginForm.formState.isSubmitting}
            >
              {isLoading ? 'Entrando...' : 'Entrar com Telefone'}
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
