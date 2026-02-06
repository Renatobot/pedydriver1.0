import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const SESSION_KEY = 'pedy_analytics_session';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  id: string;
  timestamp: number;
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getReferrer(): string {
  const ref = document.referrer;
  if (!ref) return 'direct';
  
  try {
    const url = new URL(ref);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('facebook') || hostname.includes('fb.com')) return 'facebook';
    if (hostname.includes('instagram')) return 'instagram';
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('tiktok')) return 'tiktok';
    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('whatsapp')) return 'whatsapp';
    
    // Check if it's the same domain (internal navigation)
    if (hostname === window.location.hostname) return 'internal';
    
    return hostname;
  } catch {
    return 'unknown';
  }
}

function getOrCreateSession(): string {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session: SessionData = JSON.parse(stored);
      const isExpired = Date.now() - session.timestamp > SESSION_EXPIRY;
      
      if (!isExpired) {
        // Update timestamp to extend session
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          id: session.id,
          timestamp: Date.now()
        }));
        return session.id;
      }
    }
    
    // Create new session
    const newSession: SessionData = {
      id: generateSessionId(),
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return newSession.id;
  } catch {
    return generateSessionId();
  }
}

export function useAnalytics() {
  const sessionId = useRef<string>(getOrCreateSession());
  const deviceType = useRef<string>(getDeviceType());
  const referrer = useRef<string>(getReferrer());
  const hasTrackedPageView = useRef<boolean>(false);

  // Track generic event
  const trackEvent = useCallback(async (
    eventType: string,
    page: string,
    metadata: Record<string, unknown> = {}
  ) => {
    try {
      await supabase.from('analytics_events').insert([{
        session_id: sessionId.current,
        event_type: eventType,
        page,
        metadata: metadata as Json,
        referrer: referrer.current,
        device_type: deviceType.current
      }]);
    } catch (err) {
      console.error('[Analytics] Failed to track event:', err);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback((page: string) => {
    trackEvent('page_view', page);
  }, [trackEvent]);

  // Track CTA click
  const trackCTAClick = useCallback((buttonId: string, page: string) => {
    trackEvent('cta_click', page, { button: buttonId });
  }, [trackEvent]);

  // Track scroll depth
  const trackScrollDepth = useCallback((depth: number, page: string) => {
    trackEvent('scroll_depth', page, { depth });
  }, [trackEvent]);

  // Track mode switch (login/signup/phone)
  const trackModeSwitch = useCallback((mode: string) => {
    trackEvent('mode_switch', '/auth', { mode });
  }, [trackEvent]);

  // Track form start (first field focus)
  const trackFormStart = useCallback((page: string) => {
    trackEvent('form_start', page);
  }, [trackEvent]);

  // Track field focus
  const trackFieldFocus = useCallback((field: string, page: string) => {
    trackEvent('field_focus', page, { field });
  }, [trackEvent]);

  // Track form submit
  const trackFormSubmit = useCallback((page: string, formType: string) => {
    trackEvent('form_submit', page, { form_type: formType });
  }, [trackEvent]);

  // Track signup error
  const trackSignupError = useCallback((error: string) => {
    trackEvent('signup_error', '/auth', { error });
  }, [trackEvent]);

  // Track signup complete
  const trackSignupComplete = useCallback(() => {
    trackEvent('signup_complete', '/auth');
  }, [trackEvent]);

  // Track section view
  const trackSectionView = useCallback((section: string, page: string) => {
    trackEvent('section_view', page, { section });
  }, [trackEvent]);

  return {
    sessionId: sessionId.current,
    deviceType: deviceType.current,
    referrer: referrer.current,
    trackEvent,
    trackPageView,
    trackCTAClick,
    trackScrollDepth,
    trackModeSwitch,
    trackFormStart,
    trackFieldFocus,
    trackFormSubmit,
    trackSignupError,
    trackSignupComplete,
    trackSectionView,
    hasTrackedPageView,
  };
}
