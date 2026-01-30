import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Globe, X, Clock, Calendar, Loader2 } from 'lucide-react';
import { fetchLeaderboard, getPlayerBest, LeaderboardEntry } from '@/lib/leaderboard';
import { getSessionId } from '@/lib/session';

interface GlobalLeaderboardProps {
  onClose: () => void;
}

const BIOME_ICONS: Record<string, string> = {
  ice_plains: '❄️',
  ocean: '🌊',
  cliffs: '🏔️',
  mountain: '⛰️',
  peaks: '👑',
};

export const GlobalLeaderboard = ({ onClose }: GlobalLeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all');
  const [playerBest, setPlayerBest] = useState<LeaderboardEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const sessionId = getSessionId();
  
  const loadData = useCallback(async () => {
    setLoading(true);
    const [leaderboard, best] = await Promise.all([
      fetchLeaderboard(10, timeFilter),
      getPlayerBest(),
    ]);
    setEntries(leaderboard);
    setPlayerBest(best);
    setLoading(false);
  }, [timeFilter]);
  
  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const isPlayerEntry = (entry: LeaderboardEntry) => entry.session_id === sessionId;
  
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
        className="glass-panel rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-fish" />
            Global Leaderboard
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Time filters */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={timeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('all')}
            className="flex-1"
          >
            <Trophy className="w-4 h-4 mr-1" />
            All Time
          </Button>
          <Button
            variant={timeFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('week')}
            className="flex-1"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Week
          </Button>
          <Button
            variant={timeFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('today')}
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-1" />
            Today
          </Button>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-fish mb-3" />
            <p className="text-muted-foreground text-sm">Loading global penguin journeys...</p>
            <p className="text-muted-foreground/50 text-xs mt-1 italic">
              Did you know? Emperor penguins can dive to 500m depth!
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">No journeys recorded yet!</p>
            <p className="text-muted-foreground/60 text-sm">Be the first to leave your mark.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isPlayerEntry(entry) 
                    ? 'bg-fish/20 border-2 border-fish/50' 
                    : index === 0 
                      ? 'bg-fish/10 border border-fish/30' 
                      : index === 1 
                        ? 'bg-accent/10 border border-accent/30' 
                        : index === 2 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-secondary/30'
                }`}
              >
                {/* Rank */}
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display text-lg">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-foreground truncate">
                      {entry.player_name}
                    </p>
                    {isPlayerEntry(entry) && (
                      <span className="text-xs bg-fish/30 text-fish px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{BIOME_ICONS[entry.biome_reached]} {entry.biome_reached.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>🐟 {entry.fish_collected}</span>
                  </div>
                </div>
                
                {/* Distance */}
                <div className="text-right">
                  <p className="font-display text-xl text-foreground">{entry.distance}m</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Player's best (if not in top 10) */}
        {playerBest && !entries.some(e => isPlayerEntry(e)) && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Your Best Journey</p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-fish/10 border border-fish/30">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                🐧
              </div>
              <div className="flex-1">
                <p className="font-display text-lg text-foreground">{playerBest.player_name}</p>
                <p className="text-xs text-muted-foreground">
                  {BIOME_ICONS[playerBest.biome_reached]} {playerBest.biome_reached.replace('_', ' ')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl text-foreground">{playerBest.distance}m</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
