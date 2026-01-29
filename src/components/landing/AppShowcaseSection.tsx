import { MockDashboard } from './MockDashboard';
import { MockReports } from './MockReports';
import { MockEntry } from './MockEntry';

export function AppShowcaseSection() {
  return (
    <section className="py-16 sm:py-20 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 mb-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Veja o que você encontra no <span className="text-primary">PEDY Driver</span>
          </h2>
          <p className="text-muted-foreground">
            Tudo pensado para quem vive na rua, no celular.
          </p>
        </div>
      </div>
      
      {/* Horizontal scroll gallery */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide">
          <div className="snap-center">
            <MockDashboard />
          </div>
          <div className="snap-center">
            <MockReports />
          </div>
          <div className="snap-center">
            <MockEntry />
          </div>
        </div>
        
        {/* Gradient overlays for scroll hint */}
        <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
      
      {/* Scroll indicator */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        ← Deslize para ver mais →
      </p>
    </section>
  );
}
