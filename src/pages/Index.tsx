import { GameScene } from '@/components/game/GameScene';
import { TitleScreen } from '@/components/game/TitleScreen';
import { GameUI } from '@/components/game/GameUI';
import { GameOver } from '@/components/game/GameOver';
import { ThoughtOverlay, FlashbackVignette } from '@/components/game/NarrativeSystem';
import { DestinationCounter } from '@/components/game/LandmarkSystem';
import { AudioSystem } from '@/components/game/AudioSystem';
import { useGameStore } from '@/store/gameStore';
import { useControls } from '@/hooks/useControls';

const Index = () => {
  const { gameState, isSlowMotion } = useGameStore();
  
  // Initialize controls
  useControls();

  return (
    <div className={`relative w-full h-screen overflow-hidden winter-gradient ${isSlowMotion ? 'slow-motion-active' : ''}`}>
      {/* Audio System */}
      <AudioSystem />
      
      {/* 3D Scene */}
      <GameScene />
      
      {/* UI Overlays */}
      {gameState === 'title' && <TitleScreen />}
      {gameState === 'playing' && (
        <>
          <GameUI />
          <ThoughtOverlay />
          <FlashbackVignette />
          <DestinationCounter />
        </>
      )}
      {gameState === 'gameOver' && <GameOver />}
      
      {/* Slow motion vignette overlay */}
      {isSlowMotion && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-fish/5 to-fish/20 animate-pulse-soft" />
        </div>
      )}
    </div>
  );
};

export default Index;
