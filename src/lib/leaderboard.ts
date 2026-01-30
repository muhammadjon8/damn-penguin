// Global leaderboard management
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './session';
import { trackLeaderboardSubmit } from './analytics';

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  distance: number;
  fish_collected: number;
  biome_reached: string;
  session_id: string | null;
  created_at: string;
}

// Profanity filter (basic)
const BLOCKED_WORDS = ['fuck', 'shit', 'ass', 'damn', 'bitch', 'dick', 'cock', 'pussy', 'cunt'];

export const sanitizePlayerName = (name: string): string => {
  // Remove special characters, limit length
  let sanitized = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 20);
  
  // Check for profanity
  const lower = sanitized.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return 'Penguin Traveler';
    }
  }
  
  return sanitized || 'Anonymous Penguin';
};

// Generate anonymous penguin name
export const generatePenguinName = (): string => {
  const sessionId = getSessionId();
  const hash = sessionId.slice(-4).toUpperCase();
  return `Penguin #${hash}`;
};

// Fetch top leaderboard entries
export const fetchLeaderboard = async (
  limit: number = 10,
  timeFilter: 'all' | 'week' | 'today' = 'all'
): Promise<LeaderboardEntry[]> => {
  try {
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('distance', { ascending: false })
      .limit(limit);
    
    // Apply time filter
    if (timeFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('created_at', today.toISOString());
    } else if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data as LeaderboardEntry[]) || [];
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
};

// Check if score qualifies for leaderboard (top 100)
export const checkScoreQualifies = async (distance: number): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('leaderboard')
      .select('distance')
      .order('distance', { ascending: false })
      .limit(100);
    
    if (!data || data.length < 100) return true;
    const lowestTop100 = data[data.length - 1].distance;
    return distance > lowestTop100;
  } catch {
    return true; // Allow submission on error
  }
};

// Get player's global rank
export const getPlayerRank = async (distance: number): Promise<number> => {
  try {
    const { count } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('distance', distance);
    
    return (count || 0) + 1;
  } catch {
    return 0;
  }
};

// Submit score to leaderboard
export const submitScore = async (params: {
  playerName: string;
  distance: number;
  fishCollected: number;
  biomeReached: string;
}): Promise<{ success: boolean; rank: number }> => {
  const sessionId = getSessionId();
  const sanitizedName = sanitizePlayerName(params.playerName);
  
  try {
    // Check rate limiting (localStorage based)
    const lastSubmit = localStorage.getItem('last_leaderboard_submit');
    const now = Date.now();
    if (lastSubmit && now - parseInt(lastSubmit) < 60000) {
      return { success: false, rank: 0 };
    }
    
    // Check if qualifies
    const qualifies = await checkScoreQualifies(params.distance);
    if (!qualifies) {
      return { success: false, rank: 0 };
    }
    
    // Submit
    const { error } = await supabase.from('leaderboard').insert({
      player_name: sanitizedName,
      distance: Math.floor(params.distance),
      fish_collected: params.fishCollected,
      biome_reached: params.biomeReached,
      session_id: sessionId,
    });
    
    if (error) throw error;
    
    // Update rate limit
    localStorage.setItem('last_leaderboard_submit', now.toString());
    
    // Get rank
    const rank = await getPlayerRank(params.distance);
    trackLeaderboardSubmit(rank, params.distance);
    
    return { success: true, rank };
  } catch (error) {
    console.error('Failed to submit score:', error);
    return { success: false, rank: 0 };
  }
};

// Get player's best score on leaderboard
export const getPlayerBest = async (): Promise<LeaderboardEntry | null> => {
  const sessionId = getSessionId();
  
  try {
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('session_id', sessionId)
      .order('distance', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return data as LeaderboardEntry | null;
  } catch {
    return null;
  }
};
