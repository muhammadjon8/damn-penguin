import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, MessageCircle, Copy, Check } from 'lucide-react';
import { 
  shareToTwitter, 
  shareToWhatsApp, 
  copyShareLink, 
  shareNative, 
  canNativeShare,
  markShared 
} from '@/lib/sharing';
import { toast } from 'sonner';

interface ShareButtonsProps {
  distance: number;
  biome: string;
  fish: number;
  onShare?: () => void;
  variant?: 'compact' | 'full';
}

export const ShareButtons = ({ 
  distance, 
  biome, 
  fish, 
  onShare,
  variant = 'full' 
}: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  
  const handleShare = (method: () => void | Promise<boolean>) => {
    markShared();
    method();
    onShare?.();
  };
  
  const handleCopy = async () => {
    const success = await copyShareLink(distance, biome, fish);
    if (success) {
      setCopied(true);
      markShared();
      onShare?.();
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };
  
  const handleNativeShare = async () => {
    const success = await shareNative(distance, biome, fish);
    if (success) {
      markShared();
      onShare?.();
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        {canNativeShare() ? (
          <Button
            onClick={handleNativeShare}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        ) : (
          <>
            <Button
              onClick={() => handleShare(() => shareToTwitter(distance, biome, fish))}
              variant="outline"
              size="icon"
              className="w-9 h-9"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="w-9 h-9"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Primary share button (native or main action) */}
      {canNativeShare() && (
        <Button
          onClick={handleNativeShare}
          className="w-full py-5 text-base font-display tracking-wide
                   bg-gradient-to-r from-fish/80 to-accent/60 
                   hover:from-fish hover:to-accent
                   transition-all duration-300"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Your Journey
        </Button>
      )}
      
      {/* Social buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleShare(() => shareToTwitter(distance, biome, fish))}
          variant="outline"
          className="flex-1 py-4"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </Button>
        <Button
          onClick={() => handleShare(() => shareToWhatsApp(distance, biome, fish))}
          variant="outline"
          className="flex-1 py-4"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex-1 py-4"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
      
      {/* Share incentive */}
      <p className="text-xs text-muted-foreground/60 text-center italic">
        Share to unlock special penguin thoughts ✨
      </p>
    </div>
  );
};
