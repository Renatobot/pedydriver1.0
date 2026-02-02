import { useState } from 'react';
import { Gift, Copy, Share2, Users, Trophy, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/useReferral';
import { cn } from '@/lib/utils';

export function ReferralCard() {
  const {
    referralCode,
    totalReferrals,
    bonusDaysEarned,
    wasReferred,
    isLoading,
    copyLink,
    shareLink,
    getShareableLink,
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon={<Users className="w-4 h-4" />}
            label="Indicações"
            value={totalReferrals}
            highlight={totalReferrals > 0}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-3 text-center transition-colors',
        highlight
          ? 'bg-primary/20 border border-primary/30'
          : 'bg-muted/50'
      )}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className={highlight ? 'text-primary' : 'text-muted-foreground'}>
          {icon}
        </span>
        <span className={cn(
          'text-xl font-bold',
          highlight ? 'text-primary' : 'text-foreground'
        )}>
          {value}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
