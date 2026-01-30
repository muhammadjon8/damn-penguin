import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { TitleMenuButtons } from './SettingsMenu';
import { PlayerStats } from './PlayerStats';
import { motion } from 'framer-motion';
import { initSession } from '@/lib/session';
import { trackPageView } from '@/lib/analytics';

// Inspirational quotes for loading/title
const QUOTES = [
  "The journey of a thousand miles begins with a single step.",
  "Not all those who wander are lost.",
  "The only way out is through.",
  "In the middle of difficulty lies opportunity.",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
];

export const TitleScreen = () => {
  const { startGame } = useGameStore();
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  useEffect(() => {
    // Initialize session and track page view
    initSession();
    trackPageView('title_screen');
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center"
      >
        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="melancholic-text text-6xl md:text-8xl title-gradient mb-4 animate-float"
        >
          But why....?
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-muted-foreground text-lg md:text-xl mb-12 opacity-60 font-light tracking-wider"
        >
          A penguin's journey to find its way home
        </motion.p>
        
        {/* Play button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <Button
            onClick={startGame}
            className="pointer-events-auto px-12 py-6 text-xl font-display tracking-widest 
                     bg-gradient-to-r from-primary/80 to-accent/60 
                     hover:from-primary hover:to-accent
                     border border-accent/20 glow-effect
                     transition-all duration-500 hover:scale-105"
          >
            Begin Journey
          </Button>
        </motion.div>
        
        {/* Controls hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-16 text-muted-foreground/50 text-sm"
        >
          <p className="mb-2">← → or swipe to change lanes</p>
          <p>↑ to jump • Hold ↓ to belly slide</p>
        </motion.div>
        
        {/* Inspirational quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-12 max-w-md mx-4"
        >
          <p className="text-muted-foreground/30 text-xs italic">
            "{randomQuote}"
          </p>
        </motion.div>
      </motion.div>
      
      {/* Player stats (returning players) */}
      <PlayerStats />
      
      {/* Decorative snow effect overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-winter-snow/30 rounded-full animate-snow-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
      
      {/* Menu buttons */}
      <TitleMenuButtons />
    </div>
  );
};
