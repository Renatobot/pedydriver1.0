import { useState } from 'react';
import { Gift, Copy, Share2, Trophy, Loader2, ExternalLink, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/useReferral';
import { ReferralProgressBanner } from './ReferralProgressBanner';
import { cn } from '@/lib/utils';

export function ReferralCard() {
  const {
    referralCode,
    totalReferrals,
    pendingReferrals,
    bonusDaysEarned,
    wasReferred,
    canShowReferralCard,
    daysRemaining,
    isLoading,
    progress,
    copyLink,
    shareLink,
    getShareableLink,
    checkAndCompletePendingReferral,
  } = useReferral();

  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    await copyLink();
    setTimeout(() => setCopying(false), 1000);
  };

  const handleShare = async () => {
    setSharing(true);
    await shareLink();
    setTimeout(() => setSharing(false), 1000);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show progress banner if user has a pending referral
  if (progress?.hasPending) {
    return (
      <ReferralProgressBanner 
        progress={progress} 
        onCheckReferral={checkAndCompletePendingReferral}
      />
    );
  }

  // Hide card if account is too new (< 48h) and no successful referrals
  if (!canShowReferralCard) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Indique e Ganhe</CardTitle>
          </div>
          {wasReferred && (
            <Badge variant="secondary" className="text-xs">
              Você foi indicado 🎉
            </Badge>
          )}
        </div>
        <CardDescription>
          Convide amigos e ganhe 7 dias de PRO grátis por cada indicação!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div className="bg-background/80 rounded-xl p-4 border border-primary/30">
          <p className="text-xs text-muted-foreground mb-2">Seu código de indicação:</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tracking-widest text-primary">
              {referralCode || '------'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleCopy}
                disabled={!referralCode || copying}
              >
                {copying ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleShare}
                disabled={!referralCode || sharing}
              >
                {sharing ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <Button
          className="w-full bg-gradient-profit hover:opacity-90"
          onClick={handleShare}
          disabled={!referralCode}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar Link
          <ExternalLink className="w-3 h-3 ml-2" />
        </Button>

        {/* Pending referrals notice */}
        {pendingReferrals > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {pendingReferrals} indicação{pendingReferrals > 1 ? 'ões' : ''} pendente{pendingReferrals > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seu{pendingReferrals > 1 ? 's' : ''} amigo{pendingReferrals > 1 ? 's' : ''} se cadastrou{pendingReferrals > 1 ? 'ram' : ''}! O bônus será liberado quando {pendingReferrals > 1 ? 'eles usarem' : 'ele usar'} o app normalmente (registrar ganhos, despesas, etc).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 90-day limit warning */}
        {daysRemaining >= 80 && (
          <div className={cn(
            "rounded-xl p-3 border",
            daysRemaining >= 90 
              ? "bg-primary/10 border-primary/30" 
              : "bg-amber-500/10 border-amber-500/30"
          )}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                daysRemaining >= 90 ? "text-primary" : "text-amber-500"
              )} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {daysRemaining >= 90 
                    ? "Você atingiu o máximo de 90 dias acumulados!"
                    : `Seu PRO expira em ${Math.floor(daysRemaining)} dias`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Continue indicando para manter seu PRO ativo sempre.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatsCard
            icon={<UserCheck className="w-4 h-4" />}
            label="Confirmadas"
            value={totalReferrals}
            highlight={totalReferrals > 0}
          />
          <StatsCard
            icon={<Clock className="w-4 h-4" />}
            label="Pendentes"
            value={pendingReferrals}
            highlight={pendingReferrals > 0}
            variant="pending"
          />
          <StatsCard
            icon={<Trophy className="w-4 h-4" />}
            label="Dias ganhos"
            value={bonusDaysEarned}
            highlight={bonusDaysEarned > 0}
          />
        </div>

        {/* How it works */}
        <div className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-primary/20">
          <p className="font-medium text-foreground">Como funciona:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Compartilhe seu link com amigos</li>
            <li>Seu amigo se cadastra usando seu código</li>
            <li>Vocês dois ganham 7 dias de PRO grátis!</li>
          </ol>
        </div>

        {/* Link preview */}
        {referralCode && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 break-all">
            {getShareableLink()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsCard({
  icon,
  label,
  value,
  highlight,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight: boolean;
  variant?: 'default' | 'pending';
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-2 text-center transition-colors',
        highlight
          ? variant === 'pending'
            ? 'bg-amber-500/20 border border-amber-500/30'
            : 'bg-primary/20 border border-primary/30'
          : 'bg-muted/50'
      )}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span className={
          highlight 
            ? variant === 'pending' 
              ? 'text-amber-500' 
              : 'text-primary' 
            : 'text-muted-foreground'
        }>
          {icon}
        </span>
        <span className={cn(
          'text-lg font-bold',
          highlight 
            ? variant === 'pending' 
              ? 'text-amber-500' 
              : 'text-primary' 
            : 'text-foreground'
        )}>
          {value}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
