import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

export const useControls = () => {
  const { gameState, moveLeft, moveRight, jump, slide, endSlide } = useGameStore();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const slideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;

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
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        slide();
        // Auto end slide after 500ms
        if (slideTimeoutRef.current) {
          clearTimeout(slideTimeoutRef.current);
        }
        slideTimeoutRef.current = setTimeout(() => {
          endSlide();
        }, 500);
        break;
    }
  }, [gameState, moveLeft, moveRight, jump, slide, endSlide]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, [gameState]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing' || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    const minSwipeDistance = 30;

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
      } else if (deltaY > minSwipeDistance) {
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
  }, [gameState, moveLeft, moveRight, jump, slide, endSlide]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
      }
    };
  }, [handleKeyDown, handleTouchStart, handleTouchEnd]);
};
