import { useState, type ComponentProps } from 'react';
import { t } from '../utils/i18n';
import WorkbenchSidebar from './WorkbenchSidebar';
import { SIDEBAR_INFO, SIDEBAR_TITLES } from './workbenchTypes';

type SidebarContentProps = ComponentProps<typeof WorkbenchSidebar>;

interface Props {
  content: SidebarContentProps;
  onHide: () => void;
  onNotice: (text: string) => void;
}

/** Desktop side bar: a title row with VS Code's "..." view menu above the active view. */
export function DesktopSidebar({ content, onHide, onNotice }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <aside className="desktop-sidebar relative hidden w-64 shrink-0 flex-col border-r border-vsc-editor bg-vsc-sidebar md:flex">
      <div className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
        <span>{t(SIDEBAR_TITLES[content.sidebarView])}</span>
        <button
          type="button"
          className="px-1 text-lg leading-3 hover:text-white"
          aria-label={t('sidebarActions')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          ...
        </button>
      </div>
      {menuOpen && (
        <div className="absolute right-2 top-9 z-40 min-w-44 border border-vsc-widget bg-vsc-sidebar py-1 text-xs text-gray-200 shadow-xl" role="menu">
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-vsc-selection"
            onClick={() => { onNotice(t(SIDEBAR_INFO[content.sidebarView])); setMenuOpen(false); }}
          >
            {t('describePanel')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-vsc-selection"
            onClick={() => { setMenuOpen(false); onHide(); }}
          >
            {t('closeSidebar')}
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <WorkbenchSidebar {...content} />
      </div>
    </aside>
  );
}

/** Small-screen and touch drawer with the same content. */
export function SidebarDrawer({ content, onClose }: { content: SidebarContentProps; onClose: () => void }) {
  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-backdrop absolute inset-0 z-[60] bg-black/50 md:hidden"
        aria-label={t('closeSidebar')}
        onClick={onClose}
      />
      <aside className="mobile-sidebar-drawer absolute bottom-0 left-0 top-0 z-[70] flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-vsc-widget bg-vsc-sidebar shadow-2xl md:hidden">
        <div className="flex items-center justify-between border-b border-vsc-control px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
          <span>{t(SIDEBAR_TITLES[content.sidebarView])}</span>
          <button
            type="button"
            className="px-2 py-1 text-lg leading-none text-gray-400 hover:text-white"
            aria-label={t('closeSidebar')}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <WorkbenchSidebar {...content} />
        </div>
      </aside>
    </>
  );
}
