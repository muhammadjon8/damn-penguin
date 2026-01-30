import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { playJumpSound, playSlideSound } from '@/components/game/AudioSystem';

export const useControls = () => {
  const { 
    gameState, 
    moveLeft, 
    moveRight, 
    jump, 
    slide, 
    endSlide,
    startBellySlide,
    endBellySlide,
    isBellySliding,
  } = useGameStore();
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const slideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bellySlideHeldRef = useRef(false);
  const keyHeldRef = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    
    // Prevent repeat events for held keys
    if (keyHeldRef.current.has(e.key)) return;
    keyHeldRef.current.add(e.key);

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        moveRight();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        e.preventDefault();
        jump();
        playJumpSound();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        // Start belly slide on hold
        startBellySlide();
        bellySlideHeldRef.current = true;
        playSlideSound();
        break;
    }
  }, [gameState, moveLeft, moveRight, jump, startBellySlide]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keyHeldRef.current.delete(e.key);
    
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (bellySlideHeldRef.current) {
        endBellySlide();
        bellySlideHeldRef.current = false;
      }
    }
  }, [endBellySlide]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, [gameState]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing' || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    const holdTime = Date.now() - touchStartRef.current.time;
    
    // Start belly slide if held down for 200ms and swiped down
    if (deltaY > 50 && holdTime > 200 && !bellySlideHeldRef.current) {
      startBellySlide();
      bellySlideHeldRef.current = true;
    }
  }, [gameState, startBellySlide]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing' || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const holdTime = Date.now() - touchStartRef.current.time;

    const minSwipeDistance = 30;

    // End belly slide if it was active
    if (bellySlideHeldRef.current) {
      endBellySlide();
      bellySlideHeldRef.current = false;
      touchStartRef.current = null;
      return;
    }

    // Determine if horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > minSwipeDistance) {
        moveRight();
      } else if (deltaX < -minSwipeDistance) {
        moveLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY < -minSwipeDistance) {
        jump();
      } else if (deltaY > minSwipeDistance && holdTime < 200) {
        // Quick swipe down = normal slide
        slide();
        if (slideTimeoutRef.current) {
          clearTimeout(slideTimeoutRef.current);
        }
        slideTimeoutRef.current = setTimeout(() => {
          endSlide();
        }, 500);
      }
    }

    touchStartRef.current = null;
  }, [gameState, moveLeft, moveRight, jump, slide, endSlide, endBellySlide]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
      }
      keyHeldRef.current.clear();
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd]);
};
