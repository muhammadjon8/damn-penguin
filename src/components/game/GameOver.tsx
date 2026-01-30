import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, Home } from 'lucide-react';
import { shareResult, saveToLeaderboard } from './SettingsMenu';
import { useEffect, useRef, useState } from 'react';

// Poetic journey messages based on distance
const getJourneyMessage = (distance: number): string => {
  if (distance >= 20000) return "A legendary wanderer. The ice itself remembers your passage.";
  if (distance >= 15000) return "Few have ventured so far into the unknown.";
  if (distance >= 10000) return "The mountains have witnessed your determination.";
  if (distance >= 7500) return "A journey that defies the cold and the doubt.";
  if (distance >= 5000) return "The path grows longer, but so does your spirit.";
  if (distance >= 3000) return "Every step tells a story worth remembering.";
  if (distance >= 1500) return "A meaningful beginning to an endless quest.";
  if (distance >= 500) return "The first steps are always the hardest.";
  return "Every journey begins with a single waddle.";
};

// Achievement badges based on performance
const getAchievements = (distance: number, score: number, maxCombo: number) => {
  const achievements: string[] = [];
  
  if (distance >= 10000) achievements.push("🏔️ Mountain Seeker");
  if (distance >= 5000) achievements.push("❄️ Ice Walker");
  if (score >= 100) achievements.push("🐟 Fish Collector");
  if (maxCombo >= 10) achievements.push("⚡ Combo Master");
  if (maxCombo >= 5) achievements.push("✨ Quick Fins");
  
  return achievements.slice(0, 3); // Max 3 achievements shown
};

export const GameOver = () => {
  const { score, distance, highScore, maxCombo, thoughtsShown, resetGame, goToTitle } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);
  const hasSaved = useRef(false);
  
  useEffect(() => {
    if (!hasSaved.current) {
      hasSaved.current = true;
      const leaderboard = saveToLeaderboard({ distance, score, maxCombo });
      // Check if this is a new #1
      if (leaderboard.length > 0 && leaderboard[0].distance === distance) {
        setIsNewRecord(true);
      }
    }
  }, [distance, score, maxCombo]);
  
  const journeyMessage = getJourneyMessage(distance);
  const achievements = getAchievements(distance, score, maxCombo);
  
  const handleShare = () => {
    shareResult(distance, score);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 flex items-center justify-center z-20"
    >
      {/* Overlay with vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-background/60 via-background/80 to-background/95" />
      
      {/* Content */}
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 text-center glass-panel rounded-2xl p-6 md:p-10 mx-4 max-w-lg w-full"
      >
        {/* Title - Emotional instead of "Game Over" */}
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="melancholic-text text-3xl md:text-5xl title-gradient mb-2"
        >
          The journey continues...
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground/70 text-sm mb-6 italic"
        >
          {journeyMessage}
        </motion.p>
        
        {/* New Record Badge */}
        {isNewRecord && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="inline-block bg-gradient-to-r from-fish/20 to-accent/20 border border-fish/40 rounded-full px-4 py-1 mb-4"
          >
            <span className="text-fish text-sm font-display">✨ New Personal Record! ✨</span>
          </motion.div>
        )}
        
        {/* Poetic Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3 mb-6"
        >
          <div className="bg-secondary/20 rounded-xl p-4">
            <p className="text-accent/50 text-xs uppercase tracking-widest mb-1">
              You traveled
            </p>
            <p className="font-display text-4xl text-foreground">
              {Math.floor(distance)}m
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              into the unknown
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/20 rounded-xl p-3">
              <p className="text-accent/50 text-xs uppercase tracking-widest mb-1">
                Memories collected
              </p>
              <p className="font-display text-2xl text-fish">
                🐟 {Math.floor(score)}
              </p>
            </div>
            
            <div className="bg-secondary/20 rounded-xl p-3">
              <p className="text-accent/50 text-xs uppercase tracking-widest mb-1">
                Questions asked
              </p>
              <p className="font-display text-2xl text-foreground">
                💭 {thoughtsShown}
              </p>
            </div>
          </div>
          
          {/* Best Combo */}
          {maxCombo > 1 && (
            <div className="bg-accent/10 rounded-xl p-3">
              <p className="text-accent/50 text-xs uppercase tracking-widest mb-1">
                Best momentum
              </p>
              <p className="font-display text-xl text-accent">x{maxCombo} combo</p>
            </div>
          )}
        </motion.div>
        
        {/* Achievements */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {achievements.map((achievement, i) => (
              <span key={i} className="text-xs bg-secondary/30 rounded-full px-3 py-1 text-muted-foreground">
                {achievement}
              </span>
            ))}
          </motion.div>
        )}
        
        {/* High score reference */}
        {highScore > 0 && distance < highScore && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-muted-foreground/50 text-xs mb-6"
          >
            Your longest journey: {Math.floor(highScore)}m
          </motion.p>
        )}
        
        {/* Motivational footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-muted-foreground/60 text-xs italic mb-6"
        >
          "Every journey teaches us something. Try again?"
        </motion.p>
        
        {/* Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={resetGame}
            className="w-full py-6 text-lg font-display tracking-widest
                     bg-gradient-to-r from-primary/80 to-accent/60 
                     hover:from-primary hover:to-accent
                     transition-all duration-300 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Continue the Journey
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 py-4 text-muted-foreground hover:text-foreground
                       transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              onClick={goToTitle}
              variant="ghost"
              className="flex-1 py-4 text-muted-foreground hover:text-foreground
                       transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Title
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
