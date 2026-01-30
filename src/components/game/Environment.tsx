import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, BiomeType } from '@/store/gameStore';

const GROUND_LENGTH = 100;
const LANE_WIDTH = 2;

// Biome colors
const BIOME_COLORS: Record<BiomeType, { ground: string; accent: string }> = {
  ice_plains: { ground: '#e8f0f8', accent: '#c5e0f0' },
  ocean: { ground: '#1a4a6a', accent: '#2a6a9a' },
  cliffs: { ground: '#8a9ab0', accent: '#6a7a90' },
  mountain: { ground: '#c8d8e8', accent: '#a8b8c8' },
  peaks: { ground: '#f0f4f8', accent: '#d8e0e8' },
};

// Ground with biome-aware texturing
const Ground = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { speed, gameState, currentBiome } = useGameStore();
  const offsetRef = useRef(0);

  useFrame((_, delta) => {
    if (gameState !== 'playing' || !meshRef.current) return;
    offsetRef.current += speed * delta * 60;
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material.map) {
      material.map.offset.y = offsetRef.current * 0.01;
    }
    
    // Update ground color based on biome
    const colors = BIOME_COLORS[currentBiome];
    const targetColor = new THREE.Color(colors.ground);
    material.color.lerp(targetColor, 0.02);
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#e8f0f8';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add subtle texture
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 2 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some darker spots for depth
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 4 + 2;
      ctx.fillStyle = `rgba(180, 200, 220, ${Math.random() * 0.15})`;
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
      <meshStandardMaterial map={texture} roughness={0.85} />
    </mesh>
  );
};

// Subtle lane indicators
const LaneMarkers = () => {
  return (
    <group>
      {[-1, 0, 1].map((lane) => (
        <mesh
          key={lane}
          position={[lane * LANE_WIDTH, 0.005, -20]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.05, 60]} />
          <meshStandardMaterial color="#b0c8d8" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// Realistic mountain range with multiple peaks
const RealisticMountains = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const mountainData = useMemo(() => {
    const mountains = [];
    
    // Generate realistic mountain range
    for (let layer = 0; layer < 4; layer++) {
      const layerZ = -80 - layer * 40;
      const layerScale = 1 + layer * 0.6;
      const count = 8 + layer * 3;
      const baseOpacity = 1 - layer * 0.15;
      
      for (let i = 0; i < count; i++) {
        const baseX = (i - count / 2) * 25 * layerScale;
        const x = baseX + (Math.random() - 0.5) * 15;
        
        // Main peak
        mountains.push({
          position: [x, 0, layerZ + (Math.random() - 0.5) * 20] as [number, number, number],
          height: (15 + Math.random() * 25) * layerScale,
          width: (8 + Math.random() * 12) * layerScale,
          rotation: (Math.random() - 0.5) * 0.3,
          layer,
          opacity: baseOpacity,
          hasSnowCap: Math.random() > 0.3,
          snowCapRatio: 0.2 + Math.random() * 0.3,
        });
        
        // Add secondary smaller peaks nearby
        if (Math.random() > 0.5) {
          mountains.push({
            position: [x + (Math.random() - 0.5) * 10, 0, layerZ + (Math.random() - 0.5) * 15] as [number, number, number],
            height: (8 + Math.random() * 15) * layerScale,
            width: (5 + Math.random() * 8) * layerScale,
            rotation: (Math.random() - 0.5) * 0.4,
            layer,
            opacity: baseOpacity,
            hasSnowCap: Math.random() > 0.4,
            snowCapRatio: 0.15 + Math.random() * 0.25,
          });
        }
      }
    }
    
    return mountains;
  }, []);

  // Color based on layer (atmospheric perspective)
  const getColor = (layer: number) => {
    const colors = ['#3a5a80', '#4a6a90', '#5a7aa0', '#6a8ab0'];
    return colors[layer] || colors[3];
  };

  return (
    <group ref={groupRef}>
      {mountainData.map((mountain, i) => (
        <group key={i} position={mountain.position} rotation={[0, mountain.rotation, 0]}>
          {/* Main mountain body - use irregular geometry */}
          <mesh>
            <coneGeometry args={[mountain.width, mountain.height, 6 + Math.floor(Math.random() * 3)]} />
            <meshStandardMaterial 
              color={getColor(mountain.layer)} 
              flatShading 
              transparent
              opacity={mountain.opacity}
            />
          </mesh>
          
          {/* Snow cap */}
          {mountain.hasSnowCap && (
            <mesh position={[0, mountain.height * (1 - mountain.snowCapRatio / 2), 0]}>
              <coneGeometry args={[mountain.width * mountain.snowCapRatio, mountain.height * mountain.snowCapRatio, 6]} />
              <meshStandardMaterial 
                color="#f0f5fa" 
                flatShading
                transparent
                opacity={mountain.opacity}
              />
            </mesh>
          )}
          
          {/* Rocky detail on sides */}
          {mountain.layer < 2 && (
            <>
              <mesh position={[mountain.width * 0.3, mountain.height * 0.3, mountain.width * 0.2]} rotation={[0.2, 0.5, 0.1]}>
                <coneGeometry args={[mountain.width * 0.15, mountain.height * 0.25, 4]} />
                <meshStandardMaterial color={getColor(mountain.layer)} flatShading transparent opacity={mountain.opacity * 0.9} />
              </mesh>
              <mesh position={[-mountain.width * 0.25, mountain.height * 0.25, -mountain.width * 0.15]} rotation={[-0.1, -0.3, -0.15]}>
                <coneGeometry args={[mountain.width * 0.12, mountain.height * 0.2, 4]} />
                <meshStandardMaterial color={getColor(mountain.layer)} flatShading transparent opacity={mountain.opacity * 0.9} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
};

// Simple side boundaries (no round shapes)
const SideBoundaries = () => {
  const { currentBiome } = useGameStore();
  
  // Different boundaries based on biome
  const getColor = () => {
    switch (currentBiome) {
      case 'ocean': return '#1a3a5a';
      case 'cliffs': return '#6a7a8a';
      case 'mountain': return '#a0b0c0';
      case 'peaks': return '#d0e0f0';
      default: return '#d8e8f0';
    }
  };
  
  return (
    <group>
      {/* Left edge - simple raised edge */}
      <mesh position={[-4.5, 0.15, -20]}>
        <boxGeometry args={[1, 0.3, 80]} />
        <meshStandardMaterial color={getColor()} roughness={0.9} />
      </mesh>
      {/* Right edge */}
      <mesh position={[4.5, 0.15, -20]}>
        <boxGeometry args={[1, 0.3, 80]} />
        <meshStandardMaterial color={getColor()} roughness={0.9} />
      </mesh>
    </group>
  );
};

// Ocean water effect for ocean biome
const OceanWater = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { currentBiome } = useGameStore();
  
  useFrame(({ clock }) => {
    if (!meshRef.current || currentBiome !== 'ocean') return;
    
    // Gentle wave motion
    meshRef.current.position.y = -0.5 + Math.sin(clock.elapsedTime * 0.5) * 0.05;
  });
  
  if (currentBiome !== 'ocean') return null;
  
  return (
    <mesh ref={meshRef} position={[0, -0.5, -20]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 100]} />
      <meshStandardMaterial 
        color="#0a3050" 
        roughness={0.2}
        transparent
        opacity={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};

export const Environment = () => {
  return (
    <group>
      <Ground />
      <LaneMarkers />
      <RealisticMountains />
      <SideBoundaries />
      <OceanWater />
    </group>
  );
};
