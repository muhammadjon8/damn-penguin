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
import { 
  ThoughtBubble3D, 
  ColonySilhouette, 
  ShootingStar, 
  DistantPenguin,
  useNarrativeSystem 
} from './NarrativeSystem';
import { LandmarkSystem, Footprints, GodRays } from './LandmarkSystem';
import { SpecialFishSpawner } from './SpecialFish';
import { useGameStore } from '@/store/gameStore';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Component to handle game updates
const GameUpdater = () => {
  const { 
    gameState, 
    incrementDistance, 
    updateEnvironment, 
    updateAbilities,
    updateSlowMotion,
    checkMilestone,
    increaseSpeed,
    distance,
    isSlowMotion,
  } = useGameStore();
  
  const lastSpeedIncreaseRef = useRef(0);
  
  // Trigger narrative system
  useNarrativeSystem();
  
  useFrame((_, delta) => {
    if (gameState === 'playing') {
      // Apply slow motion effect
      const effectiveDelta = isSlowMotion ? delta * 0.3 : delta;
      
      incrementDistance(effectiveDelta * 60);
      updateEnvironment(effectiveDelta);
      updateAbilities(effectiveDelta);
      updateSlowMotion(delta); // Use real delta for timer
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
  const { currentLane, weather, isBellySliding, isSlowMotion } = useGameStore();
  const shakeRef = useRef(0);
  const fovRef = useRef(60);

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
    
    // Pull camera back and zoom during special moments
    let targetZ = 8;
    let targetFov = 60;
    
    if (isBellySliding) {
      targetZ = 9;
      targetFov = 65; // Wider FOV for speed effect
    }
    
    if (isSlowMotion) {
      targetZ = 6; // Pull in closer
      targetFov = 50; // Narrower for dramatic effect
    }
    
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    fovRef.current = THREE.MathUtils.lerp(fovRef.current, targetFov, 0.05);
    (camera as THREE.PerspectiveCamera).fov = fovRef.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    
    camera.lookAt(0, 1, -10);
  });

  return null;
};

// Slow motion visual overlay effect
const SlowMotionEffect = () => {
  const { isSlowMotion } = useGameStore();
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const targetOpacity = isSlowMotion ? 0.15 : 0;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, 5]}>
      <planeGeometry args={[30, 20]} />
      <meshBasicMaterial color="#ffd700" transparent opacity={0} />
    </mesh>
  );
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
        <GodRays />
        
        {/* Easter eggs */}
        <ShootingStar />
        <DistantPenguin />
        
        {gameState === 'playing' && (
          <>
            <Penguin />
            <ThoughtBubble3D />
            <Obstacles />
            <Fish />
            <SpecialFishSpawner />
            <LandmarkSystem />
            <Footprints />
            <ColonySilhouette />
            <SlowMotionEffect />
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
