// Session management for player tracking
import { supabase } from '@/integrations/supabase/client';
import { trackReferral } from './analytics';

const SESSION_KEY = 'penguin_session_id';

// Generate unique session ID
const generateSessionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get or create session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

// Check for referral in URL
export const checkReferral = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    trackReferral(ref);
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
  }
  return ref;
};

// Initialize or update session in database
export const initSession = async (): Promise<void> => {
  const sessionId = getSessionId();
  const referrer = checkReferral();
  
  try {
    // Check if session exists
    const { data: existing } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (!existing) {
      // Create new session
      await supabase.from('game_sessions').insert({
        session_id: sessionId,
        play_count: 0,
        total_distance: 0,
        best_distance: 0,
        best_fish: 0,
        best_biome: 'ice_plains',
        referrer_session_id: referrer,
      });
    }
    
    // Update referrer's challenge attempts
    if (referrer) {
      const { data: referrerSession } = await supabase
        .from('game_sessions')
        .select('challenge_attempts')
        .eq('session_id', referrer)
        .maybeSingle();
      
      if (referrerSession) {
        await supabase
          .from('game_sessions')
          .update({ challenge_attempts: referrerSession.challenge_attempts + 1 })
          .eq('session_id', referrer);
      }
    }
  } catch (error) {
    console.error('Failed to initialize session:', error);
  }
};

// Update session after game
export const updateSession = async (params: {
  distance: number;
  fish: number;
  biome: string;
}): Promise<void> => {
  const sessionId = getSessionId();
  
  try {
    const { data: existing } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from('game_sessions')
        .update({
          play_count: existing.play_count + 1,
          total_distance: existing.total_distance + Math.floor(params.distance),
          best_distance: Math.max(existing.best_distance, Math.floor(params.distance)),
          best_fish: Math.max(existing.best_fish, params.fish),
          best_biome: getBetterBiome(existing.best_biome, params.biome),
          last_played: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    }
  } catch (error) {
    console.error('Failed to update session:', error);
  }
};

// Get session stats
export const getSessionStats = async () => {
  const sessionId = getSessionId();
  
  try {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    return data;
  } catch (error) {
    console.error('Failed to get session stats:', error);
    return null;
  }
};

// Helper to determine better biome
const getBetterBiome = (current: string, newBiome: string): string => {
  const order = ['ice_plains', 'ocean', 'cliffs', 'mountain', 'peaks'];
  const currentIndex = order.indexOf(current);
  const newIndex = order.indexOf(newBiome);
  return newIndex > currentIndex ? newBiome : current;
};
