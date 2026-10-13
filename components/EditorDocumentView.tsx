import { ENEMY_TYPES } from '../constants';
import { t } from '../utils/i18n';
import type { SidebarView } from '../types';
import type { EditorDocument } from './workbenchTypes';
import { useGameStats, type StatsStore } from '../game/statsStore';
import vscodeLogo from '../vscode.png';
import { formatNumber } from '../utils/format';
interface Props { store: StatsStore; activeDocument: EditorDocument | null; highScore: number; openDocument: (document: EditorDocument) => void; handleSidebarSelect: (view: SidebarView) => void }
export default function EditorDocumentView({store, activeDocument, highScore, openDocument, handleSidebarSelect}: Props) {
 const stats = useGameStats(store);

    if (activeDocument === 'ENEMIES') {
      return (
        <div className="h-full overflow-y-auto bg-vsc-editor px-5 py-6 text-sm md:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 border-l-2 border-syntax-json pl-4">
              <div className="text-xs uppercase tracking-[0.2em] text-syntax-json">{t('enemyFileEyebrow')}</div>
              <h2 className="mt-1 text-xl font-semibold text-white">{t('enemyFileTitle')}</h2>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-gray-400">{t('enemyFileDesc')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {ENEMY_TYPES.map((enemy, index) => (
                <article key={enemy.type} className="border border-vsc-control bg-vsc-sidebar p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <span className="mr-2 select-none text-gray-600">{String(index + 1).padStart(2, '0')}</span>
                      <span className="font-bold" style={{ color: enemy.color }}>{enemy.type}</span>
                    </div>
                    <span className="text-lg text-white">{enemy.text}</span>
                  </div>
                  <div className="mb-2 font-mono text-[11px] text-syntax-variable">
                    HP <span className="text-syntax-number">{enemy.hp}</span>
                    <span className="mx-2 text-gray-600">·</span>
                    PTS <span className="text-syntax-number">{enemy.score}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-400">{t(enemy.descKey)}</p>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="mt-6 bg-vsc-button px-4 py-2 text-xs font-semibold text-white hover:bg-vsc-button-hover"
              onClick={() => openDocument('GAME')}
            >
              {t('returnToGame')}
            </button>
          </div>
        </div>
      );
    }

    if (activeDocument === 'METADATA') {
      const metadataRows = [
        [t('metadataVersion'), '3.2.0'],
        [t('metadataMode'), t('metadataModeValue')],
        [t('metadataWave'), `v${stats.wave}.0`],
        [t('metadataScore'), formatNumber(stats.score)],
        [t('metadataHighScore'), formatNumber(highScore)],
      ];
      return (
        <div className="h-full overflow-y-auto bg-vsc-editor px-5 py-6 text-sm md:px-10">
          <div className="mx-auto max-w-3xl border border-vsc-control bg-vsc-sidebar">
            <div className="border-b border-vsc-control px-5 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-syntax-string">{t('metadataEyebrow')}</div>
              <h2 className="mt-1 text-xl font-semibold text-white">{t('metadataTitle')}</h2>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">{t('metadataDesc')}</p>
            </div>
            <dl className="divide-y divide-vsc-activity">
              {metadataRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[minmax(8rem,0.45fr)_1fr] gap-4 px-5 py-3">
                  <dt className="text-syntax-variable">"{label}"</dt>
                  <dd className="break-words text-syntax-string">"{value}"</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-vsc-control px-5 py-4">
              <button
                type="button"
                className="bg-vsc-button px-4 py-2 text-xs font-semibold text-white hover:bg-vsc-button-hover"
                onClick={() => openDocument('GAME')}
              >
                {t('returnToGame')}
              </button>
              <button
                type="button"
                className="border border-vsc-muted px-4 py-2 text-xs font-semibold text-gray-200 hover:border-syntax-variable hover:text-white"
                onClick={() => handleSidebarSelect('SETTINGS')}
              >
                {t('openSettings')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeDocument === null) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-vsc-editor p-6 text-center">
          <img src={vscodeLogo} alt="VS Code" className="mb-5 h-16 w-16 opacity-30" />
          <h2 className="text-lg font-semibold text-gray-300">{t('emptyEditorTitle')}</h2>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-gray-500">{t('emptyEditorDesc')}</p>
          <button
            type="button"
            className="mt-5 border border-vsc-muted px-4 py-2 text-xs text-gray-200 hover:border-syntax-variable hover:text-white"
            onClick={() => handleSidebarSelect('EXPLORER')}
          >
            {t('openExplorer')}
          </button>
        </div>
      );
    }

    return null;
  }
