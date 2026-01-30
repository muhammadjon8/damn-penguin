import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_WIDTH = 2;
const SPAWN_DISTANCE = -60;
const DESPAWN_DISTANCE = 10;

interface FishItem {
  id: number;
  lane: -1 | 0 | 1;
  position: number;
  collected: boolean;
}

// Single fish collectible
const FishMesh = ({ position, collected }: { position: [number, number, number]; collected: boolean }) => {
  const meshRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Rotate and bob
    meshRef.current.rotation.y += delta * 2;
    meshRef.current.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.1;
    
    // Collection animation
    if (collected) {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 0, 0.2);
    }
    meshRef.current.scale.setScalar(scaleRef.current);
  });

  if (collected && scaleRef.current < 0.05) return null;

  return (
    <group ref={meshRef} position={position}>
      {/* Fish body */}
      <mesh>
        <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
        <meshStandardMaterial color="#ff8c42" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0, 0.2]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.1, 0.15, 4]} />
        <meshStandardMaterial color="#ff7b2e" roughness={0.4} />
      </mesh>
      {/* Eye */}
      <mesh position={[0.08, 0.05, -0.08]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Glow effect */}
      <pointLight color="#ff9500" intensity={0.3} distance={2} />
    </group>
  );
};

export const Fish = () => {
  const [fishItems, setFishItems] = useState<FishItem[]>([]);
  const fishIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const { speed, gameState, currentLane, addScore } = useGameStore();

  const spawnFish = useCallback(() => {
    const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
    
    const newFish: FishItem = {
      id: fishIdRef.current++,
      lane: lanes[Math.floor(Math.random() * lanes.length)],
      position: SPAWN_DISTANCE,
      collected: false,
    };
    
    setFishItems(prev => [...prev, newFish]);
  }, []);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    // Spawn fish
    lastSpawnRef.current += delta * speed * 60;
    if (lastSpawnRef.current > 8) {
      spawnFish();
      lastSpawnRef.current = 0;
    }

    // Update fish positions and check collection
    setFishItems(prev => {
      return prev
        .map(fish => {
          const newPos = fish.position + speed * delta * 60;
          
          // Check collection
          if (!fish.collected && 
              newPos > -0.5 && newPos < 1 && 
              fish.lane === currentLane) {
            addScore(10);
            return { ...fish, position: newPos, collected: true };
          }
          
          return { ...fish, position: newPos };
        })
        .filter(fish => fish.position < DESPAWN_DISTANCE);
    });
  });

  // Reset fish when game restarts
  useEffect(() => {
    if (gameState === 'playing') {
      setFishItems([]);
      lastSpawnRef.current = 0;
    }
  }, [gameState]);

  return (
    <group>
      {fishItems.map(fish => {
        const x = fish.lane * LANE_WIDTH;
        const z = fish.position;
        const pos: [number, number, number] = [x, 0, z];
        
        return <FishMesh key={fish.id} position={pos} collected={fish.collected} />;
      })}
    </group>
  );
};
