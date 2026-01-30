import { useState, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_WIDTH = 2;
const SPAWN_DISTANCE = -70;
const DESPAWN_DISTANCE = 10;

type ObstacleType = 'ice' | 'rock' | 'crevasse' | 'seal' | 'fox' | 'snowball' | 'ice_patch' | 'large_crevasse' | 'water';

interface Obstacle {
  id: number;
  lane: -1 | 0 | 1;
  type: ObstacleType;
  position: number;
  rotation?: number;
  scale?: number;
}

// Ice chunk obstacle
const IceChunk = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]} rotation={[0, Math.random() * Math.PI, 0]}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#a8d8ea" roughness={0.3} transparent opacity={0.9} />
    </mesh>
    <mesh position={[0.3, 0.25, 0.2]} rotation={[0.2, 0.5, 0]}>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#c5e8f0" roughness={0.3} transparent opacity={0.85} />
    </mesh>
  </group>
);

// Rock obstacle
const Rock = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.35, 0]}>
      <dodecahedronGeometry args={[0.45, 1]} />
      <meshStandardMaterial color="#5a6a7a" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[-0.2, 0.2, 0.25]}>
      <dodecahedronGeometry args={[0.25, 1]} />
      <meshStandardMaterial color="#4a5a6a" roughness={0.9} flatShading />
    </mesh>
  </group>
);

// Crevasse (must jump over)
const CrevasseObstacle = ({ position, large = false }: { position: [number, number, number]; large?: boolean }) => (
  <mesh position={[position[0], -0.3, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[1.5, large ? 4 : 2]} />
    <meshStandardMaterial color="#0a1525" />
  </mesh>
);

// Seal obstacle - blocks lane, must avoid
const Seal = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
        <meshStandardMaterial color="#6b7280" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0.6, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#6b7280" roughness={0.8} />
      </mesh>
      {/* Nose */}
      <mesh position={[0.85, 0.45, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.75, 0.6, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.75, 0.6, -0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Flippers */}
      <mesh position={[0.2, 0.2, 0.4]} rotation={[0.5, 0, 0.3]}>
        <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
        <meshStandardMaterial color="#6b7280" roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.2, -0.4]} rotation={[-0.5, 0, 0.3]}>
        <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
        <meshStandardMaterial color="#6b7280" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Arctic Fox - quick moving obstacle
const ArcticFox = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      // Slight bounce animation
      groupRef.current.position.y = 0.1 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0.35, 0.4, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>
      {/* Snout */}
      <mesh position={[0.5, 0.35, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.3, 0.55, 0.1]} rotation={[0.3, 0, 0.2]}>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>
      <mesh position={[0.3, 0.55, -0.1]} rotation={[-0.3, 0, 0.2]}>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.35, 0.35, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.1, 0.25, 4, 8]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.45, 0.42, 0.1]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.45, 0.42, -0.1]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Nose */}
      <mesh position={[0.55, 0.35, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
};

// Rolling snowball
const Snowball = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 5;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[position[0], 0.4 * scale, position[2]]}>
      <sphereGeometry args={[0.4 * scale, 16, 16]} />
      <meshStandardMaterial color="#e8f0f8" roughness={0.95} />
    </mesh>
  );
};

// Ice patch - causes slipping
const IcePatch = ({ position }: { position: [number, number, number] }) => (
  <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
    <circleGeometry args={[1, 16]} />
    <meshStandardMaterial color="#a0d8ef" roughness={0.1} transparent opacity={0.7} metalness={0.3} />
  </mesh>
);

// Water patch - swimming section
const WaterPatch = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.1 + Math.sin(Date.now() * 0.003) * 0.05;
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH * 0.8, 6]} />
        <meshStandardMaterial 
          color="#1a5f7a" 
          roughness={0.2} 
          transparent 
          opacity={0.8}
          emissive="#1a5f7a"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Water edge highlights */}
      <mesh position={[0, 0.01, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH * 0.85, 0.3]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.01, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH * 0.85, 0.3]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

