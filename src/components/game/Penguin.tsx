import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_WIDTH = 2;

// Snow kick particles
const SnowKickParticles = ({ active }: { active: boolean }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(40 * 3);
    velocitiesRef.current = new Float32Array(40 * 3);
    
    for (let i = 0; i < 40; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = Math.random() * 0.2;
      pos[i * 3 + 2] = Math.random() * 0.4 + 0.2;
      
      velocitiesRef.current[i * 3] = (Math.random() - 0.5) * 1.5;
      velocitiesRef.current[i * 3 + 1] = Math.random() * 2 + 0.5;
      velocitiesRef.current[i * 3 + 2] = Math.random() * 1.5 + 0.5;
    }
    
    return pos;
  }, []);
  
  useFrame((_, delta) => {
    if (!particlesRef.current || !velocitiesRef.current) return;
    
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    
    for (let i = 0; i < 40; i++) {
      if (active) {
        pos[i * 3] += vel[i * 3] * delta;
        pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
        pos[i * 3 + 1] -= 4 * delta; // Gravity
        pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
        
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3] = (Math.random() - 0.5) * 0.4;
          pos[i * 3 + 1] = 0;
          pos[i * 3 + 2] = Math.random() * 0.2;
        }
      } else {
        pos[i * 3 + 1] = -10;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef} position={[0, 0, 0.4]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={40}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.04} transparent opacity={0.6} />
    </points>
  );
};

// Belly slide trail effect
const BellySlideTrail = ({ active }: { active: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;
    const targetOpacity = active ? 0.3 : 0;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0.015, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.6, 2.5]} />
      <meshBasicMaterial color="#a0d0e8" transparent opacity={0} />
    </mesh>
  );
};

// Swimming animation effect
const SwimmingEffect = ({ active }: { active: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rippleRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    if (active) {
      rippleRef.current += delta * 5;
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0.08, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, i * 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25 + i * 0.15, 0.3 + i * 0.15, 16]} />
          <meshBasicMaterial color="#4090c0" transparent opacity={0.25 - i * 0.08} />
        </mesh>
      ))}
    </group>
  );
};

