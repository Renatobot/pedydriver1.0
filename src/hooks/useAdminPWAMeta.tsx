import { useEffect } from 'react';

/**
 * Hook para injetar meta tags específicas do admin no iOS.
 * No iOS, a instalação de PWAs usa as meta tags da página, não o manifest.json.
 * Este hook garante que quando um admin acessa /admin/*, as meta tags corretas
 * serão injetadas para que o app seja instalado como "PEDY Admin" com ícone diferenciado.
 */
export function useAdminPWAMeta() {
  useEffect(() => {
    // Store original values
    const originalTitle = document.title;
    const originalAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content');
    const originalFavicon = document.querySelector('link[rel="icon"]')?.getAttribute('href');
    const originalManifest = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    
    // Get existing apple-touch-icon links
    const originalAppleTouchIcons: { sizes: string | null; href: string }[] = [];
    document.querySelectorAll('link[rel="apple-touch-icon"]').forEach((link) => {
      originalAppleTouchIcons.push({
        sizes: link.getAttribute('sizes'),
        href: link.getAttribute('href') || '',
      });
    });

    // Helper to update or create meta tag
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to update link tag
    const updateLinkTag = (rel: string, href: string) => {
      const link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (link) {
        link.href = href;
      }
    };

    // Apply admin-specific meta tags for iOS PWA
    document.title = 'PEDY Admin - Painel Administrativo';
    updateMetaTag('apple-mobile-web-app-title', 'PEDY Admin');
    updateLinkTag('icon', '/icons/admin-icon-512.png');
    updateLinkTag('manifest', '/admin-manifest.json');

    // Update apple-touch-icon links
    document.querySelectorAll('link[rel="apple-touch-icon"]').forEach((link) => {
      const sizes = link.getAttribute('sizes');
      if (sizes === '512x512' || !sizes) {
        (link as HTMLLinkElement).href = '/icons/admin-icon-512.png';
      } else if (sizes === '192x192') {
        (link as HTMLLinkElement).href = '/icons/admin-icon-192.png';
      }
    });

    // Cleanup: restore original values when unmounting
    return () => {
      document.title = originalTitle;
      
      if (originalAppleTitle) {
        updateMetaTag('apple-mobile-web-app-title', originalAppleTitle);
      }
      
      if (originalFavicon) {
        updateLinkTag('icon', originalFavicon);
      }
      
      if (originalManifest) {
        updateLinkTag('manifest', originalManifest);
      }

      // Restore apple-touch-icon links
      const currentAppleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
      currentAppleTouchIcons.forEach((link, index) => {
        if (originalAppleTouchIcons[index]) {
          (link as HTMLLinkElement).href = originalAppleTouchIcons[index].href;
        }
      });
    };
  }, []);
}
