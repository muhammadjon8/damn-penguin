import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';

export const TitleScreen = () => {
  const { startGame } = useGameStore();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className="text-center animate-fade-in-slow">
        {/* Title */}
        <h1 className="melancholic-text text-6xl md:text-8xl title-gradient mb-4 animate-float">
          But why....?
        </h1>
        
        {/* Subtitle */}
        <p className="text-muted-foreground text-lg md:text-xl mb-12 opacity-60 font-light tracking-wider">
          A penguin's journey to find its way home
        </p>
        
        {/* Play button */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <Button
            onClick={startGame}
            className="pointer-events-auto px-12 py-6 text-xl font-display tracking-widest 
                     bg-gradient-to-r from-primary/80 to-accent/60 
                     hover:from-primary hover:to-accent
                     border border-accent/20 glow-effect
                     transition-all duration-500 hover:scale-105"
          >
            Play
          </Button>
        </div>
        
        {/* Controls hint */}
        <div className="mt-16 text-muted-foreground/50 text-sm animate-fade-in-slow" style={{ animationDelay: '1s' }}>
          <p className="mb-2">← → or swipe to change lanes</p>
          <p>↑ to jump • ↓ to slide</p>
        </div>
      </div>
      
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
    </div>
  );
};
