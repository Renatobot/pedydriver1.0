import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAUpdatePrompt() {
  const { showUpdatePrompt, updateApp, dismissUpdate } = usePWAUpdate();

  if (!showUpdatePrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-2xl border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">Nova versão disponível!</h3>
              <p className="text-sm opacity-90 mt-0.5">
                Atualize agora para ter as últimas melhorias e novidades.
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={updateApp}
                  size="sm"
                  className="bg-white text-primary hover:bg-white/90 font-semibold gap-2"
                >
                  <Download className="w-4 h-4" />
                  Atualizar agora
                </Button>
                <Button
                  onClick={dismissUpdate}
                  size="sm"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-white/10"
                >
                  Depois
                </Button>
              </div>
            </div>
            
            <button
              onClick={dismissUpdate}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 opacity-70" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
