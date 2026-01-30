import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Penguin } from './Penguin';
import { Environment } from './Environment';
import { Obstacles } from './Obstacles';
import { Fish } from './Fish';
import { useGameStore } from '@/store/gameStore';
import { useEffect } from 'react';
import * as THREE from 'three';

// Component to handle distance increment
const DistanceTracker = () => {
  const { gameState, incrementDistance } = useGameStore();
  
  useFrame((_, delta) => {
    if (gameState === 'playing') {
      incrementDistance(delta * 60);
    }
  });
  
  return null;
};

// Camera that follows penguin
const GameCamera = () => {
  const { camera } = useThree();
  const { currentLane } = useGameStore();

  useEffect(() => {
    camera.position.set(0, 4, 8);
    (camera as THREE.PerspectiveCamera).fov = 60;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    const targetX = currentLane * 0.3;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
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
        {/* Sky background */}
        <color attach="background" args={['#1e3a5f']} />
        
        <GameCamera />
        <Environment />
        
        {gameState === 'playing' && (
          <>
            <Penguin />
            <Obstacles />
            <Fish />
            <DistanceTracker />
          </>
        )}
        
        {gameState === 'title' && (
          <Penguin />
        )}
      </Canvas>
    </div>
  );
};
