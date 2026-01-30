import { create } from 'zustand';

export type GameState = 'title' | 'playing' | 'gameOver';
export type Lane = -1 | 0 | 1;

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
  
  // Speed
  speed: number;
  baseSpeed: number;
  
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
  
  // Scoring
  addScore: (points: number) => void;
  incrementDistance: (delta: number) => void;
  increaseSpeed: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: 'title',
  score: 0,
  distance: 0,
  highScore: 0,
  currentLane: 0,
  isJumping: false,
  isSliding: false,
  speed: 0.3,
  baseSpeed: 0.3,
  
  // Game flow actions
  startGame: () => set({
    gameState: 'playing',
    score: 0,
    distance: 0,
    currentLane: 0,
    isJumping: false,
    isSliding: false,
    speed: 0.3,
  }),
  
  endGame: () => {
    const { score, highScore } = get();
    set({
      gameState: 'gameOver',
      highScore: Math.max(score, highScore),
    });
  },
  
  resetGame: () => set({
    gameState: 'playing',
    score: 0,
    distance: 0,
    currentLane: 0,
    isJumping: false,
    isSliding: false,
    speed: 0.3,
  }),
  
  goToTitle: () => set({
    gameState: 'title',
    score: 0,
    distance: 0,
    currentLane: 0,
    isJumping: false,
    isSliding: false,
    speed: 0.3,
  }),
  
  // Movement actions
  moveLeft: () => set((state) => ({
    currentLane: Math.max(-1, state.currentLane - 1) as Lane,
  })),
  
  moveRight: () => set((state) => ({
    currentLane: Math.min(1, state.currentLane + 1) as Lane,
  })),
  
  jump: () => {
    const { isJumping, isSliding } = get();
    if (!isJumping && !isSliding) {
      set({ isJumping: true });
    }
  },
  
  slide: () => {
    const { isJumping, isSliding } = get();
    if (!isJumping && !isSliding) {
      set({ isSliding: true });
    }
  },
  
  endJump: () => set({ isJumping: false }),
  endSlide: () => set({ isSliding: false }),
  
  // Scoring
  addScore: (points) => set((state) => ({
    score: state.score + points,
  })),
  
  incrementDistance: (delta) => set((state) => ({
    distance: state.distance + delta * state.speed,
  })),
  
  increaseSpeed: () => set((state) => ({
    speed: Math.min(state.speed + 0.01, 0.8),
  })),
}));
