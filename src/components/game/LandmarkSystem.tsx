import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

// Simplified landmark types
type LandmarkType = 'shipwreck' | 'ice_cave' | 'ruins';

interface Landmark {
  type: LandmarkType;
  position: THREE.Vector3;
  rotation: number;
  scale: number;
}

// Frozen Shipwreck - simplified
const FrozenShipwreck = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => (
  <group position={position} rotation={[0, rotation, 0.1]} scale={scale}>
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[2, 1.5, 6]} />
      <meshStandardMaterial color="#4a3728" roughness={0.9} transparent opacity={opacity} />
    </mesh>
    <mesh position={[0, 3, 0]}>
      <cylinderGeometry args={[0.1, 0.15, 4, 6]} />
      <meshStandardMaterial color="#3a2a1a" roughness={0.9} transparent opacity={opacity} />
    </mesh>
  </group>
);

// Ice Cave - simplified
const IceCave = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => (
  <group position={position} rotation={[0, rotation, 0]} scale={scale}>
    <mesh position={[0, 1.5, 0]}>
      <coneGeometry args={[3, 4, 4]} />
      <meshStandardMaterial color="#5a8fb8" roughness={0.4} transparent opacity={opacity} />
    </mesh>
    <mesh position={[0, 0.8, 1.5]} rotation={[-0.3, 0, 0]}>
      <circleGeometry args={[1, 12]} />
      <meshBasicMaterial color="#0a1520" transparent opacity={opacity} />
    </mesh>
  </group>
);

// Ancient Ruins - simplified
const AncientRuins = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => (
  <group position={position} rotation={[0, rotation, 0]} scale={scale}>
    <mesh position={[-1.5, 1, 0]}>
      <cylinderGeometry args={[0.3, 0.35, 2, 6]} />
      <meshStandardMaterial color="#8a9eb0" roughness={0.9} transparent opacity={opacity} />
    </mesh>
    <mesh position={[1.5, 0.8, 0]}>
      <cylinderGeometry args={[0.3, 0.35, 1.6, 6]} />
      <meshStandardMaterial color="#8a9eb0" roughness={0.9} transparent opacity={opacity} />
    </mesh>
    <mesh position={[0, 0.1, 0]}>
      <boxGeometry args={[5, 0.3, 5]} />
      <meshStandardMaterial color="#6a7a8a" roughness={0.95} transparent opacity={opacity} />
    </mesh>
  </group>
);

// Main Landmark System - optimized with refs instead of state
export const LandmarkSystem = () => {
  const { distance, speed, gameState } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const landmarksRef = useRef<Landmark[]>([]);
  const lastSpawnDistance = useRef(0);
  const updateCounter = useRef(0);
  
  useFrame((_, delta) => {
    if (gameState !== 'playing' || !groupRef.current) return;
    
    // Spawn check - less frequently
    updateCounter.current++;
    if (updateCounter.current % 30 === 0) {
      const spawnInterval = 1200;
      if (distance - lastSpawnDistance.current >= spawnInterval && landmarksRef.current.length < 3) {
        lastSpawnDistance.current = distance;
        
        const types: LandmarkType[] = ['shipwreck', 'ice_cave', 'ruins'];
        const type = types[Math.floor(Math.random() * types.length)];
        const side = Math.random() > 0.5 ? 1 : -1;
        
        landmarksRef.current.push({
          type,
          position: new THREE.Vector3(side * (10 + Math.random() * 5), 0, -70),
          rotation: Math.random() * Math.PI * 2,
          scale: 0.8 + Math.random() * 0.3,
        });
      }
    }
    
    // Move landmarks
    const moveSpeed = speed * delta * 60;
    landmarksRef.current = landmarksRef.current.filter(landmark => {
      landmark.position.z += moveSpeed;
      return landmark.position.z < 30;
    });
  });
  
  // Render landmarks
  const renderLandmark = (landmark: Landmark, index: number) => {
    const opacity = Math.max(0, Math.min(1, (20 - landmark.position.z) / 70));
    const props = {
      position: landmark.position,
      rotation: landmark.rotation,
      scale: landmark.scale,
      opacity,
    };
    
    switch (landmark.type) {
      case 'shipwreck': return <FrozenShipwreck key={index} {...props} />;
      case 'ice_cave': return <IceCave key={index} {...props} />;
      case 'ruins': return <AncientRuins key={index} {...props} />;
      default: return null;
    }
  };
  
  return (
    <group ref={groupRef}>
      {landmarksRef.current.map((landmark, i) => renderLandmark(landmark, i))}
    </group>
  );
};

