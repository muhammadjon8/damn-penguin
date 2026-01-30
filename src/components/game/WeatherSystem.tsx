import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, WeatherType, TimeOfDay } from '@/store/gameStore';

interface WeatherConfig {
  particleCount: number;
  particleSize: number;
  fallSpeed: number;
  windStrength: number;
  visibility: number;
}

const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: {
    particleCount: 200,
    particleSize: 0.05,
    fallSpeed: 1,
    windStrength: 0,
    visibility: 100,
  },
  light_snow: {
    particleCount: 500,
    particleSize: 0.08,
    fallSpeed: 1.5,
    windStrength: 0.5,
    visibility: 80,
  },
  blizzard: {
    particleCount: 2000,
    particleSize: 0.1,
    fallSpeed: 3,
    windStrength: 3,
    visibility: 30,
  },
  foggy: {
    particleCount: 100,
    particleSize: 0.03,
    fallSpeed: 0.5,
    windStrength: 0.2,
    visibility: 40,
  },
};

interface TimeConfig {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  skyColor: string;
  fogColor: string;
  fogNear: number;
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
    fogNear: 20,
    fogFar: 90,
  },
  day: {
    ambientColor: '#b3d4fc',
    ambientIntensity: 0.5,
    directionalColor: '#fff5e6',
    directionalIntensity: 0.8,
    skyColor: '#1e3a5f',
    fogColor: '#1e3a5f',
    fogNear: 20,
    fogFar: 100,
  },
  dusk: {
    ambientColor: '#ffcc80',
    ambientIntensity: 0.35,
    directionalColor: '#ff9966',
    directionalIntensity: 0.5,
    skyColor: '#1a1a3e',
    fogColor: '#2d1f3d',
    fogNear: 15,
    fogFar: 80,
  },
  night: {
    ambientColor: '#4a5580',
    ambientIntensity: 0.2,
    directionalColor: '#a0b4d4',
    directionalIntensity: 0.3,
    skyColor: '#0a0a1a',
    fogColor: '#0d0d24',
    fogNear: 10,
    fogFar: 70,
  },
};

