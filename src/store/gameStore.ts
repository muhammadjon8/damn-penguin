import { create } from 'zustand';
import { trackGameStart, trackGameOver, trackBiomeReached, trackMilestone, trackHighScore } from '@/lib/analytics';

export type GameState = 'title' | 'playing' | 'gameOver';
export type Lane = -1 | 0 | 1;
export type WeatherType = 'clear' | 'light_snow' | 'blizzard' | 'foggy';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type BiomeType = 'ice_plains' | 'ocean' | 'cliffs' | 'mountain' | 'peaks';

// Biome distance thresholds - every 1000m
export const BIOME_THRESHOLDS = {
  ice_plains: { start: 0, end: 1000 },
  ocean: { start: 1000, end: 2000 },
  cliffs: { start: 2000, end: 3000 },
  mountain: { start: 3000, end: 4000 },
  peaks: { start: 4000, end: Infinity },
};

export const getBiomeForDistance = (distance: number): BiomeType => {
  if (distance < 1000) return 'ice_plains';
  if (distance < 2000) return 'ocean';
  if (distance < 3000) return 'cliffs';
  if (distance < 4000) return 'mountain';
  return 'peaks';
};

export const getBiomeTransition = (distance: number): { current: BiomeType; next: BiomeType | null; progress: number } => {
  const biome = getBiomeForDistance(distance);
  const threshold = BIOME_THRESHOLDS[biome];
  
  // Check if we're in transition zone (last 200m of biome)
  const transitionStart = threshold.end - 200;
  if (distance >= transitionStart && threshold.end !== Infinity) {
    const nextBiome = getBiomeForDistance(threshold.end + 1);
    const progress = (distance - transitionStart) / 200;
    return { current: biome, next: nextBiome, progress };
  }
  
  return { current: biome, next: null, progress: 0 };
};

interface GameStore {
  // Game state
  gameState: GameState;
  score: number;
  distance: number;
  highScore: number;
  gameStartTime: number;
  
  // Player state
  currentLane: Lane;
  isJumping: boolean;
  isSliding: boolean;
  isBellySliding: boolean;
  isSwimming: boolean;
  isSlipping: boolean;
  
  // Abilities
  bellySlideEnergy: number;
  bellySlideCooldown: number;
  
  // Combo system
  comboCount: number;
  comboTimer: number;
  maxCombo: number;
  
  // Speed
  speed: number;
  baseSpeed: number;
  speedBoostTimer: number;
  
  // Environment
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  weatherTransition: number;
  timeTransition: number;
  currentBiome: BiomeType;
  biomeTransitionProgress: number;
  lastBiome: BiomeType;
  
  // Milestones
  lastMilestone: number;
  showMilestone: boolean;
  milestoneText: string;
  
  // Narrative
  showThought: boolean;
  thoughtText: string;
  thoughtsShown: number;
  showMemory: boolean;
  memoryText: string;
  isSlowMotion: boolean;
  slowMotionTimer: number;
  
  // Debug
  debugCollisions: boolean;
  
  // Grace period for collisions
  invincibleTimer: number;
  
  // Actions
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  goToTitle: () => void;
  
  // Movement
  moveLeft: () => void;
  moveRight: () => void;
  jump: () => void;
  slide: () => void;
  endJump: () => void;
  endSlide: () => void;
  startBellySlide: () => void;
  endBellySlide: () => void;
  setSwimming: (swimming: boolean) => void;
  setSlipping: (slipping: boolean) => void;
  
  // Scoring
  addScore: (points: number) => void;
  incrementDistance: (delta: number) => void;
  increaseSpeed: () => void;
  addCombo: () => void;
  resetCombo: () => void;
  updateComboTimer: (delta: number) => void;
  
  // Environment
  setWeather: (weather: WeatherType) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  updateEnvironment: (delta: number) => void;
  updateBiome: () => void;
  
  // Abilities
  updateAbilities: (delta: number) => void;
  updateInvincibility: (delta: number) => void;
  
  // Milestones
  checkMilestone: () => void;
  hideMilestone: () => void;
  
  // Narrative
  triggerThought: (text: string) => void;
  hideThought: () => void;
  triggerMemory: (text: string) => void;
  hideMemory: () => void;
  triggerSlowMotion: () => void;
  updateSlowMotion: (delta: number) => void;
  
  // Debug
  toggleDebugCollisions: () => void;
}

