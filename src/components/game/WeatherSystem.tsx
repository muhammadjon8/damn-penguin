import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, WeatherType, TimeOfDay } from '@/store/gameStore';

interface WeatherConfig {
  particleCount: number;
  particleSize: number;
  fallSpeed: number;
  windStrength: number;
}

const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: { particleCount: 100, particleSize: 0.04, fallSpeed: 0.8, windStrength: 0 },
  light_snow: { particleCount: 300, particleSize: 0.06, fallSpeed: 1.2, windStrength: 0.3 },
  blizzard: { particleCount: 800, particleSize: 0.08, fallSpeed: 2.5, windStrength: 2 },
  foggy: { particleCount: 50, particleSize: 0.03, fallSpeed: 0.4, windStrength: 0.1 },
};

interface TimeConfig {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  skyColor: string;
  fogColor: string;
  fogFar: number;
}

const TIME_CONFIGS: Record<TimeOfDay, TimeConfig> = {
  dawn: {
    ambientColor: '#ffb3a7',
    ambientIntensity: 0.4,
    directionalColor: '#ffd4a8',
    directionalIntensity: 0.6,
    skyColor: '#2d1b4e',
    fogColor: '#4a2a5c',
    fogFar: 80,
  },
  day: {
    ambientColor: '#b3d4fc',
    ambientIntensity: 0.5,
    directionalColor: '#fff5e6',
    directionalIntensity: 0.8,
    skyColor: '#1e3a5f',
    fogColor: '#1e3a5f',
    fogFar: 100,
  },
  dusk: {
    ambientColor: '#ffcc80',
    ambientIntensity: 0.35,
    directionalColor: '#ff9966',
    directionalIntensity: 0.5,
    skyColor: '#1a1a3e',
    fogColor: '#2d1f3d',
    fogFar: 70,
  },
  night: {
    ambientColor: '#4a5580',
    ambientIntensity: 0.2,
    directionalColor: '#a0b4d4',
    directionalIntensity: 0.3,
    skyColor: '#0a0a1a',
    fogColor: '#0d0d24',
    fogFar: 60,
  },
};

// Aurora - simplified shader
export const Aurora = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { timeOfDay } = useGameStore();
  const opacityRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetOpacity = timeOfDay === 'night' ? 0.35 : 0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta);
    
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacityRef.current;
    meshRef.current.visible = opacityRef.current > 0.01;
  });
  
  return (
    <mesh ref={meshRef} position={[0, 30, -60]} rotation={[0.2, 0, 0]}>
      <planeGeometry args={[100, 30]} />
      <meshBasicMaterial 
        color="#40a080" 
        transparent 
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Weather particles - optimized with fewer particles
export const WeatherParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const { weather, gameState } = useGameStore();
  const timeRef = useRef(0);
  
  const maxParticles = 800; // Reduced from 2000
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(maxParticles * 3);
    const vel = new Float32Array(maxParticles * 3);
    
    for (let i = 0; i < maxParticles; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 35;
      pos[i * 3 + 2] = Math.random() * -70 + 10;
      vel[i * 3] = (Math.random() - 0.5) * 1.5;
      vel[i * 3 + 1] = 0.4 + Math.random() * 0.6;
      vel[i * 3 + 2] = Math.random() * 0.3;
    }
    
    return [pos, vel];
  }, []);
  
  const configRef = useRef(WEATHER_CONFIGS.clear);
  
  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    
    const targetConfig = WEATHER_CONFIGS[weather];
    configRef.current = {
      particleCount: THREE.MathUtils.lerp(configRef.current.particleCount, targetConfig.particleCount, 0.03),
      particleSize: THREE.MathUtils.lerp(configRef.current.particleSize, targetConfig.particleSize, 0.05),
      fallSpeed: THREE.MathUtils.lerp(configRef.current.fallSpeed, targetConfig.fallSpeed, 0.05),
      windStrength: THREE.MathUtils.lerp(configRef.current.windStrength, targetConfig.windStrength, 0.05),
    };
    
    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const config = configRef.current;
    const speedMult = gameState === 'playing' ? 2.5 : 0.8;
    
    const activeCount = Math.floor(config.particleCount);
    
    for (let i = 0; i < maxParticles; i++) {
      if (i < activeCount) {
        positions[i * 3] += Math.sin(timeRef.current + i * 0.1) * config.windStrength * delta * speedMult;
        positions[i * 3 + 1] -= velocities[i * 3 + 1] * config.fallSpeed * delta * speedMult;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * speedMult;
        
        if (positions[i * 3 + 1] < -1) {
          positions[i * 3] = (Math.random() - 0.5) * 50;
          positions[i * 3 + 1] = 35;
          positions[i * 3 + 2] = Math.random() * -70 + 10;
        }
      } else {
        positions[i * 3 + 1] = -100;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    (particlesRef.current.material as THREE.PointsMaterial).size = config.particleSize;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={maxParticles}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.06}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

// Dynamic lighting - optimized
export const DynamicLighting = () => {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const { timeOfDay, weather } = useGameStore();
  
  useFrame(() => {
    const targetConfig = TIME_CONFIGS[timeOfDay];
    const weatherMult = weather === 'blizzard' ? 0.5 : weather === 'foggy' ? 0.7 : 1;
    
    if (ambientRef.current) {
      const targetColor = new THREE.Color(targetConfig.ambientColor);
      ambientRef.current.color.lerp(targetColor, 0.02);
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        targetConfig.ambientIntensity * weatherMult,
        0.02
      );
    }
    
    if (directionalRef.current) {
      const targetColor = new THREE.Color(targetConfig.directionalColor);
      directionalRef.current.color.lerp(targetColor, 0.02);
      directionalRef.current.intensity = THREE.MathUtils.lerp(
        directionalRef.current.intensity,
        targetConfig.directionalIntensity * weatherMult,
        0.02
      );
    }
  });
  
  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color="#b3d4fc" />
      <directionalLight ref={directionalRef} position={[5, 15, 10]} intensity={0.8} color="#fff5e6" />
      <directionalLight position={[-5, 5, -5]} intensity={0.15} color="#99ccff" />
    </>
  );
};

// Dynamic fog - simplified
export const DynamicFog = () => {
  const { timeOfDay, weather } = useGameStore();
  
  useFrame(({ scene }) => {
    if (!scene.fog) return;
    
    const fog = scene.fog as THREE.Fog;
    const targetConfig = TIME_CONFIGS[timeOfDay];
    const weatherFogMult = weather === 'blizzard' ? 0.4 : weather === 'foggy' ? 0.5 : 1;
    
    const targetColor = new THREE.Color(targetConfig.fogColor);
    fog.color.lerp(targetColor, 0.02);
    fog.far = THREE.MathUtils.lerp(fog.far, targetConfig.fogFar * weatherFogMult, 0.02);
  });
  
  return <fog attach="fog" args={['#1e3a5f', 15, 90]} />;
};

// Dynamic sky - simplified
export const DynamicSky = () => {
  const { timeOfDay } = useGameStore();
  
  useFrame(({ scene }) => {
    const targetColor = new THREE.Color(TIME_CONFIGS[timeOfDay].skyColor);
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetColor, 0.02);
    }
  });
  
  return <color attach="background" args={['#1e3a5f']} />;
};
