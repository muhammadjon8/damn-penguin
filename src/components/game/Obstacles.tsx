import { useState, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';

const LANE_WIDTH = 2;
const SPAWN_DISTANCE = -60;
const DESPAWN_DISTANCE = 10;

interface Obstacle {
  id: number;
  lane: -1 | 0 | 1;
  type: 'ice' | 'rock' | 'crevasse';
  position: number;
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
const Crevasse = ({ position }: { position: [number, number, number] }) => (
  <mesh position={[position[0], -0.3, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[1.5, 2]} />
    <meshStandardMaterial color="#0a1525" />
  </mesh>
);

export const Obstacles = () => {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const obstacleIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const { speed, gameState, currentLane, isJumping, isSliding, endGame } = useGameStore();

  const spawnObstacle = useCallback(() => {
    const types: ('ice' | 'rock' | 'crevasse')[] = ['ice', 'rock', 'crevasse'];
    const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
    
    const newObstacle: Obstacle = {
      id: obstacleIdRef.current++,
      lane: lanes[Math.floor(Math.random() * lanes.length)],
      type: types[Math.floor(Math.random() * types.length)],
      position: SPAWN_DISTANCE,
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, []);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    // Spawn obstacles
    lastSpawnRef.current += delta * speed * 60;
    if (lastSpawnRef.current > 15) {
      spawnObstacle();
      lastSpawnRef.current = 0;
    }

    // Update obstacle positions and check collisions
    setObstacles(prev => {
      const updated = prev
        .map(obs => ({
          ...obs,
          position: obs.position + speed * delta * 60,
        }))
        .filter(obs => obs.position < DESPAWN_DISTANCE);

      // Check collisions
      for (const obs of updated) {
        if (obs.position > -1 && obs.position < 1.5 && obs.lane === currentLane) {
          // Collision zone
          if (obs.type === 'crevasse') {
            if (!isJumping) {
              endGame();
              return [];
            }
          } else if (obs.type === 'ice' || obs.type === 'rock') {
            if (!isJumping && !isSliding) {
              endGame();
              return [];
            }
            // Sliding under ice doesn't help, jumping does
            if (obs.type === 'rock' && isSliding) {
              // Sliding works for rocks
            } else if (isSliding && !isJumping) {
              endGame();
              return [];
            }
          }
        }
      }

      return updated;
    });
  });

  // Reset obstacles when game restarts
  useEffect(() => {
    if (gameState === 'playing') {
      setObstacles([]);
      lastSpawnRef.current = 0;
    }
  }, [gameState]);

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
            return <Crevasse key={obs.id} position={pos} />;
          default:
            return null;
        }
      })}
    </group>
  );
};
