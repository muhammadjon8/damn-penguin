import { useState, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, getBiomeForDistance, BiomeType } from '@/store/gameStore';

const LANE_WIDTH = 2;
const SPAWN_DISTANCE = -70;
const DESPAWN_DISTANCE = 10;

// Collision bounds for different obstacle types (width, height, depth)
const COLLISION_BOUNDS: Record<ObstacleType, { width: number; height: number; depth: number; canSlide?: boolean; canJump?: boolean }> = {
  ice: { width: 0.6, height: 0.8, depth: 0.6, canSlide: true, canJump: true },
  rock: { width: 0.7, height: 0.7, depth: 0.7, canSlide: true, canJump: true },
  crevasse: { width: 1.2, height: 0.2, depth: 1.5, canSlide: false, canJump: true },
  seal: { width: 0.9, height: 0.6, depth: 1.0, canSlide: false, canJump: true },
  fox: { width: 0.5, height: 0.5, depth: 0.6, canSlide: true, canJump: true },
  snowball: { width: 0.6, height: 0.6, depth: 0.6, canSlide: true, canJump: true },
  ice_patch: { width: 1.0, height: 0.05, depth: 1.0, canSlide: true, canJump: true },
  large_crevasse: { width: 1.4, height: 0.2, depth: 2.5, canSlide: false, canJump: true },
  water: { width: 1.5, height: 0.1, depth: 4.0, canSlide: true, canJump: true },
  ice_floe: { width: 1.8, height: 0.3, depth: 3.0, canSlide: true, canJump: true },
  falling_rock: { width: 0.5, height: 0.8, depth: 0.5, canSlide: true, canJump: true },
  wave: { width: 2.0, height: 0.5, depth: 1.0, canSlide: false, canJump: true },
};

type ObstacleType = 'ice' | 'rock' | 'crevasse' | 'seal' | 'fox' | 'snowball' | 'ice_patch' | 'large_crevasse' | 'water' | 'ice_floe' | 'falling_rock' | 'wave';

interface Obstacle {
  id: number;
  lane: -1 | 0 | 1;
  type: ObstacleType;
  position: number;
  rotation?: number;
  scale?: number;
  yOffset?: number;
}

// Penguin hitbox (reduced for fairness)
const PENGUIN_HITBOX = {
  width: 0.4, // Narrower than visual
  height: 0.9,
  depth: 0.4,
  standingY: 0.5, // Center Y when standing
  slidingY: 0.15, // Center Y when sliding
  jumpingY: 1.2, // Center Y when jumping
};

// Proper 3D AABB collision check
const checkCollision = (
  penguinLane: number,
  penguinY: number,
  obstacleX: number,
  obstacleZ: number,
  obstacleY: number,
  bounds: { width: number; height: number; depth: number }
): boolean => {
  const penguinX = penguinLane * LANE_WIDTH;
  
  // Calculate half extents
  const pHalfW = PENGUIN_HITBOX.width / 2;
  const pHalfH = PENGUIN_HITBOX.height / 2;
  const pHalfD = PENGUIN_HITBOX.depth / 2;
  
  const oHalfW = bounds.width / 2;
  const oHalfH = bounds.height / 2;
  const oHalfD = bounds.depth / 2;
  
  // Penguin position (Z is always 0 as world moves towards penguin)
  const pMinX = penguinX - pHalfW;
  const pMaxX = penguinX + pHalfW;
  const pMinY = penguinY - pHalfH;
  const pMaxY = penguinY + pHalfH;
  const pMinZ = -pHalfD;
  const pMaxZ = pHalfD;
  
  // Obstacle position
  const oMinX = obstacleX - oHalfW;
  const oMaxX = obstacleX + oHalfW;
  const oMinY = obstacleY - oHalfH;
  const oMaxY = obstacleY + oHalfH;
  const oMinZ = obstacleZ - oHalfD;
  const oMaxZ = obstacleZ + oHalfD;
  
  // AABB intersection test
  return (
    pMinX < oMaxX && pMaxX > oMinX &&
    pMinY < oMaxY && pMaxY > oMinY &&
    pMinZ < oMaxZ && pMaxZ > oMinZ
  );
};

// Ice chunk obstacle
const IceChunk = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]} rotation={[0.1, 0.3, 0.05]}>
      <boxGeometry args={[0.5, 0.6, 0.5]} />
      <meshStandardMaterial color="#a8e0f0" roughness={0.2} transparent opacity={0.85} />
    </mesh>
    <mesh position={[0.15, 0.25, 0.15]} rotation={[0.2, 0.5, 0]}>
      <boxGeometry args={[0.25, 0.35, 0.25]} />
      <meshStandardMaterial color="#c8f0ff" roughness={0.15} transparent opacity={0.8} />
    </mesh>
  </group>
);

