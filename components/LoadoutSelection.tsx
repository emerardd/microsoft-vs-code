import { getMetaProgress, isLoadoutUnlocked, type Loadout, type MetaProfile } from '../game/metaProgression';
import { t } from '../utils/i18n';

export default function LoadoutSelection({ profile, selected, onChange }: {
  profile: MetaProfile; selected: Loadout; onChange: (loadout: Loadout) => void;
}) {
  const progress = getMetaProgress(profile);
  return <fieldset className="mb-4 w-full max-w-2xl border-y border-[#454545] py-3 text-left">
    <legend className="px-2 text-sm text-[#9cdcfe]">{t('loadoutTitle')}</legend>
    <p className="mb-3 text-xs leading-5 text-gray-300">{t('metaSummary', { waves: progress.waves, wins: progress.wins, hp: progress.bonusHp })}</p>
    <div className="grid gap-2 sm:grid-cols-3">
      {(['standard', 'spread', 'pierce'] as const).map(id => {
        const unlocked = isLoadoutUnlocked(profile, id);
        return <label key={id} className={`flex cursor-pointer items-start gap-2 border p-3 text-xs leading-5 ${selected === id ? 'border-[#007acc] bg-[#094771]/40' : 'border-[#454545] bg-[#252526]'} ${unlocked ? '' : 'cursor-not-allowed text-gray-500'}`}>
          <input className="mt-1 accent-[#007acc]" type="radio" name="loadout" value={id} checked={selected === id} disabled={!unlocked} onChange={() => onChange(id)} />
          <span><strong className="block">{t(`loadout_${id}`)}</strong>{t(`loadout_${id}_desc`)}
          {!unlocked && <span className="block text-[#dcdcaa]">{t(id === 'spread' ? 'unlockSpread' : 'unlockPierce')}</span>}</span>
        </label>;
      })}
    </div>
    <p className="mt-2 text-xs leading-5 text-gray-400">{t('metaHpRule')}</p>
  </fieldset>;
}
