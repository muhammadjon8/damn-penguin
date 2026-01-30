import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { loadSettings } from './SettingsMenu';

// Audio context singleton
let audioContext: AudioContext | null = null;
let audioInitialized = false;

const getAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      console.log('Audio not supported');
    }
  }
  return audioContext;
};

// Initialize audio on user interaction
export const initAudio = () => {
  if (audioInitialized) return;
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    ctx.resume();
  }
  audioInitialized = true;
};

// Simple sound effects using pre-configured settings
const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) => {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors
  }
};

// Sound effect functions - simplified
export const playCollectSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.3;
  playTone(523.25, 0.12, 'sine', volume);
};

export const playSpecialCollectSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.4;
  playTone(659.25, 0.2, 'sine', volume);
  setTimeout(() => playTone(783.99, 0.2, 'sine', volume * 0.7), 100);
};

export const playJumpSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.2;
  playTone(200, 0.1, 'sine', volume);
};

export const playSlideSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.15;
  playTone(100, 0.2, 'triangle', volume);
};

export const playCollisionSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.3;
  playTone(80, 0.15, 'square', volume);
};

export const playMilestoneSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.25;
  playTone(523.25, 0.3, 'sine', volume);
};

export const playBiomeTransitionSound = () => {
  const settings = loadSettings();
  if (settings.sfxVolume === 0) return;
  const volume = settings.sfxVolume / 100 * 0.2;
  playTone(330, 0.5, 'sine', volume);
};

// Simple background music - just ambient wind
export const useBackgroundMusic = () => {
  const windRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const { gameState } = useGameStore();
  
  const startMusic = useCallback(() => {
    const settings = loadSettings();
    const musicVolume = settings.musicVolume / 100;
    if (musicVolume === 0) return;
    
    const ctx = getAudioContext();
    if (!ctx || windRef.current) return;
    
    try {
      // Create simple wind noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = musicVolume * 0.08;
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      whiteNoise.start();
      windRef.current = { source: whiteNoise, gain: gainNode };
    } catch {
      // Ignore errors
    }
  }, []);
  
  const stopMusic = useCallback(() => {
    if (windRef.current) {
      try {
        windRef.current.source.stop();
      } catch {}
      windRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (gameState === 'playing') {
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [gameState, startMusic, stopMusic]);
};

// Audio System Component - minimal
export const AudioSystem = () => {
  const { gameState, currentBiome } = useGameStore();
  const prevBiomeRef = useRef(currentBiome);
  
  useBackgroundMusic();
  
  // Biome transition sound
  useEffect(() => {
    if (gameState === 'playing' && prevBiomeRef.current !== currentBiome) {
      playBiomeTransitionSound();
      prevBiomeRef.current = currentBiome;
    }
  }, [currentBiome, gameState]);
  
  return null;
};
