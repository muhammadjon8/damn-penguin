// Google Analytics 4 Event Tracking
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Helper to safely call gtag
const gtag = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

// Track game start
export const trackGameStart = () => {
  gtag('event', 'game_start', {
    event_category: 'gameplay',
    event_label: 'new_game',
  });
};

// Track game over
export const trackGameOver = (params: {
  distance: number;
  fishCollected: number;
  biomeReached: string;
  survivalTime: number;
  maxCombo: number;
}) => {
  gtag('event', 'game_over', {
    event_category: 'gameplay',
    distance: Math.floor(params.distance),
    fish_collected: params.fishCollected,
    biome_reached: params.biomeReached,
    survival_time: Math.floor(params.survivalTime),
    max_combo: params.maxCombo,
  });
};

// Track biome reached
export const trackBiomeReached = (biomeName: string, distance: number) => {
  gtag('event', 'biome_reached', {
    event_category: 'progression',
    biome_name: biomeName,
    distance: Math.floor(distance),
  });
};

// Track sharing
export const trackShare = (method: string) => {
  gtag('event', 'share', {
    event_category: 'social',
    method,
  });
};

// Track distance milestones
export const trackMilestone = (distance: number) => {
  gtag('event', 'milestone', {
    event_category: 'progression',
    distance: Math.floor(distance),
  });
};

// Track high score
export const trackHighScore = (newScore: number, previousBest: number) => {
  gtag('event', 'high_score', {
    event_category: 'achievement',
    new_score: Math.floor(newScore),
    previous_best: Math.floor(previousBest),
  });
};

// Track achievement unlocked
export const trackAchievement = (achievementId: string, achievementName: string) => {
  gtag('event', 'unlock_achievement', {
    event_category: 'achievement',
    achievement_id: achievementId,
    achievement_name: achievementName,
  });
};

// Track leaderboard submission
export const trackLeaderboardSubmit = (rank: number, distance: number) => {
  gtag('event', 'leaderboard_submit', {
    event_category: 'social',
    rank,
    distance: Math.floor(distance),
  });
};

// Track page view
export const trackPageView = (pageName: string) => {
  gtag('event', 'page_view', {
    page_title: pageName,
    page_location: window.location.href,
  });
};

// Track referral
export const trackReferral = (referrerSessionId: string) => {
  gtag('event', 'referral', {
    event_category: 'viral',
    referrer_session_id: referrerSessionId,
  });
};