// Rock obstacle - more realistic
const Rock = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.35, 0]}>
      <dodecahedronGeometry args={[0.4, 1]} />
      <meshStandardMaterial color="#5a6a7a" roughness={0.95} flatShading />
    </mesh>
    <mesh position={[-0.15, 0.15, 0.2]}>
      <dodecahedronGeometry args={[0.2, 1]} />
      <meshStandardMaterial color="#4a5a6a" roughness={0.95} flatShading />
    </mesh>
  </group>
);

// Crevasse
const CrevasseObstacle = ({ position, large = false }: { position: [number, number, number]; large?: boolean }) => (
  <group position={position}>
    <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.2, large ? 2.5 : 1.5]} />
      <meshStandardMaterial color="#051525" />
    </mesh>
    {/* Edge ice */}
    <mesh position={[-0.55, 0, 0]}>
      <boxGeometry args={[0.1, 0.1, large ? 2.5 : 1.5]} />
      <meshStandardMaterial color="#a8e0f0" roughness={0.3} />
    </mesh>
    <mesh position={[0.55, 0, 0]}>
      <boxGeometry args={[0.1, 0.1, large ? 2.5 : 1.5]} />
      <meshStandardMaterial color="#a8e0f0" roughness={0.3} />
    </mesh>
  </group>
);

// Seal - realistic proportions
const Seal = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial color="#4a5055" roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0.5, 0.4, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#4a5055" roughness={0.7} />
      </mesh>
      {/* Snout */}
      <mesh position={[0.68, 0.35, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#3a4045" roughness={0.6} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.6, 0.48, 0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
      <mesh position={[0.6, 0.48, -0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
    </group>
  );
};

// Arctic Fox - smaller, more agile
const ArcticFox = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = 0.05 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.08;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.15, 0.3, 8, 16]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 0.32, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.22, 0.45, 0.08]} rotation={[0.2, 0, 0.15]}>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <mesh position={[0.22, 0.45, -0.08]} rotation={[-0.2, 0, 0.15]}>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.28, 0.28, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
    </group>
  );
};

// Snowball - rolling
const Snowball = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 4;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[position[0], 0.35 * scale, position[2]]}>
      <sphereGeometry args={[0.35 * scale, 12, 12]} />
      <meshStandardMaterial color="#e0e8f0" roughness={0.9} />
    </mesh>
  );
};

// Ice patch - visual warning zone
const IcePatch = ({ position }: { position: [number, number, number] }) => (
  <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
    <circleGeometry args={[0.8, 24]} />
    <meshStandardMaterial color="#90d0f0" roughness={0.05} transparent opacity={0.6} metalness={0.4} />
  </mesh>
);

// Water patch
const WaterPatch = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.08 + Math.sin(Date.now() * 0.003) * 0.04;
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH * 0.75, 4]} />
        <meshStandardMaterial 
          color="#1a4a6a" 
          roughness={0.15} 
          transparent 
          opacity={0.85}
          emissive="#1a4a6a"
          emissiveIntensity={0.08}
        />
      </mesh>
    </group>
  );
};

