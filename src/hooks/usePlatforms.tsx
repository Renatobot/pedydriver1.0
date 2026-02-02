import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Platform } from '@/types/database';
import { useAuth } from './useAuth';

// Default priority order for platforms (most common first)
const DEFAULT_PLATFORM_ORDER: Record<string, number> = {
  'uber': 1,
  '99': 2,
  'ifood': 3,
  '99 food': 4,
  'cabify': 5,
  'indrive': 6,
  'lalamove': 7,
  'loggi': 8,
  'rappi': 9,
};

function getPlatformPriority(name: string): number {
  const normalized = name.toLowerCase().trim();
  return DEFAULT_PLATFORM_ORDER[normalized] ?? 100;
}

export function usePlatforms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['platforms', user?.id],
    queryFn: async (): Promise<Platform[]> => {
      // Fetch platforms
      const { data: platforms, error: platformsError } = await supabase
        .from('platforms')
        .select('*');
      
      if (platformsError) throw platformsError;
      if (!platforms) return [];

      // If user is logged in, fetch their earnings to determine usage
      let usageMap: Record<string, number> = {};
      
      if (user) {
        const { data: earnings } = await supabase
          .from('earnings')
          .select('platform_id')
          .eq('user_id', user.id);
        
        if (earnings && earnings.length > 0) {
          // Count usage per platform
          earnings.forEach(e => {
            if (e.platform_id) {
              usageMap[e.platform_id] = (usageMap[e.platform_id] || 0) + 1;
            }
          });
        }
      }

      const hasUserData = Object.keys(usageMap).length > 0;

      // Sort platforms
      const sorted = [...platforms].sort((a, b) => {
        if (hasUserData) {
          // Sort by user usage (descending), then by default priority
          const usageA = usageMap[a.id] || 0;
          const usageB = usageMap[b.id] || 0;
          if (usageB !== usageA) return usageB - usageA;
        }
        
        // Fallback to default priority order
        const priorityA = getPlatformPriority(a.name);
        const priorityB = getPlatformPriority(b.name);
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // Finally, alphabetical
        return a.name.localeCompare(b.name);
      });

      return sorted as Platform[];
    }
  });
}
