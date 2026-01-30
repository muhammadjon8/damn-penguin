import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Settings, Volume2, Sparkles, Trophy, X, Info } from 'lucide-react';

// Settings storage
const SETTINGS_KEY = 'penguin_game_settings';
const LEADERBOARD_KEY = 'penguin_game_leaderboard';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface LeaderboardEntry {
  distance: number;
  score: number;
  maxCombo: number;
  date: string;
}

const defaultSettings: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  graphicsQuality: 'high',
};

export const loadSettings = (): GameSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: GameSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadLeaderboard = (): LeaderboardEntry[] => {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveToLeaderboard = (entry: Omit<LeaderboardEntry, 'date'>) => {
  const leaderboard = loadLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    date: new Date().toISOString(),
  };
  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.distance - a.distance);
  const top10 = leaderboard.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
  return top10;
};

// Settings Menu Component
export const SettingsMenu = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  
  const handleChange = (key: keyof GameSettings, value: number | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent" />
            Settings
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Audio Settings */}
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Volume2 className="w-4 h-4" />
              Music Volume
            </label>
            <Slider
              value={[settings.musicVolume]}
              onValueChange={([value]) => handleChange('musicVolume', value)}
              max={100}
              step={1}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground/60">{settings.musicVolume}%</span>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Volume2 className="w-4 h-4" />
              Sound Effects
            </label>
            <Slider
              value={[settings.sfxVolume]}
              onValueChange={([value]) => handleChange('sfxVolume', value)}
              max={100}
              step={1}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground/60">{settings.sfxVolume}%</span>
          </div>
          
          {/* Graphics Settings */}
          <div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Sparkles className="w-4 h-4" />
              Graphics Quality
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(quality => (
                <Button
                  key={quality}
                  variant={settings.graphicsQuality === quality ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('graphicsQuality', quality)}
                  className="flex-1 capitalize"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/50">
            Settings are saved automatically
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Leaderboard Component
export const LeaderboardMenu = ({ onClose }: { onClose: () => void }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  
  useEffect(() => {
    setEntries(loadLeaderboard());
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-fish" />
            Best Journeys
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No journeys recorded yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Play the game to set your first record!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index === 0 ? 'bg-fish/10 border border-fish/30' :
                  index === 1 ? 'bg-accent/10 border border-accent/30' :
                  index === 2 ? 'bg-primary/10 border border-primary/30' :
                  'bg-secondary/30'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display text-lg">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg text-foreground">
                    {Math.floor(entry.distance)}m
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.score} fish • x{entry.maxCombo} combo
                  </p>
                </div>
                <div className="text-xs text-muted-foreground/60">
                  {new Date(entry.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Share functionality
export const shareResult = async (distance: number, score: number) => {
  const text = `🐧 I traveled ${Math.floor(distance)}m into the unknown and collected ${score} memories in "But why...?"\n\nCan you go further? #PenguinJourney`;
  
  if (navigator.share) {
    try {
      await navigator.share({ text });
    } catch {
      // User cancelled or error
      await navigator.clipboard.writeText(text);
    }
  } else {
    await navigator.clipboard.writeText(text);
  }
};

// Credits Component
export const CreditsMenu = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Info className="w-6 h-6 text-accent" />
            About
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="space-y-4 text-center">
          <h3 className="melancholic-text text-3xl title-gradient">But why....?</h3>
          
          <p className="text-muted-foreground text-sm leading-relaxed">
            A meditative endless runner inspired by the viral penguin 
            that walked away from its colony toward the mountains.
          </p>
          
          <div className="py-4">
            <p className="text-xs text-muted-foreground/60 italic">
              "Sometimes the journey is the destination."
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground/40 space-y-1">
            <p>Built with React Three Fiber & Zustand</p>
            <p>Made with 🖤 by Lovable</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Title screen menu buttons
export const TitleMenuButtons = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  
  return (
    <>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto glass-panel rounded-full w-12 h-12"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto glass-panel rounded-full w-12 h-12"
          onClick={() => setShowLeaderboard(true)}
        >
          <Trophy className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto glass-panel rounded-full w-12 h-12"
          onClick={() => setShowCredits(true)}
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>
      
      <AnimatePresence>
        {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        {showLeaderboard && <LeaderboardMenu onClose={() => setShowLeaderboard(false)} />}
        {showCredits && <CreditsMenu onClose={() => setShowCredits(false)} />}
      </AnimatePresence>
    </>
  );
};