// Aurora Borealis effect for night time
export const Aurora = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { timeOfDay } = useGameStore();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 0 },
  }), []);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    uniforms.uTime.value += delta * 0.5;
    
    const targetOpacity = timeOfDay === 'night' ? 0.4 : 0;
    uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, targetOpacity, 0.02);
    
    meshRef.current.visible = uniforms.uOpacity.value > 0.01;
  });
  
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;
    
    void main() {
      float wave1 = sin(vUv.x * 3.0 + uTime) * 0.5 + 0.5;
      float wave2 = sin(vUv.x * 5.0 - uTime * 1.3) * 0.5 + 0.5;
      float wave3 = sin(vUv.x * 2.0 + uTime * 0.7) * 0.5 + 0.5;
      
      float y = vUv.y;
      float mask = smoothstep(0.3, 0.7, y) * smoothstep(1.0, 0.6, y);
      
      vec3 color1 = vec3(0.2, 0.8, 0.5); // Green
      vec3 color2 = vec3(0.3, 0.5, 0.9); // Blue
      vec3 color3 = vec3(0.6, 0.3, 0.8); // Purple
      
      vec3 finalColor = mix(color1, color2, wave1);
      finalColor = mix(finalColor, color3, wave2 * 0.5);
      
      float alpha = mask * (wave1 * 0.3 + wave2 * 0.3 + wave3 * 0.2) * uOpacity;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;
  
  return (
    <mesh ref={meshRef} position={[0, 30, -60]} rotation={[0.2, 0, 0]}>
      <planeGeometry args={[120, 40]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Dynamic weather particles
export const WeatherParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const { weather, gameState } = useGameStore();
  const configRef = useRef(WEATHER_CONFIGS.clear);
  const timeRef = useRef(0);
  
  const maxParticles = 2000;
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(maxParticles * 3);
    const vel = new Float32Array(maxParticles * 3);
    
    for (let i = 0; i < maxParticles; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = Math.random() * -80 + 10;
      vel[i * 3] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 1] = 0.5 + Math.random();
      vel[i * 3 + 2] = Math.random() * 0.5;
    }
    
    return [pos, vel];
  }, []);
  
  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    
    // Smoothly transition to new weather config
    const targetConfig = WEATHER_CONFIGS[weather];
    configRef.current = {
      particleCount: THREE.MathUtils.lerp(configRef.current.particleCount, targetConfig.particleCount, 0.02),
      particleSize: THREE.MathUtils.lerp(configRef.current.particleSize, targetConfig.particleSize, 0.05),
      fallSpeed: THREE.MathUtils.lerp(configRef.current.fallSpeed, targetConfig.fallSpeed, 0.05),
      windStrength: THREE.MathUtils.lerp(configRef.current.windStrength, targetConfig.windStrength, 0.05),
      visibility: THREE.MathUtils.lerp(configRef.current.visibility, targetConfig.visibility, 0.02),
    };
    
    timeRef.current += delta;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const config = configRef.current;
    const speedMult = gameState === 'playing' ? 3 : 1;
    
    for (let i = 0; i < maxParticles; i++) {
      const visible = i < config.particleCount;
      
      if (visible) {
        // Apply wind and fall
        positions[i * 3] += Math.sin(timeRef.current + i) * config.windStrength * delta * speedMult;
        positions[i * 3 + 1] -= velocities[i * 3 + 1] * config.fallSpeed * delta * speedMult;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * speedMult;
        
        // Reset when below ground or too far
        if (positions[i * 3 + 1] < -1) {
          positions[i * 3] = (Math.random() - 0.5) * 60;
          positions[i * 3 + 1] = 40;
          positions[i * 3 + 2] = Math.random() * -80 + 10;
        }
      } else {
        // Hide unused particles
        positions[i * 3 + 1] = -100;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Update material
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.size = config.particleSize;
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
        size={0.08}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

// Dynamic lighting system
export const DynamicLighting = () => {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const { timeOfDay, weather } = useGameStore();
  
  const currentConfig = useRef(TIME_CONFIGS.day);
  
  useFrame(() => {
    const targetConfig = TIME_CONFIGS[timeOfDay];
    const weatherConfig = WEATHER_CONFIGS[weather];
    
    // Smoothly interpolate all values
    if (ambientRef.current) {
      const targetAmbient = new THREE.Color(targetConfig.ambientColor);
      ambientRef.current.color.lerp(targetAmbient, 0.02);
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        targetConfig.ambientIntensity * (weatherConfig.visibility / 100),
        0.02
      );
    }
    
    if (directionalRef.current) {
      const targetDirectional = new THREE.Color(targetConfig.directionalColor);
      directionalRef.current.color.lerp(targetDirectional, 0.02);
      directionalRef.current.intensity = THREE.MathUtils.lerp(
        directionalRef.current.intensity,
        targetConfig.directionalIntensity * (weatherConfig.visibility / 100),
        0.02
      );
    }
  });
  
  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color="#b3d4fc" />
      <directionalLight
        ref={directionalRef}
        position={[5, 15, 10]}
        intensity={0.8}
        color="#fff5e6"
        castShadow
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.2}
        color="#99ccff"
      />
    </>
  );
};

// Dynamic fog
export const DynamicFog = () => {
  const { timeOfDay, weather } = useGameStore();
  const fogRef = useRef<THREE.Fog>(null);
  
  useFrame(({ scene }) => {
    if (!scene.fog) return;
    
    const fog = scene.fog as THREE.Fog;
    const targetConfig = TIME_CONFIGS[timeOfDay];
    const weatherConfig = WEATHER_CONFIGS[weather];
    
    const targetColor = new THREE.Color(targetConfig.fogColor);
    fog.color.lerp(targetColor, 0.02);
    fog.near = THREE.MathUtils.lerp(fog.near, targetConfig.fogNear, 0.02);
    fog.far = THREE.MathUtils.lerp(fog.far, weatherConfig.visibility, 0.02);
  });
  
  return <fog ref={fogRef} attach="fog" args={['#1e3a5f', 20, 100]} />;
};

// Dynamic sky background
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
