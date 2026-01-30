import { useGameStore } from '@/store/gameStore';

export const GameUI = () => {
  const { score, distance } = useGameStore();

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-4 md:p-6">
      <div className="flex justify-between items-start">
        {/* Distance counter */}
        <div className="glass-panel rounded-lg px-4 py-2">
          <p className="text-accent/60 text-xs uppercase tracking-wider mb-1">Distance</p>
          <p className="font-display text-2xl md:text-3xl text-foreground">
            {Math.floor(distance)}m
          </p>
        </div>
        
        {/* Score counter */}
        <div className="glass-panel rounded-lg px-4 py-2 text-right">
          <p className="text-accent/60 text-xs uppercase tracking-wider mb-1">Score</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-fish text-lg">🐟</span>
            <p className="font-display text-2xl md:text-3xl text-foreground">
              {score}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
