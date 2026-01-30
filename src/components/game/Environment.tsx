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

// Distant mountains
const Mountains = () => {
  const mountains = useMemo(() => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      items.push({
        position: [
          (i - 4) * 25 + Math.random() * 10,
          0,
          -80 - Math.random() * 40
        ] as [number, number, number],
        scale: 8 + Math.random() * 12,
        color: i % 2 === 0 ? '#4a6fa5' : '#5a7fb5',
      });
    }
    return items;
  }, []);

  return (
    <group>
      {mountains.map((mountain, i) => (
        <mesh key={i} position={mountain.position}>
          <coneGeometry args={[mountain.scale, mountain.scale * 2, 4]} />
          <meshStandardMaterial color={mountain.color} flatShading />
        </mesh>
      ))}
      {/* Snow caps */}
      {mountains.map((mountain, i) => (
        <mesh
          key={`snow-${i}`}
          position={[
            mountain.position[0],
            mountain.scale * 1.3,
            mountain.position[2]
          ]}
        >
          <coneGeometry args={[mountain.scale * 0.4, mountain.scale * 0.6, 4]} />
          <meshStandardMaterial color="#ffffff" flatShading />
        </mesh>
      ))}
    </group>
  );
};

// Falling snow particles
const SnowParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const { gameState } = useGameStore();
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(1000 * 3);
    const vel = new Float32Array(1000);
    
    for (let i = 0; i < 1000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = Math.random() * -60 + 10;
      vel[i] = 0.5 + Math.random() * 1;
    }
    
    return [pos, vel];
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < 1000; i++) {
      positions[i * 3 + 1] -= velocities[i] * delta * (gameState === 'playing' ? 3 : 1);
      
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 30;
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = Math.random() * -60 + 10;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

// Side snow banks
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
    </group>
  );
};

export const Environment = () => {
  return (
    <group>
      <Ground />
      <LaneMarkers />
      <Mountains />
      <SnowParticles />
      <SnowBanks />
      
      {/* Ambient light */}
      <ambientLight intensity={0.4} color="#b3d4fc" />
      
      {/* Main directional light (sun) */}
      <directionalLight
        position={[5, 15, 10]}
        intensity={0.8}
        color="#fff5e6"
        castShadow
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
        color="#99ccff"
      />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#1e3a5f', 20, 100]} />
    </group>
  );
};
