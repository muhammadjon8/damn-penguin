import { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

// Thought bubble phrases organized by distance thresholds
const THOUGHT_PHRASES = {
  early: [
    "The colony feels so far away...",
    "Why did I leave?",
    "Just a little further...",
    "The wind is cold today.",
    "I can hear them still... maybe.",
  ],
  mid: [
    "These mountains... they call to me.",
    "Maybe just a little further...",
    "I can almost see something...",
    "Was there ever a reason?",
    "The ice remembers my footsteps.",
    "Each step takes me somewhere.",
  ],
  late: [
    "The horizon never gets closer.",
    "But what am I looking for?",
    "Perhaps the journey is the answer.",
    "I've come too far to stop now.",
    "The mountains whisper secrets.",
    "Somewhere ahead... something waits.",
  ],
  existential: [
    "Does the destination matter?",
    "Maybe I was always meant to wander.",
    "The silence speaks louder here.",
    "In solitude, I find myself.",
    "Every ending is a new beginning.",
    "But why...?",
  ],
};

// Memory fragments for rare collectibles
export const MEMORY_FRAGMENTS = [
  "I remember warmth... a huddle of family.",
  "The sound of waves crashing against ice.",
  "A fish shared with a friend, long ago.",
  "Mother's call echoing through the storm.",
  "The first time I saw the aurora.",
  "Dancing on the ice, carefree.",
  "Stars that seemed close enough to touch.",
  "A promise made under the midnight sun.",
];

// 3D Thought Bubble that appears above penguin
export const ThoughtBubble3D = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { showThought, gameState } = useGameStore();
  const scaleRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const targetScale = showThought && gameState === 'playing' ? 1 : 0;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 5);
    groupRef.current.scale.setScalar(scaleRef.current);
    
    // Float animation
    if (showThought) {
      groupRef.current.position.y = 2 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {/* Main bubble */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.85} 
          roughness={0.3}
        />
      </mesh>
      {/* Smaller connecting bubbles */}
      <mesh position={[-0.3, -0.4, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.2, -0.6, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

// UI Overlay for thought text
export const ThoughtOverlay = () => {
  const { showThought, thoughtText, showMemory, memoryText } = useGameStore();
  
  return (
    <>
      {/* Regular thought bubble */}
      <AnimatePresence>
        {showThought && thoughtText && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="glass-panel rounded-2xl px-6 py-4 max-w-md mx-4">
              <p className="text-foreground/90 text-center text-lg md:text-xl font-light italic">
                "{thoughtText}"
              </p>
              <div className="flex justify-center mt-2 gap-1">
                <span className="w-1.5 h-1.5 bg-accent/40 rounded-full" />
                <span className="w-1.5 h-1.5 bg-accent/30 rounded-full" />
                <span className="w-1.5 h-1.5 bg-accent/20 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Memory fragment (special collectible) */}
      <AnimatePresence>
        {showMemory && memoryText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="relative">
              {/* Ethereal glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-fish/30 to-transparent blur-xl -z-10 scale-150" />
              <div className="bg-gradient-to-b from-background/80 to-secondary/60 backdrop-blur-md rounded-2xl px-8 py-6 max-w-lg mx-4 border border-fish/40">
                <p className="text-accent/60 text-xs uppercase tracking-widest text-center mb-2">
                  ✧ Memory Fragment ✧
                </p>
                <p className="text-foreground text-center text-xl md:text-2xl font-light">
                  {memoryText}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Flashback vignette system
export const FlashbackVignette = () => {
  const { distance, gameState } = useGameStore();
  const [showFlashback, setShowFlashback] = useState(false);
  const [flashbackContent, setFlashbackContent] = useState<string | null>(null);
  const shownMilestones = useRef<Set<number>>(new Set());
  
  const flashbackMilestones = useMemo(() => ({
    1000: { type: 'colony', text: 'The colony... so far behind now.' },
    3000: { type: 'sounds', text: 'Echoes of familiar calls...' },
    5000: { type: 'aurora', text: 'The lights dance with purpose.' },
    7500: { type: 'mountains', text: 'The mountains... closer? Or just a dream.' },
    10000: { type: 'hope', text: 'Something awaits. I can feel it.' },
    15000: { type: 'determination', text: 'I will not stop. I cannot stop.' },
    20000: { type: 'transcendence', text: 'Beyond distance lies understanding.' },
  }), []);
  
  useEffect(() => {
    if (gameState !== 'playing') {
      shownMilestones.current.clear();
      return;
    }
    
    Object.entries(flashbackMilestones).forEach(([milestone, content]) => {
      const m = parseInt(milestone);
      if (distance >= m && distance < m + 100 && !shownMilestones.current.has(m)) {
        shownMilestones.current.add(m);
        setFlashbackContent(content.text);
        setShowFlashback(true);
        
        setTimeout(() => setShowFlashback(false), 4000);
      }
    });
  }, [distance, gameState, flashbackMilestones]);
  
  return (
    <AnimatePresence>
      {showFlashback && flashbackContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
        >
          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/70" />
          
          {/* Content */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-center z-10"
          >
            <p className="melancholic-text text-3xl md:text-5xl title-gradient max-w-xl mx-4">
              {flashbackContent}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Colony silhouette that appears at distance milestones
export const ColonySilhouette = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { distance, gameState } = useGameStore();
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (distance >= 1000 && distance < 1200 && gameState === 'playing') {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [distance, gameState]);
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const targetOpacity = visible ? 0.3 : 0;
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.02);
      }
    });
  });
  
  // Create penguin silhouettes
  const penguins = useMemo(() => {
    const p = [];
    for (let i = 0; i < 20; i++) {
      p.push({
        x: (Math.random() - 0.5) * 30,
        z: -80 - Math.random() * 20,
        scale: 0.3 + Math.random() * 0.2,
      });
    }
    return p;
  }, []);
  
  return (
    <group ref={groupRef}>
      {penguins.map((penguin, i) => (
        <mesh key={i} position={[penguin.x, penguin.scale * 0.5, penguin.z]}>
          <capsuleGeometry args={[penguin.scale * 0.3, penguin.scale, 4, 8]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
};

// Shooting star easter egg
export const ShootingStar = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const { timeOfDay, gameState } = useGameStore();
  const activeRef = useRef(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!meshRef.current || !trailRef.current || gameState !== 'playing') return;
    
    // Random chance to spawn during night
    if (!activeRef.current && timeOfDay === 'night' && Math.random() < 0.001) {
      activeRef.current = true;
      positionRef.current = { x: (Math.random() - 0.5) * 100, y: 30 + Math.random() * 20 };
      timeRef.current = 0;
    }
    
    if (activeRef.current) {
      timeRef.current += delta;
      
      // Move diagonally
      meshRef.current.position.x = positionRef.current.x + timeRef.current * 30;
      meshRef.current.position.y = positionRef.current.y - timeRef.current * 15;
      meshRef.current.position.z = -50;
      
      trailRef.current.position.copy(meshRef.current.position);
      trailRef.current.position.x -= 2;
      trailRef.current.position.y += 1;
      
      // Fade out
      const opacity = Math.max(0, 1 - timeRef.current * 0.5);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      (trailRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.5;
      
      if (timeRef.current > 3) {
        activeRef.current = false;
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        (trailRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  });
  
  return (
    <group>
      <mesh ref={meshRef} position={[0, -100, -50]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#fffef0" transparent opacity={0} />
      </mesh>
      <mesh ref={trailRef} position={[0, -100, -50]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[4, 0.3]} />
        <meshBasicMaterial color="#fffef0" transparent opacity={0} />
      </mesh>
    </group>
  );
};

// Distant penguin easter egg (very rare)
export const DistantPenguin = () => {
  const meshRef = useRef<THREE.Group>(null);
  const { distance, gameState } = useGameStore();
  const [visible, setVisible] = useState(false);
  const positionRef = useRef({ x: 0, z: 0 });
  
  useEffect(() => {
    // Very rare chance when far enough
    if (distance > 5000 && gameState === 'playing' && !visible && Math.random() < 0.0005) {
      const side = Math.random() > 0.5 ? 1 : -1;
      positionRef.current = { x: side * (15 + Math.random() * 10), z: -60 - Math.random() * 20 };
      setVisible(true);
      setTimeout(() => setVisible(false), 8000);
    }
  }, [Math.floor(distance / 100), gameState]); // Check every 100m
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    const targetOpacity = visible ? 0.4 : 0;
    meshRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity || 0, targetOpacity, 0.02);
        mat.transparent = true;
      }
    });
  });
  
  return (
    <group ref={meshRef} position={[positionRef.current.x, 0, positionRef.current.z]}>
      {/* Simple penguin silhouette */}
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0} />
      </mesh>
    </group>
  );
};

// Hook to manage narrative triggers
export const useNarrativeSystem = () => {
  const { 
    distance, 
    gameState, 
    triggerThought,
  } = useGameStore();
  
  const lastThoughtDistance = useRef(0);
  const thoughtInterval = useRef(500 + Math.random() * 300); // 500-800m
  
  useEffect(() => {
    if (gameState !== 'playing') {
      lastThoughtDistance.current = 0;
      return;
    }
    
    if (distance - lastThoughtDistance.current >= thoughtInterval.current) {
      lastThoughtDistance.current = distance;
      thoughtInterval.current = 500 + Math.random() * 300;
      
      // Select phrase based on distance
      let phrasePool: string[];
      if (distance < 2000) {
        phrasePool = THOUGHT_PHRASES.early;
      } else if (distance < 5000) {
        phrasePool = THOUGHT_PHRASES.mid;
      } else if (distance < 10000) {
        phrasePool = THOUGHT_PHRASES.late;
      } else {
        phrasePool = THOUGHT_PHRASES.existential;
      }
      
      const phrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
      triggerThought(phrase);
    }
  }, [distance, gameState, triggerThought]);
};
