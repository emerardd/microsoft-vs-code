export interface Settings { sensitivity: number; muted: boolean }
const KEY = 'VSCODE_GAME_SETTINGS_V1';

export function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      sensitivity: typeof value?.sensitivity === 'number' && Number.isFinite(value.sensitivity)
        ? Math.max(0.5, Math.min(2, value.sensitivity)) : 1,
      muted: value?.muted === true,
    };
  } catch { return { sensitivity: 1, muted: false }; }
}

export function writeSettings(settings: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Session still works. */ }
}
