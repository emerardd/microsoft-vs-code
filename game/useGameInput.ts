import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { GameState } from '../types';
import { shouldTogglePause } from '../utils/gameLogic';

interface KeyStateRef {
  current: Set<string>;
}

function shouldIgnoreKeyboardEvent(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    tagName === 'BUTTON'
  );
}

export function setControlPressed(keysRef: KeyStateRef, code: string, pressed: boolean): void {
  if (pressed) {
    keysRef.current.add(code);
  } else {
    keysRef.current.delete(code);
  }
}

export function useGameInput(
  keysRef: KeyStateRef,
  setGameState: Dispatch<SetStateAction<GameState>>,
  active = true,
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!active || shouldIgnoreKeyboardEvent(event.target)) return;

      if (shouldTogglePause(event.code, event.repeat)) {
        setGameState(previous => {
          if (previous === GameState.PLAYING) return GameState.PAUSED;
          if (previous === GameState.PAUSED) return GameState.PLAYING;
          return previous;
        });
      }

      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
      keysRef.current.add(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };

    const clearKeys = () => keysRef.current.clear();
    if (!active) {
      clearKeys();
      setGameState(previous => previous === GameState.PLAYING ? GameState.PAUSED : previous);
    }
    const pauseWhenHidden = () => {
      if (document.visibilityState !== 'hidden') return;
      clearKeys();
      setGameState(previous => (
        previous === GameState.PLAYING ? GameState.PAUSED : previous
      ));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', pauseWhenHidden);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, [active, keysRef, setGameState]);
}
