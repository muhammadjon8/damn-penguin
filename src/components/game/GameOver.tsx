import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Home, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ShareButtons } from './ShareButtons';
import { LeaderboardSubmit } from './LeaderboardSubmit';
import { AchievementPopup } from './AchievementPopup';
import { GlobalLeaderboard } from './GlobalLeaderboard';
import { checkAchievements, Achievement } from '@/lib/achievements';
import { updateSession } from '@/lib/session';
import { hasShared, markShared } from '@/lib/sharing';
import { checkScoreQualifies } from '@/lib/leaderboard';
import { saveToLeaderboard } from './SettingsMenu';

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

const BIOME_ICONS: Record<string, string> = {
  ice_plains: '❄️',
  ocean: '🌊',
  cliffs: '🏔️',
  mountain: '⛰️',
  peaks: '👑',
};

const BIOME_NAMES: Record<string, string> = {
  ice_plains: 'Ice Plains',
  ocean: 'Ocean Crossing',
  cliffs: 'Coastal Cliffs',
  mountain: 'Mountain Ascent',
  peaks: 'Treacherous Peaks',
};

export const GameOver = () => {
  const { score, distance, highScore, maxCombo, thoughtsShown, currentBiome, resetGame, goToTitle } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [qualifiesForLeaderboard, setQualifiesForLeaderboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const hasSaved = useRef(false);
  
  useEffect(() => {
    if (!hasSaved.current) {
      hasSaved.current = true;
      
      // Save to local leaderboard
      const leaderboard = saveToLeaderboard({ distance, score, maxCombo });
      if (leaderboard.length > 0 && leaderboard[0].distance === distance) {
        setIsNewRecord(true);
      }
      
      // Check achievements
      const unlocked = checkAchievements({
        distance,
        fish: Math.floor(score),
        biome: currentBiome,
        maxCombo,
        hasShared: hasShared(),
      });
      setNewAchievements(unlocked);
      
      // Update session in database
      updateSession({
        distance,
        fish: Math.floor(score),
        biome: currentBiome,
      });
      
      // Check if qualifies for global leaderboard
      checkScoreQualifies(distance).then(setQualifiesForLeaderboard);
    }
  }, [distance, score, maxCombo, currentBiome]);
  
  const journeyMessage = getJourneyMessage(distance);
  const currentAchievement = newAchievements[currentAchievementIndex];
  
  const handleAchievementComplete = () => {
    if (currentAchievementIndex < newAchievements.length - 1) {
      setCurrentAchievementIndex(i => i + 1);
    }
  };
  
  const handleShare = () => {
    markShared();
  };

  return (
    <>
      {/* Achievement popups */}
      <AchievementPopup 
        achievement={currentAchievement || null} 
        onComplete={handleAchievementComplete} 
      />
      
      {/* Global leaderboard modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <GlobalLeaderboard onClose={() => setShowLeaderboard(false)} />
        )}
      </AnimatePresence>
      
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
          className="relative z-10 text-center glass-panel rounded-2xl p-4 md:p-6 mx-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Title */}
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="melancholic-text text-2xl md:text-4xl title-gradient mb-1"
          >
            The journey continues...
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground/70 text-xs mb-4 italic"
          >
            {journeyMessage}
          </motion.p>
          
          {/* New Record Badge */}
          {isNewRecord && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="inline-block bg-gradient-to-r from-fish/20 to-accent/20 border border-fish/40 rounded-full px-3 py-1 mb-3"
            >
              <span className="text-fish text-xs font-display">✨ New Personal Record! ✨</span>
            </motion.div>
          )}
          
          {/* Results Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-2 mb-4"
          >
            {/* Main stats */}
            <div className="bg-secondary/20 rounded-xl p-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{BIOME_ICONS[currentBiome]}</span>
                <p className="text-accent/60 text-xs uppercase tracking-wider">
                  {BIOME_NAMES[currentBiome]}
                </p>
              </div>
              <p className="font-display text-4xl text-foreground">
                {Math.floor(distance)}m
              </p>
              <p className="text-muted-foreground/60 text-xs">
                into the unknown
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/20 rounded-xl p-2">
                <p className="text-accent/50 text-[10px] uppercase tracking-wider">
                  Memories
                </p>
                <p className="font-display text-lg text-fish">
                  🐟 {Math.floor(score)}
                </p>
              </div>
              
              <div className="bg-secondary/20 rounded-xl p-2">
                <p className="text-accent/50 text-[10px] uppercase tracking-wider">
                  Thoughts
                </p>
                <p className="font-display text-lg text-foreground">
                  💭 {thoughtsShown}
                </p>
              </div>
              
              {maxCombo > 1 && (
                <div className="bg-accent/10 rounded-xl p-2">
                  <p className="text-accent/50 text-[10px] uppercase tracking-wider">
                    Best Combo
                  </p>
                  <p className="font-display text-lg text-accent">x{maxCombo}</p>
                </div>
              )}
            </div>
            
            {/* Global rank (if submitted) */}
            {submittedRank && (
              <div className="bg-fish/10 border border-fish/30 rounded-xl p-2">
                <p className="text-fish text-sm font-display">
                  🏆 You ranked #{submittedRank} globally!
                </p>
              </div>
            )}
          </motion.div>
          
          {/* Leaderboard submission */}
          {qualifiesForLeaderboard && !submittedRank && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mb-4"
            >
              <LeaderboardSubmit
                distance={distance}
                fishCollected={Math.floor(score)}
                biomeReached={currentBiome}
                onSubmitted={setSubmittedRank}
              />
            </motion.div>
          )}
          
          {/* Share buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mb-4"
          >
            <ShareButtons
              distance={distance}
              biome={currentBiome}
              fish={Math.floor(score)}
              onShare={handleShare}
            />
          </motion.div>
          
          {/* High score reference */}
          {highScore > 0 && distance < highScore && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-muted-foreground/50 text-xs mb-4"
            >
              Your longest journey: {Math.floor(highScore)}m
            </motion.p>
          )}
          
          {/* Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex flex-col gap-2"
          >
            <Button
              onClick={resetGame}
              className="w-full py-5 text-base font-display tracking-widest
                       bg-gradient-to-r from-primary/80 to-accent/60 
                       hover:from-primary hover:to-accent
                       transition-all duration-300"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Continue the Journey
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLeaderboard(true)}
                variant="outline"
                className="flex-1 py-3 text-muted-foreground hover:text-foreground"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
              <Button
                onClick={goToTitle}
                variant="ghost"
                className="flex-1 py-3 text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4 mr-2" />
                Title
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};
