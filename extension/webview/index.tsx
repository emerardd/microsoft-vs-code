import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../App';
import type { Checkpoint } from '../../game/checkpoint';
import type { MetaProfile } from '../../game/metaProgression';
import '../../index.css';

interface VsCodeApi {
  getState(): { checkpoint?: unknown } | undefined;
  setState(state: { checkpoint: Checkpoint | null }): void;
  postMessage(message: { type: string; profile?: MetaProfile; requestId?: string }): void;
}

declare const acquireVsCodeApi: () => VsCodeApi;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

document.body.classList.add('vscode-webview');
const vscode = acquireVsCodeApi();

const root = ReactDOM.createRoot(rootElement);
let mounted = false;
const pending = new Map<string, { resolve: () => void; reject: () => void }>();
function saveProfile(profile: MetaProfile): Promise<void> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('Profile save timed out')); }, 15000);
    pending.set(requestId, {
      resolve: () => { clearTimeout(timer); resolve(); },
      reject: () => { clearTimeout(timer); reject(new Error('Profile save failed')); },
    });
    vscode.postMessage({ type: 'save-profile', profile, requestId });
  });
}
// This bootstrap entry owns the root and host handshake, not a refreshable component module.
// eslint-disable-next-line react-refresh/only-export-components
function HostGame({ profile }: { profile: unknown }) {
  useEffect(() => { vscode.postMessage({ type: 'game-mounted' }); }, []);
  return <App initialProfile={profile} onProfileChange={saveProfile}
    initialCheckpoint={vscode.getState()?.checkpoint}
    onCheckpoint={checkpoint => vscode.setState({ checkpoint })}
    embedded onRequestReturn={() => vscode.postMessage({ type: 'return-to-code' })} />;
}
window.addEventListener('message', event => {
  const message = event.data;
  if (message?.type === 'profile-saved') {
    const request = pending.get(message.requestId);
    pending.delete(message.requestId);
    if (message.ok) request?.resolve(); else request?.reject();
  }
  if (message?.type !== 'profile-loaded' || mounted) return;
  mounted = true;
  root.render(
  <React.StrictMode>
    <HostGame profile={message.profile} />
  </React.StrictMode>,
);
});

vscode.postMessage({ type: 'ready' });
