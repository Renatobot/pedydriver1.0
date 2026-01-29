import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { AppShowcaseSection } from '@/components/landing/AppShowcaseSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { TargetAudienceSection } from '@/components/landing/TargetAudienceSection';
import { PricingPreview } from '@/components/landing/PricingPreview';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { TrustFooter } from '@/components/landing/TrustFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <AppShowcaseSection />
        <SocialProofSection />
        <TargetAudienceSection />
        <PricingPreview />
        <FinalCTA />
      </main>
      
      <TrustFooter />
    </div>
  );
}
