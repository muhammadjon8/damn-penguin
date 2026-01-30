import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

// Landmark types
type LandmarkType = 'shipwreck' | 'ice_cave' | 'ruins' | 'whale_bones' | 'totem';

interface Landmark {
  type: LandmarkType;
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  visible: boolean;
}

// Frozen Shipwreck landmark
const FrozenShipwreck = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0.1]} scale={scale}>
      {/* Hull */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 1.5, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} transparent opacity={opacity} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 4, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} transparent opacity={opacity} />
      </mesh>
      {/* Broken sail */}
      <mesh position={[0.5, 3.5, 0]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[1.5, 2]} />
        <meshStandardMaterial color="#d4c9b8" roughness={0.95} transparent opacity={opacity * 0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Ice covering */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3, 1, 7]} />
        <meshStandardMaterial color="#a8d8ea" roughness={0.3} transparent opacity={opacity * 0.6} />
      </mesh>
    </group>
  );
};

// Ice Cave landmark
const IceCave = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Cave entrance */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[3, 4, 4]} />
        <meshStandardMaterial color="#5a8fb8" roughness={0.4} transparent opacity={opacity} />
      </mesh>
      {/* Dark opening */}
      <mesh position={[0, 0.8, 1.5]} rotation={[-0.3, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#0a1520" transparent opacity={opacity} />
      </mesh>
      {/* Icicles */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 1.2]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.1, 0.8, 4]} />
          <meshStandardMaterial color="#c8e8f8" roughness={0.2} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
};

// Ancient Ruins landmark
const AncientRuins = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Broken pillars */}
      {[[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.5 + Math.random() * 1, z]}>
          <cylinderGeometry args={[0.3, 0.35, 1 + Math.random() * 2, 8]} />
          <meshStandardMaterial color="#8a9eb0" roughness={0.9} transparent opacity={opacity} />
        </mesh>
      ))}
      {/* Base platform */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[5, 0.3, 5]} />
        <meshStandardMaterial color="#6a7a8a" roughness={0.95} transparent opacity={opacity} />
      </mesh>
      {/* Mysterious symbol */}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 6]} />
        <meshBasicMaterial color="#4a6a8a" transparent opacity={opacity * 0.7} />
      </mesh>
    </group>
  );
};

// Whale Bones landmark
const WhaleBones = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Spine */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.3, 8, 8]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.9} transparent opacity={opacity} />
      </mesh>
      {/* Ribs */}
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <mesh key={i} position={[x, 1, 0]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.8, 0.08, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.9} transparent opacity={opacity} />
        </mesh>
      ))}
      {/* Skull */}
      <mesh position={[4, 0.8, 0]}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.9} transparent opacity={opacity} />
      </mesh>
    </group>
  );
};

// Ice Totem landmark
const IceTotem = ({ position, rotation, scale, opacity }: {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  opacity: number;
}) => {
  const glowRef = useRef<THREE.PointLight>(null);
  
  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.intensity = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.2;
    }
  });
  
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Stacked stones */}
      {[0, 0.6, 1.1, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.6 - i * 0.1, 0.4, 0.6 - i * 0.1]} />
          <meshStandardMaterial 
            color={i === 3 ? "#a8d8ea" : "#5a6a7a"} 
            roughness={i === 3 ? 0.2 : 0.9} 
            transparent 
            opacity={opacity}
            emissive={i === 3 ? "#4080a0" : "#000000"}
            emissiveIntensity={i === 3 ? 0.3 : 0}
          />
        </mesh>
      ))}
      {/* Mystical glow */}
      <pointLight ref={glowRef} position={[0, 2, 0]} color="#80c0e0" intensity={0.5} distance={5} />
    </group>
  );
};

