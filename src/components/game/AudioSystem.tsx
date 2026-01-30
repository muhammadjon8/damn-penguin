import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { loadSettings } from './SettingsMenu';

// Audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Create oscillator-based sounds
const createTone = (
  frequency: number, 
  duration: number, 
  type: OscillatorType = 'sine',
  volume: number = 0.3
) => {
  const ctx = getAudioContext();
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
};

// Generate ambient wind sound using noise
const createWindNoise = (volume: number = 0.1) => {
  const ctx = getAudioContext();
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  
  // Low-pass filter for wind-like sound
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  
  whiteNoise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  return { source: whiteNoise, gain: gainNode, filter };
};

// Create melancholic background melody
const createMelancholicMelody = (volume: number = 0.15) => {
  const ctx = getAudioContext();
  
  // Melancholic minor key notes (A minor pentatonic with extensions)
  const melancholyNotes = [
    220.00,  // A3
    261.63,  // C4
    293.66,  // D4
    329.63,  // E4
    392.00,  // G4
    440.00,  // A4
    523.25,  // C5
  ];
  
  const playNote = (noteIndex: number, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(melancholyNotes[noteIndex], startTime);
    
    // Soft attack and release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.3);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };
  
  // Simple melancholic melody pattern
  const pattern = [0, 2, 4, 3, 1, 0, 2, 1, 0, 3, 4, 5, 4, 2, 0, 1];
  const noteDuration = 1.5;
  let time = ctx.currentTime;
  
  pattern.forEach((noteIndex, i) => {
    playNote(noteIndex, time + i * noteDuration, noteDuration * 0.9);
  });
  
  return pattern.length * noteDuration;
};

// Sound effect functions
export const playCollectSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.4;
  
  // Pleasant chime for collecting fish
  createTone(523.25, 0.15, 'sine', volume);
  setTimeout(() => createTone(659.25, 0.15, 'sine', volume * 0.7), 50);
  setTimeout(() => createTone(783.99, 0.2, 'sine', volume * 0.5), 100);
};

export const playSpecialCollectSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.5;
  
  // Magical sparkle for special fish
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, i) => {
    setTimeout(() => createTone(freq, 0.3, 'sine', volume * (1 - i * 0.15)), i * 80);
  });
};

export const playJumpSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.3;
  
  // Quick whoosh for jump
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
};

export const playSlideSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.2;
  
  // Low swoosh for sliding
  createTone(100, 0.3, 'triangle', volume);
};

export const playCollisionSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.4;
  
  // Impact thud
  createTone(80, 0.2, 'square', volume);
  setTimeout(() => createTone(60, 0.15, 'square', volume * 0.5), 50);
};

export const playMilestoneSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.3;
  
  // Achievement fanfare
  const notes = [392, 440, 523.25, 659.25];
  notes.forEach((freq, i) => {
    setTimeout(() => createTone(freq, 0.4, 'sine', volume), i * 150);
  });
};

export const playBiomeTransitionSound = () => {
  const settings = loadSettings();
  const volume = settings.sfxVolume / 100 * 0.25;
  
  // Atmospheric transition sound
  createTone(220, 1.5, 'sine', volume);
  setTimeout(() => createTone(330, 1.2, 'sine', volume * 0.6), 200);
  setTimeout(() => createTone(440, 1, 'sine', volume * 0.4), 400);
};

// Background music manager
export const useBackgroundMusic = () => {
  const windRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null>(null);
  const melodyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { gameState } = useGameStore();
  
  const startMusic = useCallback(() => {
    const settings = loadSettings();
    const musicVolume = settings.musicVolume / 100;
    
    if (musicVolume === 0) return;
    
    try {
      // Start ambient wind
      if (!windRef.current) {
        windRef.current = createWindNoise(musicVolume * 0.15);
        windRef.current.source.start();
      }
      
      // Start melancholic melody loop
      const melodyDuration = createMelancholicMelody(musicVolume * 0.12);
      
      melodyIntervalRef.current = setInterval(() => {
        const currentSettings = loadSettings();
        if (currentSettings.musicVolume > 0) {
          createMelancholicMelody(currentSettings.musicVolume / 100 * 0.12);
        }
      }, melodyDuration * 1000 + 2000); // Add 2 second pause between loops
      
    } catch {
      console.log('Audio not available');
    }
  }, []);
  
  const stopMusic = useCallback(() => {
    if (windRef.current) {
      try {
        windRef.current.source.stop();
      } catch {}
      windRef.current = null;
    }
    
    if (melodyIntervalRef.current) {
      clearInterval(melodyIntervalRef.current);
      melodyIntervalRef.current = null;
    }
  }, []);
  
  const updateVolume = useCallback(() => {
    const settings = loadSettings();
    const musicVolume = settings.musicVolume / 100;
    
    if (windRef.current) {
      windRef.current.gain.gain.value = musicVolume * 0.15;
    }
  }, []);
  
  useEffect(() => {
    if (gameState === 'playing') {
      // Resume audio context if suspended
      getAudioContext().resume();
      startMusic();
    } else {
      stopMusic();
    }
    
    return () => stopMusic();
  }, [gameState, startMusic, stopMusic]);
  
  return { updateVolume };
};

// Audio System Component
export const AudioSystem = () => {
  const { gameState, currentBiome, showMilestone } = useGameStore();
  const prevBiomeRef = useRef(currentBiome);
  const prevMilestoneRef = useRef(showMilestone);
  
  // Initialize background music
  useBackgroundMusic();
  
  // Play biome transition sound
  useEffect(() => {
    if (gameState === 'playing' && prevBiomeRef.current !== currentBiome) {
      playBiomeTransitionSound();
      prevBiomeRef.current = currentBiome;
    }
  }, [currentBiome, gameState]);
  
  // Play milestone sound
  useEffect(() => {
    if (showMilestone && !prevMilestoneRef.current) {
      playMilestoneSound();
    }
    prevMilestoneRef.current = showMilestone;
  }, [showMilestone]);
  
  return null;
};
