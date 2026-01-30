import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { MEMORY_FRAGMENTS } from './NarrativeSystem';

const LANE_WIDTH = 2;
const SPAWN_INTERVAL = 0.8;
const RARE_FISH_CHANCE = 0.03; // 3% chance for rare glowing fish

interface SpecialFishData {
  position: THREE.Vector3;
  collected: boolean;
  bobOffset: number;
  memoryIndex: number;
}

// Rare glowing fish component
const RareGlowingFish = ({ 
  position, 
  collected, 
  bobOffset,
  onCollect 
}: { 
  position: THREE.Vector3; 
  collected: boolean; 
  bobOffset: number;
  onCollect: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const { currentLane, isJumping, isBellySliding, gameState } = useGameStore();
  const collectedRef = useRef(collected);
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }, delta) => {
    if (!groupRef.current || collectedRef.current || gameState !== 'playing') return;
    
    // Ethereal floating animation
    const time = clock.elapsedTime + bobOffset;
    groupRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.15;
    groupRef.current.rotation.y = Math.sin(time * 1.5) * 0.3;
    groupRef.current.rotation.z = Math.sin(time * 2.5) * 0.1;
    
    // Pulsing glow
    if (glowRef.current) {
      glowRef.current.intensity = 1 + Math.sin(time * 3) * 0.5;
    }
    
    // Particle orbit
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 2;
    }
    
    // Collision detection
    const playerLane = currentLane * LANE_WIDTH;
    const fishX = position.x;
    const fishZ = position.z;
    
    const horizontalDist = Math.abs(playerLane - fishX);
    const verticalDist = Math.abs(fishZ);
    
    const playerY = isJumping ? 0.75 : (isBellySliding ? 0.15 : 0);
    const fishY = groupRef.current.position.y;
    const heightDist = Math.abs(playerY - fishY);
    
    if (horizontalDist < 1.2 && verticalDist < 1.5 && heightDist < 1) {
      collectedRef.current = true;
      onCollect();
    }
  });
  
  if (collected) return null;
  
  // Orbiting particles
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(20 * 3);
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 0.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);
  
  return (
    <group ref={groupRef} position={[position.x, 0.5, position.z]}>
      {/* Central glow */}
      <pointLight ref={glowRef} color="#ffd700" intensity={1.5} distance={4} />
      
      {/* Orbiting particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={20}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#ffd700" size={0.05} transparent opacity={0.8} />
      </points>
      
      {/* Fish body with glow effect */}
      <mesh>
        <capsuleGeometry args={[0.15, 0.25, 8, 16]} />
        <meshStandardMaterial 
          color="#ffd700" 
          emissive="#ffa500" 
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      
      {/* Tail */}
      <mesh position={[0, 0, 0.25]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.12, 0.15, 4]} />
        <meshStandardMaterial 
          color="#ffd700" 
          emissive="#ffa500" 
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>
      
      {/* Fins */}
      <mesh position={[0.1, 0.08, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.05, 0.1, 3]} />
        <meshStandardMaterial 
          color="#ffd700" 
          emissive="#ffa500" 
          emissiveIntensity={0.5}
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Outer glow sphere */}
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

export const SpecialFishSpawner = () => {
  const { speed, gameState, addScore, addCombo, triggerMemory, triggerSlowMotion } = useGameStore();
  const [rareFish, setRareFish] = useState<SpecialFishData[]>([]);
  const spawnTimer = useRef(0);
  const usedMemories = useRef<Set<number>>(new Set());
  
  useFrame((_, delta) => {
    if (gameState !== 'playing') {
      setRareFish([]);
      spawnTimer.current = 0;
      usedMemories.current.clear();
      return;
    }
    
    // Move existing fish
    setRareFish(prev => prev.map(fish => ({
      ...fish,
      position: new THREE.Vector3(
        fish.position.x,
        fish.position.y,
        fish.position.z + speed * delta * 60
      ),
    })).filter(fish => !fish.collected && fish.position.z < 10));
    
    // Spawn new rare fish
    spawnTimer.current += delta;
    if (spawnTimer.current >= SPAWN_INTERVAL * 3) { // Less frequent than regular fish
      spawnTimer.current = 0;
      
      if (Math.random() < RARE_FISH_CHANCE) {
        const lane = (Math.floor(Math.random() * 3) - 1) * LANE_WIDTH;
        
        // Get unused memory
        let memoryIndex = Math.floor(Math.random() * MEMORY_FRAGMENTS.length);
        if (usedMemories.current.size < MEMORY_FRAGMENTS.length) {
          while (usedMemories.current.has(memoryIndex)) {
            memoryIndex = Math.floor(Math.random() * MEMORY_FRAGMENTS.length);
          }
        }
        
        setRareFish(prev => [...prev, {
          position: new THREE.Vector3(lane, 0.5, -50),
          collected: false,
          bobOffset: Math.random() * Math.PI * 2,
          memoryIndex,
        }]);
      }
    }
  });
  
  const handleCollect = (index: number) => {
    const fish = rareFish[index];
    if (!fish) return;
    
    // Mark memory as used
    usedMemories.current.add(fish.memoryIndex);
    
    // Trigger special effects
    addScore(50); // Bonus points
    addCombo();
    triggerSlowMotion();
    triggerMemory(MEMORY_FRAGMENTS[fish.memoryIndex]);
    
    setRareFish(prev => prev.map((f, i) => 
      i === index ? { ...f, collected: true } : f
    ));
  };
  
  return (
    <group>
      {rareFish.map((fish, index) => (
        <RareGlowingFish
          key={`rare-${index}-${fish.position.z}`}
          position={fish.position}
          collected={fish.collected}
          bobOffset={fish.bobOffset}
          onCollect={() => handleCollect(index)}
        />
      ))}
    </group>
  );
};
