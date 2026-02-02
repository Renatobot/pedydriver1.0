import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDeviceFingerprint } from './useDeviceFingerprint';
import { toast } from 'sonner';

interface ReferralData {
  referralCode: string | null;
  totalReferrals: number;
  pendingReferrals: number;
  bonusDaysEarned: number;
  wasReferred: boolean;
  canShowReferralCard: boolean;
  accountAgeHours: number;
  isLoading: boolean;
}

interface ReferralProgress {
  hasPending: boolean;
  accountAgeHours: number;
  hoursUntilEligible: number;
  criteriaMet: number;
  criteriaNeeded: number;
  hasVehicle: boolean;
  hasEarnings: boolean;
  hasExpenses: boolean;
  hasShifts: boolean;
  isEligible: boolean;
}

interface RegisterResult {
  success: boolean;
  error?: string;
  status?: string;
}

interface CheckResult {
  success: boolean;
  error?: string;
  bonusDays?: number;
}

const REFERRAL_CODE_KEY = 'pedy_referral_code';

export function useReferral() {
  const { user } = useAuth();
  const { fingerprint, isLoading: fingerprintLoading } = useDeviceFingerprint();
  const [data, setData] = useState<ReferralData>({
    referralCode: null,
    totalReferrals: 0,
    pendingReferrals: 0,
    bonusDaysEarned: 0,
    wasReferred: false,
    canShowReferralCard: false,
    accountAgeHours: 0,
    isLoading: true,
  });
  const [progress, setProgress] = useState<ReferralProgress | null>(null);

  // Load referral code and stats
  const loadReferralData = useCallback(async () => {
    if (!user || !fingerprint) return;

    try {
      // Get or create referral code
      const { data: codeData, error: codeError } = await supabase
        .rpc('get_or_create_referral_code', { _device_fingerprint: fingerprint });

      if (codeError) {
        console.error('Error getting referral code:', codeError);
        setData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Get referral stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_referral_stats');

      if (statsError) {
        console.error('Error getting referral stats:', statsError);
      }

      const stats = statsData as {
        total_referrals: number;
        pending_referrals: number;
        bonus_days_earned: number;
        was_referred: boolean;
        account_age_hours: number;
        can_show_referral_card: boolean;
      } | null;

      setData({
        referralCode: codeData?.[0]?.referral_code || null,
        totalReferrals: stats?.total_referrals || 0,
        pendingReferrals: stats?.pending_referrals || 0,
        bonusDaysEarned: stats?.bonus_days_earned || 0,
        wasReferred: stats?.was_referred || false,
        canShowReferralCard: stats?.can_show_referral_card || false,
        accountAgeHours: stats?.account_age_hours || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, fingerprint]);

  // Load referral progress for referred users
  const loadReferralProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data: progressData, error } = await supabase
        .rpc('get_referral_progress');

      if (error) {
        console.error('Error getting referral progress:', error);
        return;
      }

      const p = progressData as {
        has_pending: boolean;
        account_age_hours?: number;
        hours_until_eligible?: number;
        criteria_met?: number;
        criteria_needed?: number;
        has_vehicle?: boolean;
        has_earnings?: boolean;
        has_expenses?: boolean;
        has_shifts?: boolean;
        is_eligible?: boolean;
      } | null;

      if (p?.has_pending) {
        setProgress({
          hasPending: true,
          accountAgeHours: p.account_age_hours || 0,
          hoursUntilEligible: p.hours_until_eligible || 0,
          criteriaMet: p.criteria_met || 0,
          criteriaNeeded: p.criteria_needed || 2,
          hasVehicle: p.has_vehicle || false,
          hasEarnings: p.has_earnings || false,
          hasExpenses: p.has_expenses || false,
          hasShifts: p.has_shifts || false,
          isEligible: p.is_eligible || false,
        });
      } else {
        setProgress(null);
      }
    } catch (error) {
      console.error('Error loading referral progress:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!fingerprintLoading && user) {
      loadReferralData();
      loadReferralProgress();
    }
  }, [user, fingerprint, fingerprintLoading, loadReferralData, loadReferralProgress]);

  // Store referral code from URL to localStorage (before signup)
  const storeReferralCode = useCallback((code: string) => {
    localStorage.setItem(REFERRAL_CODE_KEY, code.toUpperCase());
  }, []);

  // Get stored referral code
  const getStoredReferralCode = useCallback((): string | null => {
    return localStorage.getItem(REFERRAL_CODE_KEY);
  }, []);

  // Clear stored referral code
  const clearStoredReferralCode = useCallback(() => {
    localStorage.removeItem(REFERRAL_CODE_KEY);
  }, []);

  // Register pending referral after signup (does NOT grant bonus immediately)
  const registerPendingReferral = useCallback(async (): Promise<RegisterResult> => {
    const storedCode = getStoredReferralCode();
    
    if (!storedCode || !fingerprint || !user) {
      return { success: false, error: 'missing_data' };
    }

    try {
      const { data: result, error } = await supabase
        .rpc('register_pending_referral', {
          _referral_code: storedCode,
          _device_fingerprint: fingerprint,
        });

      if (error) {
        console.error('Error registering pending referral:', error);
        return { success: false, error: 'registration_error' };
      }

      const resultObj = result as { success: boolean; error?: string; status?: string };

      if (resultObj.success) {
        clearStoredReferralCode();
        // Don't show success toast yet - referral is pending
        loadReferralProgress();
        return { success: true, status: 'pending' };
      } else {
        // Handle errors
        const errorMessages: Record<string, string> = {
          invalid_code: 'Código de indicação inválido',
          self_referral: 'Você não pode usar seu próprio código',
          same_device: 'Indicação não aceita - mesmo dispositivo do indicador',
          device_already_used: 'Este dispositivo já foi usado em outra indicação',
          already_referred: 'Você já foi indicado por alguém',
        };

        const permanentErrors = ['invalid_code', 'self_referral', 'same_device', 'device_already_used', 'already_referred'];
        if (permanentErrors.includes(resultObj.error || '')) {
          clearStoredReferralCode();
        }

        return { success: false, error: errorMessages[resultObj.error || ''] || 'Erro ao registrar indicação' };
      }
    } catch (error) {
      console.error('Error in registerPendingReferral:', error);
      return { success: false, error: 'Erro inesperado' };
    }
  }, [fingerprint, user, getStoredReferralCode, clearStoredReferralCode, loadReferralProgress]);

  // Check and complete pending referral (called periodically or on actions)
  const checkAndCompletePendingReferral = useCallback(async (): Promise<CheckResult> => {
    if (!user) {
      return { success: false, error: 'not_authenticated' };
    }

    try {
      const { data: result, error } = await supabase
        .rpc('check_pending_referrals');

      if (error) {
        console.error('Error checking pending referrals:', error);
        return { success: false, error: 'check_error' };
      }

      const resultObj = result as { success: boolean; error?: string; bonus_days?: number };

      if (resultObj.success) {
        toast.success('🎉 Indicação confirmada! Você ganhou 7 dias de PRO grátis!');
        loadReferralData();
        loadReferralProgress();
        return { success: true, bonusDays: resultObj.bonus_days };
      }

      return { success: false, error: resultObj.error };
    } catch (error) {
      console.error('Error in checkAndCompletePendingReferral:', error);
      return { success: false, error: 'Erro inesperado' };
    }
  }, [user, loadReferralData, loadReferralProgress]);

  // Legacy validateReferral - now just calls registerPendingReferral
  const validateReferral = useCallback(async () => {
    return registerPendingReferral();
  }, [registerPendingReferral]);

  // Generate shareable link
  const getShareableLink = useCallback(() => {
    if (!data.referralCode) return null;
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${data.referralCode}`;
  }, [data.referralCode]);

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    const link = getShareableLink();
    if (!link) return false;

    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado!');
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copiado!');
      return true;
    }
  }, [getShareableLink]);

  // Share via native share API
  const shareLink = useCallback(async () => {
    const link = getShareableLink();
    if (!link) return false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PEDY Driver - Convite',
          text: 'Use meu código e ganhe 7 dias de PRO grátis no PEDY Driver!',
          url: link,
        });
        return true;
      } catch (err) {
        // User cancelled or share failed
        return false;
      }
    } else {
      // Fallback to copy
      return copyLink();
    }
  }, [getShareableLink, copyLink]);

  return {
    ...data,
    progress,
    fingerprint,
    fingerprintLoading,
    storeReferralCode,
    getStoredReferralCode,
    clearStoredReferralCode,
    registerPendingReferral,
    checkAndCompletePendingReferral,
    validateReferral, // Legacy alias
    getShareableLink,
    copyLink,
    shareLink,
    reload: loadReferralData,
    reloadProgress: loadReferralProgress,
  };
}

// Hook to check for referral code in URL
export function useReferralCodeFromUrl() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      setCode(refCode.toUpperCase());
      // Store immediately for later use
      localStorage.setItem(REFERRAL_CODE_KEY, refCode.toUpperCase());
    }
  }, []);

  return code;
}