// Footprints - optimized with instance mesh
export const Footprints = () => {
  const { gameState, speed, currentLane, isJumping, isBellySliding, isSwimming } = useGameStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const footprintsRef = useRef<Array<{ x: number; z: number; opacity: number }>>([]);
  const lastFootprintTime = useRef(0);
  const matrixHelper = useMemo(() => new THREE.Matrix4(), []);
  const maxFootprints = 20;
  
  useFrame((_, delta) => {
    if (gameState !== 'playing' || !meshRef.current) return;
    
    lastFootprintTime.current += delta;
    
    // Add new footprint less frequently
    if (!isJumping && !isBellySliding && !isSwimming && lastFootprintTime.current >= 0.2) {
      lastFootprintTime.current = 0;
      const laneOffset = currentLane * 2;
      
      if (footprintsRef.current.length >= maxFootprints) {
        footprintsRef.current.shift();
      }
      footprintsRef.current.push({
        x: laneOffset + (Math.random() - 0.5) * 0.3,
        z: 0.5,
        opacity: 0.35,
      });
    }
    
    // Update existing footprints
    const moveSpeed = speed * delta * 60;
    footprintsRef.current = footprintsRef.current.filter(fp => {
      fp.z += moveSpeed;
      fp.opacity -= delta * 0.15;
      return fp.opacity > 0.05;
    });
    
    // Update instanced mesh
    footprintsRef.current.forEach((fp, i) => {
      matrixHelper.makeTranslation(fp.x, 0.01, fp.z);
      meshRef.current!.setMatrixAt(i, matrixHelper);
    });
    
    // Hide unused instances
    for (let i = footprintsRef.current.length; i < maxFootprints; i++) {
      matrixHelper.makeTranslation(0, -100, 0);
      meshRef.current!.setMatrixAt(i, matrixHelper);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxFootprints]}>
      <circleGeometry args={[0.08, 6]} />
      <meshBasicMaterial color="#a0b8c8" transparent opacity={0.3} />
    </instancedMesh>
  );
};

// God rays - simplified
export const GodRays = () => {
  const { timeOfDay, weather } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  
  const shouldShow = (timeOfDay === 'dawn' || timeOfDay === 'dusk') && weather !== 'blizzard';
  
  useFrame(() => {
    if (!groupRef.current) return;
    const targetOpacity = shouldShow ? 0.12 : 0;
    
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.03);
      }
    });
  });
  
  return (
    <group ref={groupRef} position={[0, 15, -40]} rotation={[0.3, 0, 0]}>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[(i - 1) * 12, 0, 0]} rotation={[0, 0, (i - 1) * 0.08]}>
          <planeGeometry args={[4, 35]} />
          <meshBasicMaterial 
            color={timeOfDay === 'dawn' ? "#ffb080" : "#ffd080"} 
            transparent 
            opacity={0} 
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// Destination counter - moved to UI, simplified
export const DestinationCounter = () => {
  const { distance, gameState } = useGameStore();
  
  if (gameState !== 'playing') return null;
  
  // Simple calculation without state
  const baseDecrease = distance * 0.25;
  const wobble = Math.sin(distance * 0.008) * 400;
  const displayedDistance = Math.max(500, Math.floor(9999 - baseDecrease + wobble));
  
  return (
    <div className="absolute top-20 right-4 z-10 pointer-events-none">
      <div className="glass-panel rounded-lg px-3 py-2 text-right">
        <p className="text-accent/50 text-xs uppercase tracking-wider">To destination</p>
        <p className="font-display text-lg text-muted-foreground">
          ~{displayedDistance}m
        </p>
      </div>
    </div>
  );
};
