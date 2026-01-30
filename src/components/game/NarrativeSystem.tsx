import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

// Thought bubble phrases
const THOUGHT_PHRASES = {
  early: [
    "The colony feels so far away...",
    "Why did I leave?",
    "Just a little further...",
  ],
  mid: [
    "These mountains... they call to me.",
    "Maybe just a little further...",
    "I can almost see something...",
  ],
  late: [
    "The horizon never gets closer.",
    "Perhaps the journey is the answer.",
    "I've come too far to stop now.",
  ],
  existential: [
    "Does the destination matter?",
    "In solitude, I find myself.",
    "But why...?",
  ],
};

// Memory fragments for rare collectibles
export const MEMORY_FRAGMENTS = [
  "I remember warmth... a huddle of family.",
  "The sound of waves crashing against ice.",
  "Mother's call echoing through the storm.",
  "The first time I saw the aurora.",
];

// 3D Thought Bubble - simplified
export const ThoughtBubble3D = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { showThought, gameState } = useGameStore();
  const scaleRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const targetScale = showThought && gameState === 'playing' ? 1 : 0;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 4);
    groupRef.current.scale.setScalar(scaleRef.current);
    
    if (showThought) {
      groupRef.current.position.y = 2 + Math.sin(Date.now() * 0.002) * 0.08;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      <mesh>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.25, -0.35, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.15, -0.5, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

// UI Overlay for thought text
export const ThoughtOverlay = () => {
  const { showThought, thoughtText, showMemory, memoryText } = useGameStore();
  
  return (
    <>
      <AnimatePresence>
        {showThought && thoughtText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="glass-panel rounded-2xl px-5 py-3 max-w-sm mx-4">
              <p className="text-foreground/90 text-center text-base md:text-lg font-light italic">
                "{thoughtText}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showMemory && memoryText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="bg-gradient-to-b from-background/80 to-secondary/60 backdrop-blur-md rounded-2xl px-6 py-5 max-w-md mx-4 border border-fish/40">
              <p className="text-accent/60 text-xs uppercase tracking-widest text-center mb-2">
                ✧ Memory Fragment ✧
              </p>
              <p className="text-foreground text-center text-lg md:text-xl font-light">
                {memoryText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Flashback vignette - simplified
export const FlashbackVignette = () => {
  const { distance, gameState } = useGameStore();
  const shownMilestones = useRef<Set<number>>(new Set());
  const flashbackRef = useRef<{ show: boolean; text: string }>({ show: false, text: '' });
  
  const flashbackMilestones = useMemo(() => ({
    1000: 'The colony... so far behind now.',
    3000: 'Echoes of familiar calls...',
    5000: 'The lights dance with purpose.',
    10000: 'Something awaits. I can feel it.',
  }), []);
  
  useEffect(() => {
    if (gameState !== 'playing') {
      shownMilestones.current.clear();
      return;
    }
    
    Object.entries(flashbackMilestones).forEach(([milestone, text]) => {
      const m = parseInt(milestone);
      if (distance >= m && distance < m + 80 && !shownMilestones.current.has(m)) {
        shownMilestones.current.add(m);
        flashbackRef.current = { show: true, text };
        setTimeout(() => {
          flashbackRef.current = { show: false, text: '' };
        }, 3500);
      }
    });
  }, [Math.floor(distance / 50), gameState, flashbackMilestones]);
  
  const { show, text } = flashbackRef.current;
  
  return (
    <AnimatePresence>
      {show && text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/60" />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center z-10"
          >
            <p className="melancholic-text text-2xl md:text-4xl title-gradient max-w-md mx-4">
              {text}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Colony silhouette - simplified
export const ColonySilhouette = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { distance, gameState } = useGameStore();
  const opacityRef = useRef(0);
  
  const penguins = useMemo(() => {
    const p = [];
    for (let i = 0; i < 12; i++) {
      p.push({
        x: (Math.random() - 0.5) * 25,
        z: -75 - Math.random() * 15,
        scale: 0.25 + Math.random() * 0.15,
      });
    }
    return p;
  }, []);
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const visible = distance >= 1000 && distance < 1150 && gameState === 'playing';
    const targetOpacity = visible ? 0.25 : 0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.02);
    
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;
      }
    });
  });
  
  return (
    <group ref={groupRef}>
      {penguins.map((penguin, i) => (
        <mesh key={i} position={[penguin.x, penguin.scale * 0.5, penguin.z]}>
          <capsuleGeometry args={[penguin.scale * 0.3, penguin.scale, 4, 6]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
};

// Shooting star - simplified
export const ShootingStar = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { timeOfDay, gameState } = useGameStore();
  const stateRef = useRef({ active: false, x: 0, y: 0, time: 0 });
  
  useFrame((_, delta) => {
    if (!meshRef.current || gameState !== 'playing') return;
    
    const state = stateRef.current;
    
    // Rare chance during night
    if (!state.active && timeOfDay === 'night' && Math.random() < 0.0008) {
      state.active = true;
      state.x = (Math.random() - 0.5) * 80;
      state.y = 30 + Math.random() * 15;
      state.time = 0;
    }
    
    if (state.active) {
      state.time += delta;
      meshRef.current.position.set(
        state.x + state.time * 25,
        state.y - state.time * 12,
        -50
      );
      
      const opacity = Math.max(0, 1 - state.time * 0.4);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      
      if (state.time > 2.5) {
        state.active = false;
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, -100, -50]}>
      <sphereGeometry args={[0.25, 6, 6]} />
      <meshBasicMaterial color="#fffef0" transparent opacity={0} />
    </mesh>
  );
};

// Distant penguin - simplified
export const DistantPenguin = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { distance, gameState } = useGameStore();
  const stateRef = useRef({ visible: false, x: 0, z: 0, timer: 0 });
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const state = stateRef.current;
    
    // Very rare chance when far
    if (!state.visible && distance > 5000 && gameState === 'playing' && Math.random() < 0.0003) {
      const side = Math.random() > 0.5 ? 1 : -1;
      state.visible = true;
      state.x = side * (12 + Math.random() * 8);
      state.z = -55 - Math.random() * 15;
      state.timer = 0;
    }
    
    if (state.visible) {
      state.timer += delta;
      if (state.timer > 7) state.visible = false;
    }
    
    const targetOpacity = state.visible ? 0.3 : 0;
    groupRef.current.position.set(state.x, 0, state.z);
    
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity || 0, targetOpacity, 0.03);
        mat.transparent = true;
      }
    });
  });
  
  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.18, 0.25, 4, 6]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0} />
      </mesh>
    </group>
  );
};

// Narrative system hook - optimized
export const useNarrativeSystem = () => {
  const { distance, gameState, triggerThought } = useGameStore();
  const lastThoughtDistance = useRef(0);
  const thoughtInterval = useRef(600);
  
  useEffect(() => {
    if (gameState !== 'playing') {
      lastThoughtDistance.current = 0;
      return;
    }
    
    if (distance - lastThoughtDistance.current >= thoughtInterval.current) {
      lastThoughtDistance.current = distance;
      thoughtInterval.current = 550 + Math.random() * 250;
      
      let phrasePool: string[];
      if (distance < 2000) phrasePool = THOUGHT_PHRASES.early;
      else if (distance < 5000) phrasePool = THOUGHT_PHRASES.mid;
      else if (distance < 10000) phrasePool = THOUGHT_PHRASES.late;
      else phrasePool = THOUGHT_PHRASES.existential;
      
      const phrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
      triggerThought(phrase);
    }
  }, [Math.floor(distance / 100), gameState, triggerThought]);
};
