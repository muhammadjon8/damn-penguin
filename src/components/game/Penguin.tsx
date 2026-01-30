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
    const pos = new Float32Array(50 * 3);
    velocitiesRef.current = new Float32Array(50 * 3);
    
    for (let i = 0; i < 50; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = Math.random() * 0.3;
      pos[i * 3 + 2] = Math.random() * 0.5 + 0.3;
      
      velocitiesRef.current[i * 3] = (Math.random() - 0.5) * 2;
      velocitiesRef.current[i * 3 + 1] = Math.random() * 3 + 1;
      velocitiesRef.current[i * 3 + 2] = Math.random() * 2 + 1;
    }
    
    return pos;
  }, []);
  
  useFrame((_, delta) => {
    if (!particlesRef.current || !velocitiesRef.current) return;
    
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    
    for (let i = 0; i < 50; i++) {
      if (active) {
        pos[i * 3] += vel[i * 3] * delta;
        pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
        pos[i * 3 + 1] -= 5 * delta; // Gravity
        pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
        
        // Reset particles
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3] = (Math.random() - 0.5) * 0.5;
          pos[i * 3 + 1] = 0;
          pos[i * 3 + 2] = Math.random() * 0.3;
        }
      } else {
        pos[i * 3 + 1] = -10; // Hide
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef} position={[0, 0, 0.5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={50}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.06} transparent opacity={0.7} />
    </points>
  );
};

// Belly slide trail effect
const BellySlideTrail = ({ active }: { active: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;
    const targetOpacity = active ? 0.4 : 0;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.8, 3]} />
      <meshBasicMaterial color="#a8d8ea" transparent opacity={0} />
    </mesh>
  );
};

// Swimming animation component
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
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, i * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3 + i * 0.2, 0.35 + i * 0.2, 16]} />
          <meshBasicMaterial color="#5fa8d3" transparent opacity={0.3 - i * 0.1} />
        </mesh>
      ))}
    </group>
  );
};

export const Penguin = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  
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

  useEffect(() => {
    targetX.current = currentLane * LANE_WIDTH;
  }, [currentLane]);

  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current) return;
    
    // Slipping effect - random wobble
    if (isSlipping) {
      slipOffset.current += delta * 15;
      const slipX = Math.sin(slipOffset.current) * 0.3;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        targetX.current + slipX,
        0.1
      );
      groupRef.current.rotation.z = Math.sin(slipOffset.current * 1.5) * 0.2;
    } else {
      slipOffset.current = 0;
      // Normal lane transition
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        targetX.current,
        0.15
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }

    // Swimming bob
    if (isSwimming) {
      swimBob.current += delta * 4;
      groupRef.current.position.y = Math.sin(swimBob.current) * 0.15 - 0.2;
      bodyRef.current.rotation.x = 0.3; // Lean forward
    } else if (isJumping) {
      // Jump animation
      jumpProgress.current += delta * 3;
      const jumpHeight = Math.sin(jumpProgress.current * Math.PI) * 1.5;
      groupRef.current.position.y = jumpHeight;
      
      if (jumpProgress.current >= 1) {
        jumpProgress.current = 0;
        groupRef.current.position.y = 0;
        endJump();
      }
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
    }

    // Belly slide animation
    if (isBellySliding) {
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 1.2, 0.15);
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, -0.3, 0.15);
    } else if (isSliding) {
      // Normal slide (crouch)
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, 0.5, 0.2);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.1);
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, 0.1);
    } else {
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, 1, 0.2);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.1);
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, 0.1);
    }

    // Wing flapping animation
    if (leftWingRef.current && rightWingRef.current) {
      if (isSwimming) {
        // Swimming stroke
        const swimStroke = Math.sin(swimBob.current * 2) * 0.5;
        leftWingRef.current.rotation.z = 0.3 + swimStroke;
        rightWingRef.current.rotation.z = -0.3 - swimStroke;
      } else if (isJumping) {
        // Flap during jump
        const flap = Math.sin(jumpProgress.current * Math.PI * 4) * 0.4;
        leftWingRef.current.rotation.z = 0.3 - flap;
        rightWingRef.current.rotation.z = -0.3 + flap;
      } else {
        leftWingRef.current.rotation.z = THREE.MathUtils.lerp(leftWingRef.current.rotation.z, 0.3, 0.1);
        rightWingRef.current.rotation.z = THREE.MathUtils.lerp(rightWingRef.current.rotation.z, -0.3, 0.1);
      }
    }

    // Waddle animation (only when not sliding/swimming)
    if (!isSliding && !isBellySliding && !isSwimming && gameState === 'playing') {
      waddle.current += delta * 10;
      bodyRef.current.rotation.z = Math.sin(waddle.current) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Particle effects */}
      <SnowKickParticles active={gameState === 'playing' && !isJumping && !isSwimming} />
      <BellySlideTrail active={isBellySliding} />
      <SwimmingEffect active={isSwimming} />
      
      <group ref={bodyRef}>
        {/* Body */}
        <mesh position={[0, 0.6, 0]}>
          <capsuleGeometry args={[0.35, 0.5, 8, 16]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>
        
        {/* Belly (white front) */}
        <mesh position={[0, 0.55, 0.2]}>
          <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
          <meshStandardMaterial color="#f5f5f0" roughness={0.9} />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 1.1, 0.05]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>
        
        {/* Face (white area) */}
        <mesh position={[0, 1.05, 0.2]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#f5f5f0" roughness={0.9} />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.08, 1.15, 0.25]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[0.08, 1.15, 0.25]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        
        {/* Beak */}
        <mesh position={[0, 1.05, 0.35]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <meshStandardMaterial color="#ff9500" roughness={0.6} />
        </mesh>
        
        {/* Left wing */}
        <mesh ref={leftWingRef} position={[-0.4, 0.6, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>
        
        {/* Right wing */}
        <mesh ref={rightWingRef} position={[0.4, 0.6, 0]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>
        
        {/* Left foot */}
        <mesh position={[-0.15, 0.05, 0.15]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.12, 0.05, 0.2]} />
          <meshStandardMaterial color="#ff9500" roughness={0.6} />
        </mesh>
        
        {/* Right foot */}
        <mesh position={[0.15, 0.05, 0.15]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.12, 0.05, 0.2]} />
          <meshStandardMaterial color="#ff9500" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
};
