import { t } from '../utils/i18n';
import { EDITOR_DOCUMENTS, type EditorDocument } from './workbenchTypes';

interface Props {
  openDocuments: EditorDocument[];
  activeDocument: EditorDocument | null;
  mobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onOpen: (document: EditorDocument) => void;
  onClose: (document: EditorDocument) => void;
}

export function EditorTabs({ openDocuments, activeDocument, mobileSidebarOpen, onToggleMobileSidebar, onOpen, onClose }: Props) {
  return (
    <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-vsc-editor bg-vsc-sidebar">
      <button
        type="button"
        className="mobile-menu-button flex h-full w-11 shrink-0 items-center justify-center border-r border-vsc-editor text-gray-400 hover:bg-vsc-hover hover:text-white md:hidden"
        aria-label={t('ttExplorer')}
        aria-expanded={mobileSidebarOpen}
        onClick={onToggleMobileSidebar}
      >
        <span className="text-xl leading-none" aria-hidden="true">☰</span>
      </button>
      <div role="tablist" className="flex h-full">
        {openDocuments.map(document => {
          const details = EDITOR_DOCUMENTS[document];
          const active = activeDocument === document;
          return (
            <div
              key={document}
              className={`group flex h-full min-w-fit items-center border-r border-vsc-editor text-sm ${
                active ? 'border-t border-t-vsc-accent bg-vsc-editor text-white' : 'bg-vsc-tab text-gray-400 hover:bg-vsc-hover'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="flex h-full items-center py-0 pl-4 pr-2"
                onClick={event => { onOpen(document); event.currentTarget.blur(); }}
              >
                <span className="mr-2" style={{ color: details.color }}>{details.icon}</span>
                {details.label}
              </button>
              <button
                type="button"
                className={`mr-2 px-1 text-gray-500 hover:bg-vsc-control hover:text-white group-hover:opacity-100 ${active ? 'opacity-100' : 'opacity-0 focus:opacity-100'}`}
                aria-label={t('closeDocument', { name: details.label })}
                onClick={() => onClose(document)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Breadcrumbs({ activeDocument }: { activeDocument: EditorDocument | null }) {
  const details = activeDocument ? EDITOR_DOCUMENTS[activeDocument] : null;
  return (
    <div className="editor-breadcrumbs hidden h-6 shrink-0 items-center gap-1 border-b border-vsc-editor bg-vsc-editor px-4 text-xs text-gray-500 sm:flex">
      {details ? (
        <>
          {details.path.map(segment => <span key={segment}>{segment} ›</span>)}
          <span style={{ color: details.color }}>{details.label}</span>
          {activeDocument === 'GAME' && (
            <span className="flex items-center text-syntax-func">
              <span className="mx-1 text-gray-500">›</span>
              <span className="mr-1 text-syntax-control">function</span>gameLoop()
            </span>
          )}
        </>
      ) : (
        <span>{t('noOpenEditors')}</span>
      )}
    </div>
  );
}