// Realistic Emperor Penguin
export const Penguin = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  
  const { 
    currentLane, 
    isJumping, 
    isSliding, 
    isBellySliding,
    isSwimming,
    isSlipping,
    endJump,
    gameState 
  } = useGameStore();
  
  const targetX = useRef(0);
  const jumpProgress = useRef(0);
  const waddle = useRef(0);
  const slipOffset = useRef(0);
  const swimBob = useRef(0);
  const breathingRef = useRef(0);

  useEffect(() => {
    targetX.current = currentLane * LANE_WIDTH;
  }, [currentLane]);

  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current) return;
    
    // Breathing animation (subtle scale pulse)
    breathingRef.current += delta * 2;
    const breathScale = 1 + Math.sin(breathingRef.current) * 0.01;
    
    // Slipping effect
    if (isSlipping) {
      slipOffset.current += delta * 12;
      const slipX = Math.sin(slipOffset.current) * 0.25;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        targetX.current + slipX,
        0.08
      );
      groupRef.current.rotation.z = Math.sin(slipOffset.current * 1.3) * 0.15;
    } else {
      slipOffset.current = 0;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        targetX.current,
        0.12
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.08);
    }

    // Swimming bob
    if (isSwimming) {
      swimBob.current += delta * 3.5;
      groupRef.current.position.y = Math.sin(swimBob.current) * 0.12 - 0.15;
      bodyRef.current.rotation.x = 0.25;
    } else if (isJumping) {
      // Jump animation
      jumpProgress.current += delta * 2.8;
      const jumpHeight = Math.sin(jumpProgress.current * Math.PI) * 1.3;
      groupRef.current.position.y = jumpHeight;
      
      if (jumpProgress.current >= 1) {
        jumpProgress.current = 0;
        groupRef.current.position.y = 0;
        endJump();
      }
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.08);
    }

    // Belly slide animation
    if (isBellySliding) {
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 1.1, 0.12);
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, -0.25, 0.12);
    } else if (isSliding) {
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, 0.55, 0.15);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.08);
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, 0.08);
    } else {
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, breathScale, 0.15);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.08);
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, 0.08);
    }

    // Wing animations
    if (leftWingRef.current && rightWingRef.current) {
      if (isSwimming) {
        const swimStroke = Math.sin(swimBob.current * 2) * 0.4;
        leftWingRef.current.rotation.z = 0.25 + swimStroke;
        rightWingRef.current.rotation.z = -0.25 - swimStroke;
      } else if (isJumping) {
        const flap = Math.sin(jumpProgress.current * Math.PI * 3.5) * 0.35;
        leftWingRef.current.rotation.z = 0.25 - flap;
        rightWingRef.current.rotation.z = -0.25 + flap;
      } else {
        leftWingRef.current.rotation.z = THREE.MathUtils.lerp(leftWingRef.current.rotation.z, 0.25, 0.08);
        rightWingRef.current.rotation.z = THREE.MathUtils.lerp(rightWingRef.current.rotation.z, -0.25, 0.08);
      }
    }

    // Waddle animation
    if (!isSliding && !isBellySliding && !isSwimming && gameState === 'playing') {
      waddle.current += delta * 12;
      bodyRef.current.rotation.z = Math.sin(waddle.current) * 0.04;
      
      // Head bob
      if (headRef.current) {
        headRef.current.position.y = 1.05 + Math.abs(Math.sin(waddle.current)) * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <SnowKickParticles active={gameState === 'playing' && !isJumping && !isSwimming} />
      <BellySlideTrail active={isBellySliding} />
      <SwimmingEffect active={isSwimming} />
      
      <group ref={bodyRef}>
        {/* Main body - Emperor penguin shape */}
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.3, 0.45, 12, 20]} />
          <meshStandardMaterial color="#1a1a25" roughness={0.75} />
        </mesh>
        
        {/* White belly/front */}
        <mesh position={[0, 0.5, 0.18]}>
          <capsuleGeometry args={[0.22, 0.38, 10, 18]} />
          <meshStandardMaterial color="#f8f8f5" roughness={0.85} />
        </mesh>
        
        {/* Head */}
        <group ref={headRef} position={[0, 1.05, 0.03]}>
          <mesh>
            <sphereGeometry args={[0.24, 18, 18]} />
            <meshStandardMaterial color="#1a1a25" roughness={0.75} />
          </mesh>
          
          {/* White face patches */}
          <mesh position={[0, -0.02, 0.15]}>
            <sphereGeometry args={[0.15, 14, 14]} />
            <meshStandardMaterial color="#f8f8f5" roughness={0.85} />
          </mesh>
          
          {/* Yellow/orange ear patches (Emperor penguin markings) */}
          <mesh position={[-0.15, -0.05, 0.1]} rotation={[0, 0.3, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#f0a020" roughness={0.7} />
          </mesh>
          <mesh position={[0.15, -0.05, 0.1]} rotation={[0, -0.3, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#f0a020" roughness={0.7} />
          </mesh>
          
          {/* Yellow chest gradient patch */}
          <mesh position={[0, -0.18, 0.15]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#f5c040" roughness={0.8} />
          </mesh>
          
          {/* Eyes */}
          <mesh position={[-0.08, 0.05, 0.2]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#101010" />
          </mesh>
          <mesh position={[0.08, 0.05, 0.2]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#101010" />
          </mesh>
          
          {/* Eye highlights */}
          <mesh position={[-0.075, 0.06, 0.22]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.085, 0.06, 0.22]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
          
          {/* Beak */}
          <mesh position={[0, -0.02, 0.28]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.04, 0.12, 8]} />
            <meshStandardMaterial color="#2a2a30" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.05, 0.26]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.03, 0.08, 6]} />
            <meshStandardMaterial color="#e08020" roughness={0.6} />
          </mesh>
        </group>
        
        {/* Left wing/flipper */}
        <mesh ref={leftWingRef} position={[-0.35, 0.55, 0]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.06, 0.35, 6, 10]} />
          <meshStandardMaterial color="#1a1a25" roughness={0.75} />
        </mesh>
        
        {/* Right wing/flipper */}
        <mesh ref={rightWingRef} position={[0.35, 0.55, 0]} rotation={[0, 0, -0.25]}>
          <capsuleGeometry args={[0.06, 0.35, 6, 10]} />
          <meshStandardMaterial color="#1a1a25" roughness={0.75} />
        </mesh>
        
        {/* Left foot */}
        <mesh position={[-0.12, 0.04, 0.12]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.16]} />
          <meshStandardMaterial color="#e08020" roughness={0.6} />
        </mesh>
        
        {/* Right foot */}
        <mesh position={[0.12, 0.04, 0.12]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.16]} />
          <meshStandardMaterial color="#e08020" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
};
