import { GameScene } from '@/components/game/GameScene';
import { TitleScreen } from '@/components/game/TitleScreen';
import { GameUI } from '@/components/game/GameUI';
import { GameOver } from '@/components/game/GameOver';
import { useGameStore } from '@/store/gameStore';
import { useControls } from '@/hooks/useControls';

const Index = () => {
  const { gameState } = useGameStore();
  
  // Initialize controls
  useControls();

  return (
    <div className="relative w-full h-screen overflow-hidden winter-gradient">
      {/* 3D Scene */}
      <GameScene />
      
      {/* UI Overlays */}
      {gameState === 'title' && <TitleScreen />}
      {gameState === 'playing' && <GameUI />}
      {gameState === 'gameOver' && <GameOver />}
    </div>
  );
};

export default Index;
