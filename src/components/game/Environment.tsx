import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const GROUND_LENGTH = 100;
const LANE_WIDTH = 2;

// Snow ground
const Ground = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { speed, gameState } = useGameStore();
  const offsetRef = useRef(0);

  useFrame((_, delta) => {
    if (gameState !== 'playing' || !meshRef.current) return;
    offsetRef.current += speed * delta * 60;
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material.map) {
      material.map.offset.y = offsetRef.current * 0.01;
    }
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base snow color
    ctx.fillStyle = '#e8f0f8';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add subtle snow texture
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 20);
    return tex;
  }, []);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -GROUND_LENGTH / 2 + 10]}>
      <planeGeometry args={[LANE_WIDTH * 4, GROUND_LENGTH]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  );
};

// Lane markers
const LaneMarkers = () => {
  return (
    <group>
      {[-1, 0, 1].map((lane) => (
        <mesh
          key={lane}
          position={[lane * LANE_WIDTH, 0.01, -20]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.1, 60]} />
          <meshStandardMaterial color="#c5d8e8" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// Parallax Mountains - now with movement based on game speed
const ParallaxMountains = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { speed, gameState } = useGameStore();
  const offsetRef = useRef(0);
  
  const mountains = useMemo(() => {
    const items = [];
    // Multiple layers for parallax effect
    for (let layer = 0; layer < 3; layer++) {
      const layerDepth = -60 - layer * 30;
      const layerScale = 1 + layer * 0.5;
      const count = 6 + layer * 2;
      
      for (let i = 0; i < count; i++) {
        items.push({
          position: [
            (i - count / 2) * 20 * layerScale + Math.random() * 10,
            0,
            layerDepth - Math.random() * 20
          ] as [number, number, number],
          scale: (6 + Math.random() * 8) * layerScale,
          color: layer === 0 ? '#4a6fa5' : layer === 1 ? '#3a5a8a' : '#2a4a70',
          layer,
          parallaxSpeed: 1 / (layer + 1) * 0.1, // Closer = faster
        });
      }
    }
    return items;
  }, []);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;
    
    // Very subtle parallax movement
    offsetRef.current += speed * delta * 0.5;
  });

  return (
    <group ref={groupRef}>
      {mountains.map((mountain, i) => (
        <group key={i}>
          <mesh 
            position={[
              mountain.position[0],
              mountain.position[1],
              mountain.position[2]
            ]}
          >
            <coneGeometry args={[mountain.scale, mountain.scale * 2, 4]} />
            <meshStandardMaterial color={mountain.color} flatShading />
          </mesh>
          {/* Snow caps */}
          <mesh
            position={[
              mountain.position[0],
              mountain.scale * 1.3,
              mountain.position[2]
            ]}
          >
            <coneGeometry args={[mountain.scale * 0.4, mountain.scale * 0.6, 4]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Side snow banks with more detail
const SnowBanks = () => {
  return (
    <group>
      {/* Left bank */}
      <mesh position={[-6, 0.5, -20]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[4, 1.5, 80]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.95} />
      </mesh>
      {/* Right bank */}
      <mesh position={[6, 0.5, -20]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[4, 1.5, 80]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.95} />
      </mesh>
      
      {/* Snow drifts on sides */}
      {[-1, 1].map((side) => (
        [0, 1, 2, 3].map((i) => (
          <mesh 
            key={`drift-${side}-${i}`}
            position={[side * 5, 0.3, -15 - i * 20]}
            rotation={[0, Math.random() * Math.PI, 0]}
          >
            <sphereGeometry args={[1.5 + Math.random(), 8, 8]} />
            <meshStandardMaterial color="#e8f0f8" roughness={0.95} />
          </mesh>
        ))
      ))}
    </group>
  );
};

// Icy crystals decorating the sides
const IceCrystals = () => {
  const crystals = useMemo(() => {
    const items = [];
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      items.push({
        position: [
          side * (4 + Math.random() * 2),
          Math.random() * 0.5,
          -Math.random() * 60
        ] as [number, number, number],
        rotation: Math.random() * Math.PI,
        scale: 0.2 + Math.random() * 0.3,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {crystals.map((crystal, i) => (
        <mesh
          key={i}
          position={crystal.position}
          rotation={[0, crystal.rotation, Math.random() * 0.5]}
        >
          <octahedronGeometry args={[crystal.scale, 0]} />
          <meshStandardMaterial 
            color="#a8d8ea" 
            roughness={0.2} 
            transparent 
            opacity={0.8}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export const Environment = () => {
  return (
    <group>
      <Ground />
      <LaneMarkers />
      <ParallaxMountains />
      <SnowBanks />
      <IceCrystals />
    </group>
  );
};
