// Local achievement system
import { trackAchievement } from './analytics';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENTS_KEY = 'penguin_achievements';
const STATS_KEY = 'penguin_cumulative_stats';

export interface CumulativeStats {
  totalGames: number;
  totalDistance: number;
  totalFish: number;
  bestDistance: number;
  bestFish: number;
  hasShared: boolean;
}

const defaultStats: CumulativeStats = {
  totalGames: 0,
  totalDistance: 0,
  totalFish: 0,
  bestDistance: 0,
  bestFish: 0,
  hasShared: false,
};

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_journey', name: 'First Steps', description: 'Complete your first game', icon: '🐧' },
  { id: 'ocean_explorer', name: 'Ocean Explorer', description: 'Reach the ocean biome', icon: '🌊' },
  { id: 'cliff_climber', name: 'Cliff Climber', description: 'Reach the cliffs biome', icon: '🏔️' },
  { id: 'mountain_seeker', name: 'Mountain Seeker', description: 'Reach the mountain biome', icon: '⛰️' },
  { id: 'peak_master', name: 'Peak Master', description: 'Reach the treacherous peaks', icon: '🏔️' },
  { id: 'collector', name: 'Collector', description: 'Collect 100 fish total', icon: '🐟' },
  { id: 'persistent', name: 'Persistent', description: 'Play 10 games', icon: '💪' },
  { id: 'marathon', name: 'Marathon', description: 'Travel 5000m in one game', icon: '🏃' },
  { id: 'legend', name: 'Legend', description: 'Travel 10000m in one game', icon: '👑' },
  { id: 'social', name: 'Social Penguin', description: 'Share your journey', icon: '📢' },
  { id: 'combo_master', name: 'Combo Master', description: 'Reach a 10x combo', icon: '⚡' },
];

export const loadStats = (): CumulativeStats => {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
  } catch {
    return defaultStats;
  }
};

export const saveStats = (stats: CumulativeStats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const loadAchievements = (): Achievement[] => {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    const savedAchievements: Achievement[] = saved ? JSON.parse(saved) : [];
    
    // Merge with definitions to ensure all achievements exist
    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const existing = savedAchievements.find(a => a.id === def.id);
      return existing || { ...def, unlocked: false };
    });
  } catch {
    return ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, unlocked: false }));
  }
};

export const saveAchievements = (achievements: Achievement[]) => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
};

export const unlockAchievement = (id: string): Achievement | null => {
  const achievements = loadAchievements();
  const achievement = achievements.find(a => a.id === id);
  
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    saveAchievements(achievements);
    trackAchievement(id, achievement.name);
    return achievement;
  }
  
  return null;
};

export const checkAchievements = (params: {
  distance: number;
  fish: number;
  biome: string;
  maxCombo: number;
  hasShared: boolean;
}): Achievement[] => {
  const stats = loadStats();
  const newUnlocks: Achievement[] = [];
  
  // Update cumulative stats
  const updatedStats: CumulativeStats = {
    totalGames: stats.totalGames + 1,
    totalDistance: stats.totalDistance + params.distance,
    totalFish: stats.totalFish + params.fish,
    bestDistance: Math.max(stats.bestDistance, params.distance),
    bestFish: Math.max(stats.bestFish, params.fish),
    hasShared: stats.hasShared || params.hasShared,
  };
  saveStats(updatedStats);
  
  // Check each achievement condition
  const checkAndUnlock = (id: string) => {
    const result = unlockAchievement(id);
    if (result) newUnlocks.push(result);
  };
  
  // First journey
  if (updatedStats.totalGames === 1) {
    checkAndUnlock('first_journey');
  }
  
  // Biome achievements
  const biomeOrder = ['ice_plains', 'ocean', 'cliffs', 'mountain', 'peaks'];
  const biomeIndex = biomeOrder.indexOf(params.biome);
  
  if (biomeIndex >= 1) checkAndUnlock('ocean_explorer');
  if (biomeIndex >= 2) checkAndUnlock('cliff_climber');
  if (biomeIndex >= 3) checkAndUnlock('mountain_seeker');
  if (biomeIndex >= 4) checkAndUnlock('peak_master');
  
  // Collector
  if (updatedStats.totalFish >= 100) {
    checkAndUnlock('collector');
  }
  
  // Persistent
  if (updatedStats.totalGames >= 10) {
    checkAndUnlock('persistent');
  }
  
  // Marathon
  if (params.distance >= 5000) {
    checkAndUnlock('marathon');
  }
  
  // Legend
  if (params.distance >= 10000) {
    checkAndUnlock('legend');
  }
  
  // Social
  if (params.hasShared) {
    checkAndUnlock('social');
  }
  
  // Combo master
  if (params.maxCombo >= 10) {
    checkAndUnlock('combo_master');
  }
  
  return newUnlocks;
};