export const Obstacles = () => {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const obstacleIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const slipTimerRef = useRef(0);
  const pendingActionsRef = useRef<(() => void)[]>([]);
  
  const { 
    speed, 
    gameState, 
    currentLane, 
    isJumping, 
    isSliding, 
    endGame,
    distance,
    setSlipping,
    setSwimming,
  } = useGameStore();

  const getSpawnInterval = useCallback(() => {
    // Decrease spawn interval as distance increases (more obstacles)
    const baseInterval = 18;
    const minInterval = 8;
    const reduction = Math.min(distance / 2000, 0.6);
    return baseInterval - (baseInterval - minInterval) * reduction;
  }, [distance]);

  const getAvailableTypes = useCallback((): ObstacleType[] => {
    const baseTypes: ObstacleType[] = ['ice', 'rock', 'crevasse'];
    
    // Add more obstacle types as distance increases
    if (distance > 200) baseTypes.push('seal', 'ice_patch');
    if (distance > 500) baseTypes.push('fox', 'snowball');
    if (distance > 1000) baseTypes.push('large_crevasse');
    if (distance > 1500) baseTypes.push('water');
    
    return baseTypes;
  }, [distance]);

  const spawnObstacle = useCallback(() => {
    const types = getAvailableTypes();
    const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const newObstacle: Obstacle = {
      id: obstacleIdRef.current++,
      lane: lanes[Math.floor(Math.random() * lanes.length)],
      type,
      position: SPAWN_DISTANCE,
      rotation: Math.random() * Math.PI * 2,
      scale: type === 'snowball' ? 0.8 + Math.random() * 0.6 : 1,
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [getAvailableTypes]);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    // Execute any pending actions from last frame
    while (pendingActionsRef.current.length > 0) {
      const action = pendingActionsRef.current.shift();
      action?.();
    }

    // Handle slip timer
    if (slipTimerRef.current > 0) {
      slipTimerRef.current -= delta;
      if (slipTimerRef.current <= 0) {
        pendingActionsRef.current.push(() => setSlipping(false));
      }
    }

    // Spawn obstacles
    lastSpawnRef.current += delta * speed * 60;
    if (lastSpawnRef.current > getSpawnInterval()) {
      spawnObstacle();
      lastSpawnRef.current = 0;
    }

    // Track if we're in water
    let inWaterThisFrame = false;

    // Update obstacle positions and check collisions
    setObstacles(prev => {
      const updated = prev
        .map(obs => ({
          ...obs,
          position: obs.position + speed * delta * 60,
        }))
        .filter(obs => obs.position < DESPAWN_DISTANCE);

      // Check collisions - defer state updates
      for (const obs of updated) {
        const inCollisionZone = obs.position > -1.5 && obs.position < 1.5 && obs.lane === currentLane;
        
        if (!inCollisionZone) continue;
        
        switch (obs.type) {
          case 'crevasse':
          case 'large_crevasse':
            if (!isJumping) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'ice':
          case 'rock':
            if (!isJumping && !isSliding) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            if (obs.type === 'ice' && isSliding && !isJumping) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'seal':
          case 'fox':
            // Must jump or avoid - sliding doesn't help
            if (!isJumping) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'snowball':
            // Can jump over or slide under if small
            if (!isJumping && !(isSliding && (obs.scale || 1) > 1)) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'ice_patch':
            // Causes slipping - not game over but loss of control
            if (!isJumping && slipTimerRef.current <= 0) {
              pendingActionsRef.current.push(() => setSlipping(true));
              slipTimerRef.current = 1.5; // Slip for 1.5 seconds
            }
            break;
            
          case 'water':
            // Swimming section - change penguin state
            if (obs.position > -3 && obs.position < 3) {
              inWaterThisFrame = true;
            }
            break;
        }
      }

      return updated;
    });

    // Update swimming state after obstacles processed
    pendingActionsRef.current.push(() => setSwimming(inWaterThisFrame));
  });

  // Reset obstacles when game restarts
  useEffect(() => {
    if (gameState === 'playing') {
      setObstacles([]);
      lastSpawnRef.current = 0;
      slipTimerRef.current = 0;
      pendingActionsRef.current = [];
      setSlipping(false);
      setSwimming(false);
    }
  }, [gameState, setSlipping, setSwimming]);

  return (
    <group>
      {obstacles.map(obs => {
        const x = obs.lane * LANE_WIDTH;
        const z = obs.position;
        const pos: [number, number, number] = [x, 0, z];

        switch (obs.type) {
          case 'ice':
            return <IceChunk key={obs.id} position={pos} />;
          case 'rock':
            return <Rock key={obs.id} position={pos} />;
          case 'crevasse':
            return <CrevasseObstacle key={obs.id} position={pos} />;
          case 'large_crevasse':
            return <CrevasseObstacle key={obs.id} position={pos} large />;
          case 'seal':
            return <Seal key={obs.id} position={pos} />;
          case 'fox':
            return <ArcticFox key={obs.id} position={pos} />;
          case 'snowball':
            return <Snowball key={obs.id} position={pos} scale={obs.scale} />;
          case 'ice_patch':
            return <IcePatch key={obs.id} position={pos} />;
          case 'water':
            return <WaterPatch key={obs.id} position={pos} />;
          default:
            return null;
        }
      })}
    </group>
  );
};
