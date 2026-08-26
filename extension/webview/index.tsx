import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../App';
import '../../index.css';

interface VsCodeApi {
  postMessage(message: { type: string }): void;
}

declare const acquireVsCodeApi: () => VsCodeApi;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

document.body.classList.add('vscode-webview');
const vscode = acquireVsCodeApi();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App
      embedded
      onRequestReturn={() => vscode.postMessage({ type: 'return-to-code' })}
    />
  </React.StrictMode>,
);

vscode.postMessage({ type: 'ready' });
