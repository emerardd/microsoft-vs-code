import React from 'react';
import { t } from '../utils/i18n';

export type TouchControlCode =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Space'
  | 'KeyR';

interface TouchControlsProps {
  onControlChange: (code: TouchControlCode, pressed: boolean) => void;
  onPauseToggle: () => void;
  paused: boolean;
}

interface HoldButtonProps {
  code: TouchControlCode;
  label: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onControlChange: TouchControlsProps['onControlChange'];
}

const HoldButton = ({
  code,
  label,
  ariaLabel,
  className = '',
  disabled = false,
  onControlChange,
}: HoldButtonProps) => {
  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onControlChange(code, false);
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={`touch-key flex items-center justify-center border border-[#5a5a5a] bg-[#252526]/95 text-sm font-bold text-white shadow-lg shadow-black/40 active:border-[#9cdcfe] active:bg-[#094771] disabled:opacity-35 ${className}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onControlChange(code, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => onControlChange(code, false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {label}
    </button>
  );
};

const TouchControls = ({ onControlChange, onPauseToggle, paused }: TouchControlsProps) => (
  <div className="touch-controls pointer-events-none z-40 md:hidden">
    <div
      className="touch-movement pointer-events-auto grid grid-cols-3 grid-rows-2 gap-1"
      role="group"
      aria-label={t('touchMove')}
    >
      <HoldButton
        code="ArrowUp"
        label="↑"
        ariaLabel={`${t('touchMove')}: ↑`}
        className="col-start-2 h-12 w-12 rounded-t-lg"
        disabled={paused}
        onControlChange={onControlChange}
      />
      <HoldButton
        code="ArrowLeft"
        label="←"
        ariaLabel={`${t('touchMove')}: ←`}
        className="col-start-1 row-start-2 h-12 w-12 rounded-l-lg"
        disabled={paused}
        onControlChange={onControlChange}
      />
      <HoldButton
        code="ArrowDown"
        label="↓"
        ariaLabel={`${t('touchMove')}: ↓`}
        className="col-start-2 row-start-2 h-12 w-12 rounded-b-lg"
        disabled={paused}
        onControlChange={onControlChange}
      />
      <HoldButton
        code="ArrowRight"
        label="→"
        ariaLabel={`${t('touchMove')}: →`}
        className="col-start-3 row-start-2 h-12 w-12 rounded-r-lg"
        disabled={paused}
        onControlChange={onControlChange}
      />
    </div>

    <button
      type="button"
      className="touch-pause pointer-events-auto flex h-11 min-w-11 items-center justify-center rounded-md border border-[#5a5a5a] bg-[#252526]/95 px-3 text-base font-bold text-[#dcdcaa] shadow-lg shadow-black/40 active:border-[#dcdcaa] active:bg-[#3c3c3c]"
      aria-label={paused ? t('touchResume') : t('touchPause')}
      onClick={onPauseToggle}
    >
      {paused ? '▶' : 'Ⅱ'}
    </button>

    <div className="touch-actions pointer-events-auto flex items-end gap-2">
      <HoldButton
        code="KeyR"
        label="R"
        ariaLabel={t('touchRefactor')}
        className="h-14 w-14 rounded-full border-[#c586c0] text-[#e8c7e8]"
        disabled={paused}
        onControlChange={onControlChange}
      />
      <HoldButton
        code="Space"
        label="</>"
        ariaLabel={t('touchShoot')}
        className="h-[4.5rem] w-[4.5rem] rounded-full border-[#007acc] bg-[#094771]/95 text-[#9cdcfe]"
        disabled={paused}
        onControlChange={onControlChange}
      />
    </div>
  </div>
);

export default TouchControls;
