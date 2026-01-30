import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Penguin } from './Penguin';
import { Environment } from './Environment';
import { Obstacles } from './Obstacles';
import { Fish } from './Fish';
import { 
  WeatherParticles, 
  DynamicLighting, 
  DynamicFog, 
  DynamicSky,
  Aurora 
} from './WeatherSystem';
import { useGameStore } from '@/store/gameStore';
import { useEffect } from 'react';
import * as THREE from 'three';

// Component to handle game updates
const GameUpdater = () => {
  const { 
    gameState, 
    incrementDistance, 
    updateEnvironment, 
    updateAbilities,
    checkMilestone,
    increaseSpeed,
    distance,
  } = useGameStore();
  
  const lastSpeedIncreaseRef = { current: 0 };
  
  useFrame((_, delta) => {
    if (gameState === 'playing') {
      incrementDistance(delta * 60);
      updateEnvironment(delta);
      updateAbilities(delta);
      checkMilestone();
      
      // Increase speed every 500m
      if (distance > lastSpeedIncreaseRef.current + 500) {
        increaseSpeed();
        lastSpeedIncreaseRef.current = distance;
      }
    }
  });
  
  return null;
};

// Camera that follows penguin with weather effects
const GameCamera = () => {
  const { camera } = useThree();
  const { currentLane, weather, isBellySliding } = useGameStore();
  const shakeRef = { current: 0 };

  useEffect(() => {
    camera.position.set(0, 4, 8);
    (camera as THREE.PerspectiveCamera).fov = 60;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    const targetX = currentLane * 0.3;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
    
    // Camera shake in blizzard
    if (weather === 'blizzard') {
      shakeRef.current += delta * 20;
      camera.position.x += Math.sin(shakeRef.current) * 0.02;
      camera.position.y = 4 + Math.cos(shakeRef.current * 1.3) * 0.01;
    } else {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4, 0.05);
    }
    
    // Pull camera back slightly during belly slide for speed effect
    const targetZ = isBellySliding ? 9 : 8;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    
    camera.lookAt(0, 1, -10);
  });

  return null;
};

export const GameScene = () => {
  const { gameState } = useGameStore();

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        {/* Dynamic sky background */}
        <DynamicSky />
        <DynamicFog />
        <DynamicLighting />
        
        <GameCamera />
        <Environment />
        <WeatherParticles />
        <Aurora />
        
        {gameState === 'playing' && (
          <>
            <Penguin />
            <Obstacles />
            <Fish />
            <GameUpdater />
          </>
        )}
        
        {gameState === 'title' && (
          <Penguin />
        )}
      </Canvas>
    </div>
  );
};
