import { create } from 'zustand';

export type GameState = 'title' | 'playing' | 'gameOver';
export type Lane = -1 | 0 | 1;
export type WeatherType = 'clear' | 'light_snow' | 'blizzard' | 'foggy';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface GameStore {
  // Game state
  gameState: GameState;
  score: number;
  distance: number;
  highScore: number;
  
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
  
  // Milestones
  lastMilestone: number;
  showMilestone: boolean;
  milestoneText: string;
  
  // Narrative system
  showThought: boolean;
  thoughtText: string;
  thoughtsShown: number;
  showMemory: boolean;
  memoryText: string;
  isSlowMotion: boolean;
  slowMotionTimer: number;
  
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
  
  // Abilities
  updateAbilities: (delta: number) => void;
  
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
}

const COMBO_TIMEOUT = 2; // seconds
const BELLY_SLIDE_MAX = 3; // seconds
const BELLY_SLIDE_COOLDOWN = 5; // seconds
const MILESTONE_INTERVAL = 500; // meters

const TIME_CYCLE_DURATION = 150; // seconds for full day cycle
const WEATHER_CHANGE_INTERVAL = 45; // seconds between weather changes

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: 'title',
  score: 0,
  distance: 0,
  highScore: 0,
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
  
  // Game flow actions
  startGame: () => set({
    gameState: 'playing',
    score: 0,
    distance: 0,
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
  }),
  
  endGame: () => {
    const { score, highScore, maxCombo, comboCount } = get();
    set({
      gameState: 'gameOver',
      highScore: Math.max(score, highScore),
      maxCombo: Math.max(maxCombo, comboCount),
    });
  },
  
  resetGame: () => set({
    gameState: 'playing',
    score: 0,
    distance: 0,
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
  }),
  
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
    
    // Update time cycle
    const newTimeTransition = timeTransition + delta;
    const timePhase = (newTimeTransition / TIME_CYCLE_DURATION) % 1;
    
    let newTimeOfDay: TimeOfDay;
    if (timePhase < 0.25) newTimeOfDay = 'dawn';
    else if (timePhase < 0.5) newTimeOfDay = 'day';
    else if (timePhase < 0.75) newTimeOfDay = 'dusk';
    else newTimeOfDay = 'night';
    
    // Update weather randomly
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
  
  // Abilities
  updateAbilities: (delta) => {
    const { isBellySliding, bellySlideEnergy, bellySlideCooldown, speedBoostTimer, speed, baseSpeed } = get();
    
    let newEnergy = bellySlideEnergy;
    let newCooldown = bellySlideCooldown;
    let newSpeedBoost = speedBoostTimer;
    let newSpeed = speed;
    
    // Belly slide energy drain
    if (isBellySliding) {
      newEnergy = Math.max(0, bellySlideEnergy - delta);
      if (newEnergy <= 0) {
        get().endBellySlide();
      }
      newSpeed = Math.min(speed + 0.1, 0.6); // Speed boost during belly slide
    } else {
      // Regenerate energy when not sliding
      if (bellySlideCooldown <= 0) {
        newEnergy = Math.min(BELLY_SLIDE_MAX, bellySlideEnergy + delta * 0.5);
      }
    }
    
    // Cooldown reduction
    if (bellySlideCooldown > 0) {
      newCooldown = Math.max(0, bellySlideCooldown - delta);
    }
    
    // Speed boost from combo
    if (speedBoostTimer > 0) {
      newSpeedBoost = speedBoostTimer - delta;
      newSpeed = Math.min(baseSpeed + 0.15, 0.6);
    } else if (!isBellySliding) {
      newSpeed = baseSpeed + (get().distance / 5000) * 0.1; // Gradual speed increase
    }
    
    set({
      bellySlideEnergy: newEnergy,
      bellySlideCooldown: newCooldown,
      speedBoostTimer: newSpeedBoost,
      speed: Math.min(newSpeed, 0.7),
    });
  },
  
  // Milestones
  checkMilestone: () => {
    const { distance, lastMilestone } = get();
    const currentMilestone = Math.floor(distance / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
    
    if (currentMilestone > lastMilestone && currentMilestone > 0) {
      set({
        lastMilestone: currentMilestone,
        showMilestone: true,
        milestoneText: `${currentMilestone}m`,
      });
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        get().hideMilestone();
      }, 2000);
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
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      get().hideThought();
    }, 4000);
  },
  
  hideThought: () => set({ showThought: false }),
  
  triggerMemory: (text: string) => {
    set({
      showMemory: true,
      memoryText: text,
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      get().hideMemory();
    }, 5000);
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
}));