// Debug collision box visualization
const DebugBox = ({ position, bounds, color = 'red' }: { 
  position: [number, number, number]; 
  bounds: { width: number; height: number; depth: number };
  color?: string;
}) => (
  <mesh position={[position[0], position[1] + bounds.height / 2, position[2]]}>
    <boxGeometry args={[bounds.width, bounds.height, bounds.depth]} />
    <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
  </mesh>
);

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
    isBellySliding,
    endGame,
    distance,
    setSlipping,
    setSwimming,
    updateBiome,
    debugCollisions,
    invincibleTimer,
    updateInvincibility,
  } = useGameStore();

  // Get biome-specific obstacle types
  const getAvailableTypes = useCallback((): ObstacleType[] => {
    const biome = getBiomeForDistance(distance);
    
    switch (biome) {
      case 'ice_plains':
        return ['ice', 'rock', 'crevasse', 'seal', 'ice_patch', 'fox', 'snowball'];
      case 'ocean':
        return ['water', 'ice', 'seal', 'wave'];
      case 'cliffs':
        return ['rock', 'crevasse', 'large_crevasse', 'falling_rock', 'ice'];
      case 'mountain':
        return ['large_crevasse', 'rock', 'ice', 'snowball', 'falling_rock'];
      case 'peaks':
        return ['large_crevasse', 'rock', 'ice', 'snowball', 'falling_rock'];
      default:
        return ['ice', 'rock', 'crevasse'];
    }
  }, [distance]);

  const getSpawnInterval = useCallback(() => {
    const biome = getBiomeForDistance(distance);
    const baseInterval = 20;
    
    // Adjust based on biome difficulty
    const biomeMultiplier: Record<BiomeType, number> = {
      ice_plains: 1.0,
      ocean: 0.9,
      cliffs: 0.8,
      mountain: 0.7,
      peaks: 0.6,
    };
    
    const minInterval = 8;
    const reduction = Math.min(distance / 3000, 0.5);
    return (baseInterval - (baseInterval - minInterval) * reduction) * biomeMultiplier[biome];
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
      scale: type === 'snowball' ? 0.8 + Math.random() * 0.5 : 1,
      yOffset: 0,
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [getAvailableTypes]);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    // Execute pending actions
    while (pendingActionsRef.current.length > 0) {
      const action = pendingActionsRef.current.shift();
      action?.();
    }

    // Update biome
    updateBiome();
    
    // Update invincibility
    updateInvincibility(delta);

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

    let inWaterThisFrame = false;

    // Calculate penguin Y based on state
    const penguinY = isJumping ? PENGUIN_HITBOX.jumpingY : 
                     (isSliding || isBellySliding) ? PENGUIN_HITBOX.slidingY : 
                     PENGUIN_HITBOX.standingY;

    setObstacles(prev => {
      const updated = prev
        .map(obs => ({
          ...obs,
          position: obs.position + speed * delta * 60,
        }))
        .filter(obs => obs.position < DESPAWN_DISTANCE);

      // Check collisions with proper 3D bounds
      for (const obs of updated) {
        const obsX = obs.lane * LANE_WIDTH;
        const obsZ = obs.position;
        const bounds = COLLISION_BOUNDS[obs.type];
        const obsY = (obs.yOffset || 0) + bounds.height / 2;
        
        // Only check if in potential collision zone
        if (obsZ < -2 || obsZ > 2) continue;
        
        const hasCollision = checkCollision(
          currentLane,
          penguinY,
          obsX,
          obsZ,
          obsY,
          bounds
        );
        
        if (!hasCollision) continue;
        
        // Handle collision based on type
        switch (obs.type) {
          case 'crevasse':
          case 'large_crevasse':
            if (!isJumping && invincibleTimer <= 0) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'ice':
          case 'rock':
          case 'falling_rock':
          case 'snowball':
            // Can jump over or slide under (if tall enough)
            if (!isJumping && !isSliding && !isBellySliding && invincibleTimer <= 0) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            // If sliding, only safe if obstacle is tall enough
            if ((isSliding || isBellySliding) && bounds.height < 0.5 && invincibleTimer <= 0) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'seal':
          case 'fox':
          case 'wave':
            if (!isJumping && invincibleTimer <= 0) {
              pendingActionsRef.current.push(() => endGame());
              return [];
            }
            break;
            
          case 'ice_patch':
            if (!isJumping && slipTimerRef.current <= 0) {
              pendingActionsRef.current.push(() => setSlipping(true));
              slipTimerRef.current = 1.2;
            }
            break;
            
          case 'water':
          case 'ice_floe':
            if (obs.position > -2.5 && obs.position < 2.5) {
              inWaterThisFrame = true;
            }
            break;
        }
      }

      return updated;
    });

    pendingActionsRef.current.push(() => setSwimming(inWaterThisFrame));
  });

  // Reset on game restart
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
        const pos: [number, number, number] = [x, obs.yOffset || 0, z];
        const bounds = COLLISION_BOUNDS[obs.type];

        return (
          <group key={obs.id}>
            {obs.type === 'ice' && <IceChunk position={pos} />}
            {obs.type === 'rock' && <Rock position={pos} />}
            {obs.type === 'falling_rock' && <Rock position={pos} />}
            {obs.type === 'crevasse' && <CrevasseObstacle position={pos} />}
            {obs.type === 'large_crevasse' && <CrevasseObstacle position={pos} large />}
            {obs.type === 'seal' && <Seal position={pos} />}
            {obs.type === 'fox' && <ArcticFox position={pos} />}
            {obs.type === 'snowball' && <Snowball position={pos} scale={obs.scale} />}
            {obs.type === 'ice_patch' && <IcePatch position={pos} />}
            {obs.type === 'water' && <WaterPatch position={pos} />}
            {obs.type === 'ice_floe' && <WaterPatch position={pos} />}
            {obs.type === 'wave' && <IceChunk position={pos} />}
            
            {/* Debug visualization */}
            {debugCollisions && (
              <DebugBox 
                position={[x, obs.yOffset || 0, z]} 
                bounds={bounds}
                color={obs.lane === currentLane ? 'red' : 'yellow'}
              />
            )}
          </group>
        );
      })}
      
      {/* Debug penguin hitbox */}
      {debugCollisions && (
        <DebugBox 
          position={[currentLane * LANE_WIDTH, isJumping ? PENGUIN_HITBOX.jumpingY : (isSliding || isBellySliding) ? PENGUIN_HITBOX.slidingY : PENGUIN_HITBOX.standingY, 0]} 
          bounds={{ width: PENGUIN_HITBOX.width, height: PENGUIN_HITBOX.height, depth: PENGUIN_HITBOX.depth }}
          color="green"
        />
      )}
    </group>
  );
};
