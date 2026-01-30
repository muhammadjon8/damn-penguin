import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Fish, Mountain } from 'lucide-react';
import { getSessionStats } from '@/lib/session';
import { loadStats, loadAchievements, Achievement } from '@/lib/achievements';

const BIOME_NAMES: Record<string, string> = {
  ice_plains: 'Ice Plains',
  ocean: 'Ocean',
  cliffs: 'Cliffs',
  mountain: 'Mountains',
  peaks: 'Peaks',
};

interface SessionData {
  play_count: number;
  total_distance: number;
  best_distance: number;
  best_biome: string;
  challenge_attempts: number;
  last_played: string;
}

export const PlayerStats = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      const session = await getSessionStats();
      const achievementsList = loadAchievements();
      
      setSessionData(session as SessionData | null);
      setAchievements(achievementsList.filter(a => a.unlocked));
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  const localStats = loadStats();
  
  // Use local stats as fallback if no session data
  const stats = sessionData || {
    play_count: localStats.totalGames,
    total_distance: localStats.totalDistance,
    best_distance: localStats.bestDistance,
    best_biome: 'ice_plains',
    challenge_attempts: 0,
    last_played: null,
  };
  
  if (loading || stats.play_count === 0) return null;
  
  // Calculate days since last played
  const lastPlayedDays = stats.last_played 
    ? Math.floor((Date.now() - new Date(stats.last_played).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10"
    >
      <div className="glass-panel rounded-xl p-3 text-center max-w-xs">
        {/* Welcome back message */}
        <p className="text-xs text-muted-foreground mb-2">
          Welcome back, Penguin Traveler!
        </p>
        
        {/* Quick stats */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-fish" />
            <span className="text-foreground/80">
              {Math.floor(stats.total_distance).toLocaleString()}m total
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Mountain className="w-3 h-3 text-accent" />
            <span className="text-foreground/80">
              Best: {Math.floor(stats.best_distance).toLocaleString()}m
            </span>
          </div>
        </div>
        
        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="flex justify-center gap-1 mt-2">
            {achievements.slice(0, 5).map((achievement) => (
              <span 
                key={achievement.id} 
                className="text-sm"
                title={achievement.name}
              >
                {achievement.icon}
              </span>
            ))}
            {achievements.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{achievements.length - 5}
              </span>
            )}
          </div>
        )}
        
        {/* Challenge attempts */}
        {stats.challenge_attempts > 0 && (
          <p className="text-xs text-fish/70 mt-1">
            ✨ {stats.challenge_attempts} penguin{stats.challenge_attempts !== 1 ? 's' : ''} tried your challenge!
          </p>
        )}
      </div>
    </motion.div>
  );
};
