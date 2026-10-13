import type { ComponentType } from 'react';
import type { SidebarView } from '../types';
import { t, type TranslationKey } from '../utils/i18n';
import vscodeLogo from '../vscode.png';
import { DebugIcon, ExtensionsIcon, FilesIcon, GitIcon, SearchIcon, SettingsIcon } from './icons';

const ITEMS: { view: SidebarView; Icon: ComponentType; tooltip: TranslationKey }[] = [
  { view: 'EXPLORER', Icon: FilesIcon, tooltip: 'ttExplorer' },
  { view: 'SEARCH', Icon: SearchIcon, tooltip: 'ttSearch' },
  { view: 'GIT', Icon: GitIcon, tooltip: 'ttGit' },
  { view: 'DEBUG', Icon: DebugIcon, tooltip: 'ttDebug' },
  { view: 'EXTENSIONS', Icon: ExtensionsIcon, tooltip: 'ttExtensions' },
];

function ActivityButton({ active, label, onClick, Icon }: { active: boolean; label: string; onClick: () => void; Icon: ComponentType }) {
  return (
    <div className="group relative flex w-full justify-center">
      {active && <div className="absolute bottom-1 left-0 top-1 w-0.5 bg-white" />}
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        className={`p-2.5 transition-colors ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        onClick={onClick}
      >
        <Icon />
      </button>
      <div className="pointer-events-none absolute left-12 top-2 z-50 whitespace-nowrap rounded border border-vsc-widget bg-black px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity delay-75 group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </div>
    </div>
  );
}

export default function ActivityBar({ sidebarView, sidebarVisible, onSelect }: {
  sidebarView: SidebarView;
  sidebarVisible: boolean;
  onSelect: (view: SidebarView) => void;
}) {
  return (
    <nav className="activity-bar z-[80] hidden w-12 shrink-0 flex-col items-center gap-2 border-r border-vsc-sidebar bg-vsc-activity py-2 md:z-10 md:flex md:w-14">
      <img src={vscodeLogo} alt="VS Code" className="mb-4 mt-2 h-9 w-9 md:h-10 md:w-10" />
      {ITEMS.map(({ view, Icon, tooltip }) => (
        <ActivityButton key={view} active={sidebarVisible && sidebarView === view} label={t(tooltip)} Icon={Icon} onClick={() => onSelect(view)} />
      ))}
      <div className="mt-auto w-full pb-2">
        <ActivityButton active={sidebarVisible && sidebarView === 'SETTINGS'} label={t('ttSettings')} Icon={SettingsIcon} onClick={() => onSelect('SETTINGS')} />
      </div>
    </nav>
  );
}
