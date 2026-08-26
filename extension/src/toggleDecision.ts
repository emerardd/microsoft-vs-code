export type PanelState = 'missing' | 'active' | 'hidden';
export type ToggleAction = 'create' | 'leave' | 'reveal';

export function decideToggleAction(panelState: PanelState): ToggleAction {
  if (panelState === 'missing') return 'create';
  if (panelState === 'active') return 'leave';
  return 'reveal';
}
