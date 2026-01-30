import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { playCollectSound } from './AudioSystem';

const LANE_WIDTH = 2;
const SPAWN_DISTANCE = -60;
const DESPAWN_DISTANCE = 10;

interface FishItem {
  id: number;
  lane: -1 | 0 | 1;
  position: number;
  collected: boolean;
  height: number;
}

// Realistic silver fish (herring-like)
const RealisticFish = ({ position, collected }: { 
  position: [number, number, number]; 
  collected: boolean;
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);
  const tailWiggle = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Rotate and bob
    meshRef.current.rotation.y += delta * 1.5;
    meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.004) * 0.08;
    
    // Tail wiggle tracking
    tailWiggle.current = Math.sin(Date.now() * 0.015) * 0.3;
    
    // Collection animation
    if (collected) {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 0, 0.25);
    }
    meshRef.current.scale.setScalar(scaleRef.current);
  });

  if (collected && scaleRef.current < 0.05) return null;

  return (
    <group ref={meshRef} position={position}>
      {/* Main body - elongated fish shape */}
      <mesh>
        <capsuleGeometry args={[0.08, 0.18, 8, 12]} />
        <meshStandardMaterial 
          color="#a0b0c0" 
          roughness={0.3} 
          metalness={0.4}
        />
      </mesh>
      
      {/* Silver belly */}
      <mesh position={[0, -0.02, 0.04]}>
        <capsuleGeometry args={[0.05, 0.14, 6, 10]} />
        <meshStandardMaterial 
          color="#d0dce8" 
          roughness={0.25} 
          metalness={0.5}
        />
      </mesh>
      
      {/* Back (darker) */}
      <mesh position={[0, 0.03, -0.02]}>
        <capsuleGeometry args={[0.04, 0.12, 6, 8]} />
        <meshStandardMaterial 
          color="#607080" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      {/* Tail fin */}
      <group position={[0, 0, 0.16]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <coneGeometry args={[0.06, 0.1, 4]} />
          <meshStandardMaterial color="#8090a0" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
      
      {/* Dorsal fin */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.02, 0.05, 3]} />
        <meshStandardMaterial color="#708090" roughness={0.4} />
      </mesh>
      
      {/* Eye */}
      <mesh position={[0.05, 0.02, -0.08]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
      
      {/* Subtle glow for visibility */}
      <pointLight color="#90b0d0" intensity={0.3} distance={1.5} />
    </group>
  );
};

export const Fish = () => {
  const [fishItems, setFishItems] = useState<FishItem[]>([]);
  const fishIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const pendingActionsRef = useRef<(() => void)[]>([]);
  
  const { speed, gameState, currentLane, addScore, addCombo, updateComboTimer, isJumping } = useGameStore();

  const spawnFish = useCallback(() => {
    const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
    
    // Pattern spawning
    const spawnPattern = Math.random() > 0.75;
    
    if (spawnPattern) {
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const newFish: FishItem[] = [];
      for (let i = 0; i < 3; i++) {
        newFish.push({
          id: fishIdRef.current++,
          lane,
          position: SPAWN_DISTANCE - i * 2.5,
          collected: false,
          height: 0.45,
        });
      }
      setFishItems(prev => [...prev, ...newFish]);
    } else {
      const elevated = Math.random() > 0.85;
      const newFish: FishItem = {
        id: fishIdRef.current++,
        lane: lanes[Math.floor(Math.random() * lanes.length)],
        position: SPAWN_DISTANCE,
        collected: false,
        height: elevated ? 1.1 : 0.45,
      };
      setFishItems(prev => [...prev, newFish]);
    }
  }, []);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    while (pendingActionsRef.current.length > 0) {
      const action = pendingActionsRef.current.shift();
      action?.();
    }

    updateComboTimer(delta);

    lastSpawnRef.current += delta * speed * 60;
    if (lastSpawnRef.current > 12) {
      spawnFish();
      lastSpawnRef.current = 0;
    }

    setFishItems(prev => {
      return prev
        .map(fish => {
          const newPos = fish.position + speed * delta * 60;
          
          // Check collection with tighter bounds
          if (!fish.collected && 
              newPos > -0.4 && newPos < 0.8 && 
              fish.lane === currentLane) {
            // For elevated fish, need to be jumping
            if (fish.height > 0.9 && !isJumping) {
              return { ...fish, position: newPos };
            }
            
            pendingActionsRef.current.push(() => {
              addScore(10);
              addCombo();
              playCollectSound();
            });
            return { ...fish, position: newPos, collected: true };
          }
          
          return { ...fish, position: newPos };
        })
        .filter(fish => fish.position < DESPAWN_DISTANCE);
    });
  });

  useEffect(() => {
    if (gameState === 'playing') {
      setFishItems([]);
      lastSpawnRef.current = 0;
      pendingActionsRef.current = [];
    }
  }, [gameState]);

  return (
    <group>
      {fishItems.map(fish => {
        const x = fish.lane * LANE_WIDTH;
        const z = fish.position;
        const pos: [number, number, number] = [x, fish.height, z];
        
        return (
          <RealisticFish 
            key={fish.id} 
            position={pos} 
            collected={fish.collected}
          />
        );
      })}
    </group>
  );
};
