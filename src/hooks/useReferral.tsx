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
  isLoading: boolean;
}

interface ValidateResult {
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
    isLoading: true,
  });

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
      } | null;

      setData({
        referralCode: codeData?.[0]?.referral_code || null,
        totalReferrals: stats?.total_referrals || 0,
        pendingReferrals: stats?.pending_referrals || 0,
        bonusDaysEarned: stats?.bonus_days_earned || 0,
        wasReferred: stats?.was_referred || false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, fingerprint]);

  useEffect(() => {
    if (!fingerprintLoading && user) {
      loadReferralData();
    }
  }, [user, fingerprint, fingerprintLoading, loadReferralData]);

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

  // Validate and complete referral after signup
  const validateReferral = useCallback(async (): Promise<ValidateResult> => {
    const storedCode = getStoredReferralCode();
    
    if (!storedCode || !fingerprint || !user) {
      return { success: false, error: 'missing_data' };
    }

    try {
      const { data: result, error } = await supabase
        .rpc('validate_referral', {
          _referral_code: storedCode,
          _device_fingerprint: fingerprint,
        });

      if (error) {
        console.error('Error validating referral:', error);
        return { success: false, error: 'validation_error' };
      }

      const resultObj = result as { success: boolean; error?: string; bonus_days?: number };

      if (resultObj.success) {
        clearStoredReferralCode();
        toast.success('🎉 Indicação confirmada! Você ganhou 7 dias de PRO grátis!');
        // Reload data
        setTimeout(loadReferralData, 1000);
        return { success: true, bonusDays: resultObj.bonus_days };
      } else {
        // Keep the code stored in case of temporary errors
        const errorMessages: Record<string, string> = {
          invalid_code: 'Código de indicação inválido',
          self_referral: 'Você não pode usar seu próprio código',
          same_device: 'Indicação não aceita - mesmo dispositivo do indicador',
          device_already_used: 'Este dispositivo já foi usado em outra indicação',
          already_referred: 'Você já foi indicado por alguém',
        };

        const errorMessage = errorMessages[resultObj.error || ''] || 'Erro ao validar indicação';
        
        // Clear code for permanent errors
        if (['invalid_code', 'self_referral', 'same_device', 'device_already_used', 'already_referred'].includes(resultObj.error || '')) {
          clearStoredReferralCode();
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Error in validateReferral:', error);
      return { success: false, error: 'Erro inesperado' };
    }
  }, [fingerprint, user, getStoredReferralCode, clearStoredReferralCode, loadReferralData]);

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
    fingerprint,
    fingerprintLoading,
    storeReferralCode,
    getStoredReferralCode,
    clearStoredReferralCode,
    validateReferral,
    getShareableLink,
    copyLink,
    shareLink,
    reload: loadReferralData,
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
