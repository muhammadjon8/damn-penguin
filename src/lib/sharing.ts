// Social sharing functionality
import { trackShare } from './analytics';
import { getSessionId } from './session';

const GAME_URL = typeof window !== 'undefined' ? window.location.origin : 'https://damn-penguin.lovable.app';

const BIOME_EMOJI: Record<string, string> = {
  ice_plains: '❄️',
  ocean: '🌊',
  cliffs: '🏔️',
  mountain: '⛰️',
  peaks: '🏔️',
};

const BIOME_NAMES: Record<string, string> = {
  ice_plains: 'the Ice Plains',
  ocean: 'the Ocean',
  cliffs: 'the Cliffs',
  mountain: 'the Mountains',
  peaks: 'the Treacherous Peaks',
};

// Generate share text
export const generateShareText = (distance: number, biome: string, fish: number): string => {
  const emoji = BIOME_EMOJI[biome] || '❄️';
  const biomeName = BIOME_NAMES[biome] || biome;
  
  return `I traveled ${Math.floor(distance)}m through ${biomeName} in the lonely penguin's journey ${emoji}🐧\n\nCollected ${fish} memories along the way...\n\nBut why...? Can you beat my score?`;
};

// Generate challenge link
export const generateChallengeLink = (): string => {
  const sessionId = getSessionId();
  return `${GAME_URL}?ref=${sessionId}`;
};

// Share to Twitter/X
export const shareToTwitter = (distance: number, biome: string, fish: number): void => {
  const text = encodeURIComponent(generateShareText(distance, biome, fish));
  const url = encodeURIComponent(generateChallengeLink());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  trackShare('twitter');
};

// Share to WhatsApp
export const shareToWhatsApp = (distance: number, biome: string, fish: number): void => {
  const text = encodeURIComponent(`${generateShareText(distance, biome, fish)}\n\nPlay: ${generateChallengeLink()}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
  trackShare('whatsapp');
};

// Copy link to clipboard
export const copyShareLink = async (distance: number, biome: string, fish: number): Promise<boolean> => {
  try {
    const text = `${generateShareText(distance, biome, fish)}\n\nPlay: ${generateChallengeLink()}`;
    await navigator.clipboard.writeText(text);
    trackShare('copy');
    return true;
  } catch {
    return false;
  }
};

// Native share (mobile)
export const shareNative = async (distance: number, biome: string, fish: number): Promise<boolean> => {
  if (!navigator.share) return false;
  
  try {
    await navigator.share({
      title: 'But why...? - A Penguin\'s Journey',
      text: generateShareText(distance, biome, fish),
      url: generateChallengeLink(),
    });
    trackShare('native');
    return true;
  } catch {
    return false;
  }
};

// Check if native share is available
export const canNativeShare = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

// Mark that user has shared (for incentive)
export const markShared = (): void => {
  localStorage.setItem('penguin_has_shared', 'true');
};

// Check if user has shared
export const hasShared = (): boolean => {
  return localStorage.getItem('penguin_has_shared') === 'true';
};