// Main Landmark System
export const LandmarkSystem = () => {
  const { distance, speed, gameState } = useGameStore();
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const lastSpawnDistance = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  
  // Spawn new landmarks periodically
  useEffect(() => {
    if (gameState !== 'playing') {
      setLandmarks([]);
      lastSpawnDistance.current = 0;
      return;
    }
    
    const spawnInterval = 1000 + Math.random() * 500; // 1000-1500m apart
    
    if (distance - lastSpawnDistance.current >= spawnInterval) {
      lastSpawnDistance.current = distance;
      
      const types: LandmarkType[] = ['shipwreck', 'ice_cave', 'ruins', 'whale_bones', 'totem'];
      const type = types[Math.floor(Math.random() * types.length)];
      const side = Math.random() > 0.5 ? 1 : -1;
      
      const newLandmark: Landmark = {
        type,
        position: new THREE.Vector3(
          side * (8 + Math.random() * 5),
          0,
          -60 - Math.random() * 20
        ),
        rotation: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.4,
        visible: true,
      };
      
      setLandmarks(prev => [...prev.slice(-3), newLandmark]); // Keep max 4 landmarks
    }
  }, [distance, gameState]);
  
  // Move landmarks with the world
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;
    
    setLandmarks(prev => prev.map(landmark => ({
      ...landmark,
      position: new THREE.Vector3(
        landmark.position.x,
        landmark.position.y,
        landmark.position.z + speed * delta * 60
      ),
      visible: landmark.position.z < 20,
    })).filter(l => l.position.z < 50));
  });
  
  const renderLandmark = (landmark: Landmark, index: number) => {
    const opacity = Math.max(0, Math.min(1, (20 - landmark.position.z) / 80));
    const props = {
      position: landmark.position,
      rotation: landmark.rotation,
      scale: landmark.scale,
      opacity,
    };
    
    switch (landmark.type) {
      case 'shipwreck':
        return <FrozenShipwreck key={index} {...props} />;
      case 'ice_cave':
        return <IceCave key={index} {...props} />;
      case 'ruins':
        return <AncientRuins key={index} {...props} />;
      case 'whale_bones':
        return <WhaleBones key={index} {...props} />;
      case 'totem':
        return <IceTotem key={index} {...props} />;
      default:
        return null;
    }
  };
  
  return (
    <group ref={groupRef}>
      {landmarks.filter(l => l.visible).map((landmark, i) => renderLandmark(landmark, i))}
    </group>
  );
};

// Footprints that fade behind penguin
export const Footprints = () => {
  const { gameState, speed, currentLane, isJumping, isBellySliding, isSwimming } = useGameStore();
  const [footprints, setFootprints] = useState<Array<{ x: number; z: number; age: number; opacity: number }>>([]);
  const lastFootprintTime = useRef(0);
  const footprintInterval = 0.15; // seconds between footprints
  
  useFrame((_, delta) => {
    if (gameState !== 'playing') {
      setFootprints([]);
      return;
    }
    
    lastFootprintTime.current += delta;
    
    // Add new footprint
    if (!isJumping && !isBellySliding && !isSwimming && lastFootprintTime.current >= footprintInterval) {
      lastFootprintTime.current = 0;
      const laneOffset = currentLane * 2;
      
      setFootprints(prev => [
        ...prev.slice(-30), // Keep max 30 footprints
        { x: laneOffset + (Math.random() - 0.5) * 0.3, z: 0.5, age: 0, opacity: 0.4 }
      ]);
    }
    
    // Update existing footprints
    setFootprints(prev => prev.map(fp => ({
      ...fp,
      z: fp.z + speed * delta * 60,
      age: fp.age + delta,
      opacity: Math.max(0, 0.4 - fp.age * 0.1),
    })).filter(fp => fp.opacity > 0));
  });
  
  return (
    <group>
      {footprints.map((fp, i) => (
        <mesh key={i} position={[fp.x, 0.01, fp.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 8]} />
          <meshBasicMaterial color="#a0b8c8" transparent opacity={fp.opacity} />
        </mesh>
      ))}
    </group>
  );
};

// God rays / volumetric lighting effect
export const GodRays = () => {
  const { timeOfDay, weather } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  
  const shouldShow = (timeOfDay === 'dawn' || timeOfDay === 'dusk') && weather !== 'blizzard';
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const targetOpacity = shouldShow ? 0.15 : 0;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        const wave = Math.sin(clock.elapsedTime * 0.5 + i * 0.5) * 0.05;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity + wave, 0.02);
      }
    });
  });
  
  return (
    <group ref={groupRef} position={[0, 15, -40]} rotation={[0.3, 0, 0]}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[(i - 2) * 8, 0, 0]} rotation={[0, 0, (i - 2) * 0.1]}>
          <planeGeometry args={[3, 40]} />
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

// Fake distance counter that never reaches destination
export const DestinationCounter = () => {
  const { distance, gameState } = useGameStore();
  const [displayedDistance, setDisplayedDistance] = useState(9999);
  
  useEffect(() => {
    if (gameState !== 'playing') {
      setDisplayedDistance(9999);
      return;
    }
    
    // Slowly decrease but never reach zero, and occasionally increase again
    const baseDecrease = distance * 0.3;
    const wobble = Math.sin(distance * 0.01) * 500;
    const newDistance = Math.max(500, 9999 - baseDecrease + wobble + Math.random() * 200);
    setDisplayedDistance(Math.floor(newDistance));
  }, [distance, gameState]);
  
  if (gameState !== 'playing') return null;
  
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
