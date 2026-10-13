import { useEffect } from 'react';
import { t } from '../utils/i18n';

const AUTO_DISMISS_MS = 6000;

/** VS Code-style toast in the bottom-right corner; it dismisses itself like the real one. */
export default function Notification({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      className="absolute bottom-9 right-3 z-[90] w-[min(22rem,calc(100vw-4rem))] border border-vsc-widget border-l-2 border-l-vsc-accent bg-vsc-sidebar p-3 text-xs text-gray-200 shadow-2xl"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 font-semibold text-syntax-variable">ⓘ {t('noticeTitle')}</div>
          <p className="leading-relaxed text-gray-300">{message}</p>
        </div>
        <button
          type="button"
          className="px-1 text-lg leading-none text-gray-500 hover:text-white"
          aria-label={t('dismissNotice')}
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
