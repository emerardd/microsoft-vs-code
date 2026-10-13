import type { SidebarView } from '../types';
import type { TranslationKey } from '../utils/i18n';

export type EditorDocument = 'GAME' | 'ENEMIES' | 'METADATA';
export type BottomPanel = 'PROBLEMS' | 'TERMINAL' | 'DEBUG' | 'OUTPUT';

export interface EditorDocumentInfo {
  label: string;
  icon: string;
  color: string;
  /** Path segments shown in the breadcrumbs, ending with the file itself. */
  path: string[];
}

/** One table drives the explorer tree, editor tabs and breadcrumbs so they cannot disagree. */
export const EDITOR_DOCUMENTS: Record<EditorDocument, EditorDocumentInfo> = {
  GAME: { label: 'game_loop.ts', icon: 'TS', color: '#cca700', path: ['src', 'game'] },
  ENEMIES: { label: 'enemies.json', icon: 'JSON', color: '#e06c75', path: ['src', 'data'] },
  METADATA: { label: 'metadata.json', icon: 'JSON', color: '#e06c75', path: [] },
};

export const EDITOR_DOCUMENT_ORDER: EditorDocument[] = ['GAME', 'ENEMIES', 'METADATA'];

/** The workspace folder name is the repository name, which is also the joke. */
export const WORKSPACE_FOLDER = 'MICROSOFT-VS-CODE';

export const SIDEBAR_TITLES: Record<SidebarView, TranslationKey> = {
  EXPLORER: 'sbExplorer',
  SEARCH: 'sbSearch',
  GIT: 'sbGit',
  DEBUG: 'sbDebug',
  EXTENSIONS: 'sbExtensions',
  SETTINGS: 'sbSettings',
};

export const SIDEBAR_INFO: Record<SidebarView, TranslationKey> = {
  EXPLORER: 'panelInfoExplorer',
  SEARCH: 'panelInfoSearch',
  GIT: 'panelInfoGit',
  DEBUG: 'panelInfoDebug',
  EXTENSIONS: 'panelInfoExtensions',
  SETTINGS: 'panelInfoSettings',
};

export const BOTTOM_PANELS: { id: BottomPanel; label: TranslationKey }[] = [
  { id: 'PROBLEMS', label: 'termProblems' },
  { id: 'TERMINAL', label: 'termTerminal' },
  { id: 'DEBUG', label: 'termDebug' },
  { id: 'OUTPUT', label: 'termOutput' },
];