const COMBO_TIMEOUT = 2;
const BELLY_SLIDE_MAX = 3;
const BELLY_SLIDE_COOLDOWN = 5;
const MILESTONE_INTERVAL = 500;
const TIME_CYCLE_DURATION = 150;
const WEATHER_CHANGE_INTERVAL = 45;
const INVINCIBILITY_DURATION = 0.3; // Grace period after near-miss

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: 'title',
  score: 0,
  distance: 0,
  highScore: 0,
  gameStartTime: 0,
  currentLane: 0,
  isJumping: false,
  isSliding: false,
  isBellySliding: false,
  isSwimming: false,
  isSlipping: false,
  
  // Abilities
  bellySlideEnergy: BELLY_SLIDE_MAX,
  bellySlideCooldown: 0,
  
  // Combo
  comboCount: 0,
  comboTimer: 0,
  maxCombo: 0,
  
  // Speed
  speed: 0.3,
  baseSpeed: 0.3,
  speedBoostTimer: 0,
  
  // Environment
  weather: 'clear',
  timeOfDay: 'day',
  weatherTransition: 0,
  timeTransition: 0,
  currentBiome: 'ice_plains',
  biomeTransitionProgress: 0,
  lastBiome: 'ice_plains',
  
  // Milestones
  lastMilestone: 0,
  showMilestone: false,
  milestoneText: '',
  
  // Narrative
  showThought: false,
  thoughtText: '',
  thoughtsShown: 0,
  showMemory: false,
  memoryText: '',
  isSlowMotion: false,
  slowMotionTimer: 0,
  
  // Debug
  debugCollisions: false,
  
  // Grace period
  invincibleTimer: 0,
  
  // Game flow actions
  startGame: () => {
    trackGameStart();
    set({
      gameState: 'playing',
      score: 0,
      distance: 0,
      gameStartTime: Date.now(),
      currentLane: 0,
      isJumping: false,
      isSliding: false,
      isBellySliding: false,
      isSwimming: false,
      isSlipping: false,
      speed: 0.3,
      bellySlideEnergy: BELLY_SLIDE_MAX,
      bellySlideCooldown: 0,
      comboCount: 0,
      comboTimer: 0,
      maxCombo: 0,
      speedBoostTimer: 0,
      weather: 'clear',
      timeOfDay: 'day',
      weatherTransition: 0,
      timeTransition: 0,
      currentBiome: 'ice_plains',
      biomeTransitionProgress: 0,
      lastBiome: 'ice_plains',
      lastMilestone: 0,
      showMilestone: false,
      milestoneText: '',
      showThought: false,
      thoughtText: '',
      thoughtsShown: 0,
      showMemory: false,
      memoryText: '',
      isSlowMotion: false,
      slowMotionTimer: 0,
      invincibleTimer: INVINCIBILITY_DURATION,
    });
  },
  
  endGame: () => {
    const { score, distance, highScore, maxCombo, comboCount, invincibleTimer, currentBiome, gameStartTime } = get();
    // Don't end game during invincibility
    if (invincibleTimer > 0) return;
    
    const survivalTime = (Date.now() - gameStartTime) / 1000;
    const isNewHighScore = distance > highScore;
    
    // Track game over analytics
    trackGameOver({
      distance,
      fishCollected: Math.floor(score),
      biomeReached: currentBiome,
      survivalTime,
      maxCombo: Math.max(maxCombo, comboCount),
    });
    
    // Track high score if beaten
    if (isNewHighScore && highScore > 0) {
      trackHighScore(distance, highScore);
    }
    
    set({
      gameState: 'gameOver',
      highScore: Math.max(distance, highScore),
      maxCombo: Math.max(maxCombo, comboCount),
    });
  },
  
  resetGame: () => {
    trackGameStart();
    set({
      gameState: 'playing',
      score: 0,
      distance: 0,
      gameStartTime: Date.now(),
      currentLane: 0,
      isJumping: false,
      isSliding: false,
      isBellySliding: false,
      isSwimming: false,
      isSlipping: false,
      speed: 0.3,
      bellySlideEnergy: BELLY_SLIDE_MAX,
      bellySlideCooldown: 0,
      comboCount: 0,
      comboTimer: 0,
      speedBoostTimer: 0,
      weather: 'clear',
      timeOfDay: 'day',
      weatherTransition: 0,
      timeTransition: 0,
      currentBiome: 'ice_plains',
      biomeTransitionProgress: 0,
      lastBiome: 'ice_plains',
      lastMilestone: 0,
      showMilestone: false,
      milestoneText: '',
      showThought: false,
      thoughtText: '',
      thoughtsShown: 0,
      showMemory: false,
      memoryText: '',
      isSlowMotion: false,
      slowMotionTimer: 0,
      invincibleTimer: INVINCIBILITY_DURATION,
    });
  },

  goToTitle: () => set({
    gameState: 'title',
    score: 0,
    distance: 0,
    currentLane: 0,
    isJumping: false,
    isSliding: false,
    isBellySliding: false,
    isSwimming: false,
    isSlipping: false,
    speed: 0.3,
    comboCount: 0,
    comboTimer: 0,
    weather: 'clear',
    timeOfDay: 'day',
    currentBiome: 'ice_plains',
    showThought: false,
    showMemory: false,
  }),
  
  // Movement actions
  moveLeft: () => {
    const { isSlipping } = get();
    if (isSlipping) return;
    set((state) => ({
      currentLane: Math.max(-1, state.currentLane - 1) as Lane,
    }));
  },
  
  moveRight: () => {
    const { isSlipping } = get();
    if (isSlipping) return;
    set((state) => ({
      currentLane: Math.min(1, state.currentLane + 1) as Lane,
    }));
  },
  
  jump: () => {
    const { isJumping, isSliding, isBellySliding, isSwimming } = get();
    if (!isJumping && !isSliding && !isBellySliding && !isSwimming) {
      set({ isJumping: true });
    }
  },
  
  slide: () => {
    const { isJumping, isSliding, isSwimming } = get();
    if (!isJumping && !isSliding && !isSwimming) {
      set({ isSliding: true });
    }
  },
  
  endJump: () => set({ isJumping: false }),
  endSlide: () => set({ isSliding: false, isBellySliding: false }),
  
  startBellySlide: () => {
    const { bellySlideCooldown, bellySlideEnergy, isJumping, isSwimming } = get();
    if (bellySlideCooldown <= 0 && bellySlideEnergy > 0 && !isJumping && !isSwimming) {
      set({ isBellySliding: true, isSliding: true });
    }
  },
  
  endBellySlide: () => {
    const { isBellySliding, bellySlideEnergy } = get();
    if (isBellySliding) {
      set({ 
        isBellySliding: false, 
        isSliding: false,
        bellySlideCooldown: bellySlideEnergy < 0.5 ? BELLY_SLIDE_COOLDOWN : 0,
      });
    }
  },
  
  setSwimming: (swimming) => set({ isSwimming: swimming }),
  setSlipping: (slipping) => set({ isSlipping: slipping }),
  
  // Scoring
  addScore: (points) => set((state) => ({
    score: state.score + points * (1 + Math.floor(state.comboCount / 5) * 0.5),
  })),
  
  incrementDistance: (delta) => set((state) => ({
    distance: state.distance + delta * state.speed,
  })),
  
  increaseSpeed: () => set((state) => ({
    speed: Math.min(state.speed + 0.005, 0.8),
  })),
  
  addCombo: () => {
    const { comboCount, maxCombo } = get();
    const newCombo = comboCount + 1;
    set({ 
      comboCount: newCombo,
      comboTimer: COMBO_TIMEOUT,
      maxCombo: Math.max(maxCombo, newCombo),
      speedBoostTimer: newCombo >= 3 ? 2 : get().speedBoostTimer,
    });
  },
  
  resetCombo: () => set({ comboCount: 0, comboTimer: 0 }),
  
  updateComboTimer: (delta) => {
    const { comboTimer, comboCount } = get();
    if (comboTimer > 0) {
      const newTimer = comboTimer - delta;
      if (newTimer <= 0 && comboCount > 0) {
        set({ comboCount: 0, comboTimer: 0 });
      } else {
        set({ comboTimer: newTimer });
      }
    }
  },
  
  // Environment
  setWeather: (weather) => set({ weather }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  
  updateEnvironment: (delta) => {
    const { timeTransition, weatherTransition, gameState } = get();
    if (gameState !== 'playing') return;
    
    const newTimeTransition = timeTransition + delta;
    const timePhase = (newTimeTransition / TIME_CYCLE_DURATION) % 1;
    
    let newTimeOfDay: TimeOfDay;
    if (timePhase < 0.25) newTimeOfDay = 'dawn';
    else if (timePhase < 0.5) newTimeOfDay = 'day';
    else if (timePhase < 0.75) newTimeOfDay = 'dusk';
    else newTimeOfDay = 'night';
    
    const newWeatherTransition = weatherTransition + delta;
    let newWeather = get().weather;
    
    if (newWeatherTransition > WEATHER_CHANGE_INTERVAL) {
      const weathers: WeatherType[] = ['clear', 'light_snow', 'blizzard', 'foggy'];
      const randomIndex = Math.floor(Math.random() * weathers.length);
      newWeather = weathers[randomIndex];
      set({ weatherTransition: 0 });
    }
    
    set({ 
      timeTransition: newTimeTransition,
      weatherTransition: newWeatherTransition,
      timeOfDay: newTimeOfDay,
      weather: newWeather,
    });
  },
  
  updateBiome: () => {
    const { distance, lastBiome } = get();
    const transition = getBiomeTransition(distance);
    
    // Track biome change for analytics
    if (transition.current !== lastBiome) {
      trackBiomeReached(transition.current, distance);
    }
    
    set({
      currentBiome: transition.current,
      biomeTransitionProgress: transition.progress,
      lastBiome: transition.current,
    });
  },
  
  // Abilities
  updateAbilities: (delta) => {
    const { isBellySliding, bellySlideEnergy, bellySlideCooldown, speedBoostTimer, speed, baseSpeed } = get();
    
    let newEnergy = bellySlideEnergy;
    let newCooldown = bellySlideCooldown;
    let newSpeedBoost = speedBoostTimer;
    let newSpeed = speed;
    
    if (isBellySliding) {
      newEnergy = Math.max(0, bellySlideEnergy - delta);
      if (newEnergy <= 0) {
        get().endBellySlide();
      }
      newSpeed = Math.min(speed + 0.1, 0.6);
    } else {
      if (bellySlideCooldown <= 0) {
        newEnergy = Math.min(BELLY_SLIDE_MAX, bellySlideEnergy + delta * 0.5);
      }
    }
    
    if (bellySlideCooldown > 0) {
      newCooldown = Math.max(0, bellySlideCooldown - delta);
    }
    
    if (speedBoostTimer > 0) {
      newSpeedBoost = speedBoostTimer - delta;
      newSpeed = Math.min(baseSpeed + 0.15, 0.6);
    } else if (!isBellySliding) {
      newSpeed = baseSpeed + (get().distance / 5000) * 0.1;
    }
    
    set({
      bellySlideEnergy: newEnergy,
      bellySlideCooldown: newCooldown,
      speedBoostTimer: newSpeedBoost,
      speed: Math.min(newSpeed, 0.7),
    });
  },
  
  updateInvincibility: (delta) => {
    const { invincibleTimer } = get();
    if (invincibleTimer > 0) {
      set({ invincibleTimer: Math.max(0, invincibleTimer - delta) });
    }
  },
  
  // Milestones
  checkMilestone: () => {
    const { distance, lastMilestone, currentBiome } = get();
    const currentMilestone = Math.floor(distance / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
    
    // Check for biome transitions
    const biomeMessages: Record<BiomeType, { distance: number; message: string }> = {
      ice_plains: { distance: 0, message: '' },
      ocean: { distance: 2000, message: 'Entering Ocean Waters...' },
      cliffs: { distance: 4000, message: 'Ascending Coastal Cliffs...' },
      mountain: { distance: 6000, message: 'The Mountain Ascent Begins...' },
      peaks: { distance: 8000, message: 'Treacherous Peaks Ahead...' },
    };
    
    const biomeInfo = biomeMessages[currentBiome];
    if (biomeInfo.distance > 0 && distance >= biomeInfo.distance && distance < biomeInfo.distance + 100 && lastMilestone < biomeInfo.distance) {
      set({
        lastMilestone: biomeInfo.distance,
        showMilestone: true,
        milestoneText: biomeInfo.message,
      });
      setTimeout(() => get().hideMilestone(), 3000);
      return;
    }
    
    if (currentMilestone > lastMilestone && currentMilestone > 0) {
      set({
        lastMilestone: currentMilestone,
        showMilestone: true,
        milestoneText: `${currentMilestone}m`,
      });
      setTimeout(() => get().hideMilestone(), 2000);
    }
  },
  
  hideMilestone: () => set({ showMilestone: false }),
  
  // Narrative actions
  triggerThought: (text: string) => {
    set({
      showThought: true,
      thoughtText: text,
      thoughtsShown: get().thoughtsShown + 1,
    });
    setTimeout(() => get().hideThought(), 4000);
  },
  
  hideThought: () => set({ showThought: false }),
  
  triggerMemory: (text: string) => {
    set({
      showMemory: true,
      memoryText: text,
    });
    setTimeout(() => get().hideMemory(), 5000);
  },
  
  hideMemory: () => set({ showMemory: false }),
  
  triggerSlowMotion: () => {
    set({ isSlowMotion: true, slowMotionTimer: 1.5 });
  },
  
  updateSlowMotion: (delta: number) => {
    const { isSlowMotion, slowMotionTimer } = get();
    if (isSlowMotion) {
      const newTimer = slowMotionTimer - delta;
      if (newTimer <= 0) {
        set({ isSlowMotion: false, slowMotionTimer: 0 });
      } else {
        set({ slowMotionTimer: newTimer });
      }
    }
  },
  
  // Debug
  toggleDebugCollisions: () => set((state) => ({ debugCollisions: !state.debugCollisions })),
}));
