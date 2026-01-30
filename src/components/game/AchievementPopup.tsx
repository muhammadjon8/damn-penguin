import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/achievements';

interface AchievementPopupProps {
  achievement: Achievement | null;
  onComplete: () => void;
}

export const AchievementPopup = ({ achievement, onComplete }: AchievementPopupProps) => {
  if (!achievement) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2500);
        }}
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60]"
      >
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4 border-2 border-fish/50 shadow-lg shadow-fish/20">
          <div className="w-12 h-12 rounded-full bg-fish/20 flex items-center justify-center text-2xl">
            {achievement.icon}
          </div>
          <div>
            <p className="text-xs text-fish uppercase tracking-wider font-medium">
              Achievement Unlocked!
            </p>
            <p className="font-display text-lg text-foreground">
              {achievement.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {achievement.description}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
