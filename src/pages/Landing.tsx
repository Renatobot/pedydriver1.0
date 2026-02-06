import { useEffect, useRef } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { AppShowcaseSection } from '@/components/landing/AppShowcaseSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { TargetAudienceSection } from '@/components/landing/TargetAudienceSection';
import { PricingPreview } from '@/components/landing/PricingPreview';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { TrustFooter } from '@/components/landing/TrustFooter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export default function Landing() {
  const { trackPageView, trackScrollDepth, trackSectionView, hasTrackedPageView } = useAnalytics();
  const scrollDepthsTracked = useRef<Set<number>>(new Set());
  
  const problemSection = useScrollReveal();
  const solutionSection = useScrollReveal();
  const howItWorksSection = useScrollReveal();
  const showcaseSection = useScrollReveal();
  const socialProofSection = useScrollReveal();
  const targetAudienceSection = useScrollReveal();
  const pricingSection = useScrollReveal();
  const faqSection = useScrollReveal();
  const finalCtaSection = useScrollReveal();

  // Track page view once
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      trackPageView('/landing');
      hasTrackedPageView.current = true;
    }
  }, [trackPageView, hasTrackedPageView]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      const thresholds = [25, 50, 75, 100];
      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !scrollDepthsTracked.current.has(threshold)) {
          scrollDepthsTracked.current.add(threshold);
          trackScrollDepth(threshold, '/landing');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScrollDepth]);

  // Track section views
  useEffect(() => {
    if (problemSection.isVisible) trackSectionView('problem', '/landing');
  }, [problemSection.isVisible, trackSectionView]);

  useEffect(() => {
    if (solutionSection.isVisible) trackSectionView('solution', '/landing');
  }, [solutionSection.isVisible, trackSectionView]);

  useEffect(() => {
    if (pricingSection.isVisible) trackSectionView('pricing', '/landing');
  }, [pricingSection.isVisible, trackSectionView]);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main>
        <HeroSection />
        
        <div ref={problemSection.ref} className={cn("scroll-reveal", problemSection.isVisible && "visible")}>
          <ProblemSection />
        </div>
        
        <div ref={solutionSection.ref} className={cn("scroll-reveal", solutionSection.isVisible && "visible")}>
          <SolutionSection />
        </div>
        
        <div ref={howItWorksSection.ref} className={cn("scroll-reveal", howItWorksSection.isVisible && "visible")}>
          <HowItWorksSection />
        </div>
        
        <div ref={showcaseSection.ref} className={cn("scroll-reveal", showcaseSection.isVisible && "visible")}>
          <AppShowcaseSection />
        </div>
        
        <div ref={socialProofSection.ref} className={cn("scroll-reveal", socialProofSection.isVisible && "visible")}>
          <SocialProofSection />
        </div>
        
        <div ref={targetAudienceSection.ref} className={cn("scroll-reveal", targetAudienceSection.isVisible && "visible")}>
          <TargetAudienceSection />
        </div>
        
        <div ref={pricingSection.ref} className={cn("scroll-reveal", pricingSection.isVisible && "visible")}>
          <PricingPreview />
        </div>
        
        <div ref={faqSection.ref} className={cn("scroll-reveal", faqSection.isVisible && "visible")}>
          <FAQSection />
        </div>
        
        <div ref={finalCtaSection.ref} className={cn("scroll-reveal-scale", finalCtaSection.isVisible && "visible")}>
          <FinalCTA />
        </div>
      </main>
      
      <TrustFooter />
    </div>
  );
}
