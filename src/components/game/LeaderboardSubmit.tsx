import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Send, Loader2, Check } from 'lucide-react';
import { submitScore, generatePenguinName } from '@/lib/leaderboard';
import { z } from 'zod';
import { toast } from 'sonner';

// Validation schema
const nameSchema = z.string()
  .min(1, 'Name cannot be empty')
  .max(20, 'Name must be 20 characters or less')
  .regex(/^[a-zA-Z0-9\s]*$/, 'Only letters, numbers, and spaces allowed');

interface LeaderboardSubmitProps {
  distance: number;
  fishCollected: number;
  biomeReached: string;
  onSubmitted?: (rank: number) => void;
}

export const LeaderboardSubmit = ({
  distance,
  fishCollected,
  biomeReached,
  onSubmitted,
}: LeaderboardSubmitProps) => {
  const [playerName, setPlayerName] = useState(generatePenguinName());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    // Validate name
    const result = nameSchema.safeParse(playerName);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    const response = await submitScore({
      playerName,
      distance,
      fishCollected,
      biomeReached,
    });
    
    setSubmitting(false);
    
    if (response.success) {
      setSubmitted(true);
      setRank(response.rank);
      onSubmitted?.(response.rank);
      toast.success(`Score submitted! You ranked #${response.rank}!`);
    } else {
      toast.error('Failed to submit score. Try again later.');
    }
  };
  
  if (submitted && rank) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-fish/10 border border-fish/30 rounded-xl p-4 text-center"
      >
        <Check className="w-8 h-8 text-fish mx-auto mb-2" />
        <p className="font-display text-xl text-foreground">
          You ranked #{rank} globally!
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Your journey has been recorded in history.
        </p>
      </motion.div>
    );
  }
  
  return (
    <div className="bg-secondary/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-fish" />
        <h3 className="font-display text-lg text-foreground">Submit to Leaderboard</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Input
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setError(null);
            }}
            placeholder="Enter your name..."
            maxLength={20}
            className="bg-background/50"
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Max 20 characters, letters and numbers only
          </p>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 font-display tracking-wide
                   bg-gradient-to-r from-fish/80 to-accent/60 
                   hover:from-fish hover:to-accent"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Score
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
