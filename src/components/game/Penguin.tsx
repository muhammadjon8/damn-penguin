import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_WIDTH = 2;

export const Penguin = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { currentLane, isJumping, isSliding, endJump } = useGameStore();
  
  const targetX = useRef(0);
  const jumpProgress = useRef(0);
  const waddle = useRef(0);

  useEffect(() => {
    targetX.current = currentLane * LANE_WIDTH;
  }, [currentLane]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth lane transition
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX.current,
      0.15
    );

    // Jump animation
    if (isJumping) {
      jumpProgress.current += delta * 3;
      const jumpHeight = Math.sin(jumpProgress.current * Math.PI) * 1.5;
      groupRef.current.position.y = jumpHeight;
      
      if (jumpProgress.current >= 1) {
        jumpProgress.current = 0;
        groupRef.current.position.y = 0;
        endJump();
      }
    }

    // Slide animation
    if (isSliding) {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 0.5, 0.2);
    } else {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 1, 0.2);
    }

    // Waddle animation
    waddle.current += delta * 10;
    groupRef.current.rotation.z = Math.sin(waddle.current) * 0.05;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
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
      <mesh position={[-0.4, 0.6, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      
      {/* Right wing */}
      <mesh position={[0.4, 0.6, 0]} rotation={[0, 0, -0.3]}>
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
  );
};
