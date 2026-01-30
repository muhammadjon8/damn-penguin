import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';

export const GameOver = () => {
  const { score, distance, highScore, resetGame, goToTitle } = useGameStore();

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 text-center glass-panel rounded-2xl p-8 md:p-12 mx-4 max-w-md w-full animate-scale-in">
        {/* Title */}
        <h2 className="melancholic-text text-4xl md:text-5xl title-gradient mb-2">
          Journey's End
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          ...at least for now
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-accent/60 text-xs uppercase tracking-wider mb-1">Distance</p>
            <p className="font-display text-3xl text-foreground">{Math.floor(distance)}m</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-accent/60 text-xs uppercase tracking-wider mb-1">Fish</p>
            <p className="font-display text-3xl text-foreground">
              <span className="text-fish">🐟</span> {score}
            </p>
          </div>
        </div>
        
        {/* High score */}
        {highScore > 0 && (
          <p className="text-muted-foreground text-sm mb-6">
            Best: {highScore} fish • {Math.floor(distance)}m
          </p>
        )}
        
        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={resetGame}
            className="w-full py-6 text-lg font-display tracking-widest
                     bg-gradient-to-r from-primary/80 to-accent/60 
                     hover:from-primary hover:to-accent
                     transition-all duration-300"
          >
            Try Again
          </Button>
          <Button
            onClick={goToTitle}
            variant="ghost"
            className="w-full py-4 text-muted-foreground hover:text-foreground
                     transition-all duration-300"
          >
            Back to Title
          </Button>
        </div>
      </div>
    </div>
  );
};
