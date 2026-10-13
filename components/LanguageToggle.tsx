import { t, type Lang } from '../utils/i18n';

const LANGS: { id: Lang; label: 'langEnBtn' | 'langZhBtn' }[] = [
  { id: 'en', label: 'langEnBtn' },
  { id: 'zh', label: 'langZhBtn' },
];

export default function LanguageToggle({ lang, onChange, stretch = false }: { lang: Lang; onChange: (lang: Lang) => void; stretch?: boolean }) {
  return (
    <div className="flex gap-2" role="group" aria-label={t('languageLabel')}>
      {LANGS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={lang === id}
          onClick={() => onChange(id)}
          className={`rounded px-3 py-1 font-mono text-xs transition-colors ${stretch ? 'flex-1 font-bold' : ''} ${
            lang === id ? 'bg-vsc-accent text-white' : 'bg-vsc-control text-gray-400 hover:bg-vsc-muted hover:text-white'
          }`}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}
