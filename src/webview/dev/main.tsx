import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '../app';
import type { VsCodeApi } from '../types';
import { getSamplePayload } from './sampleData';
import './theme.css';

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

const params = new URLSearchParams(window.location.search);
const theme = params.get('theme') === 'light' ? 'light' : 'dark';
const payload = getSamplePayload(params.get('view'));

document.documentElement.dataset.theme = theme;
window.acquireVsCodeApi = () => ({
  postMessage(message: unknown): void {
    console.log('[mock acquireVsCodeApi.postMessage]', message);
  }
});

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <DevShell>
        <App payload={payload} />
      </DevShell>
    </React.StrictMode>
  );
}

function DevShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const currentView = params.get('view') || 'findings';

  return (
    <>
      <nav className="dev-toolbar" aria-label="Webview preview controls">
        <a href="?view=findings">Findings</a>
        <a href="?view=inventory">Inventory</a>
        <a href="?view=empty">Empty findings</a>
        <a href="?view=empty-inventory">Empty inventory</a>
        <a href="?view=none">No payload</a>
        <span className="dev-spacer" />
        <a href={`?view=${encodeURIComponent(currentView)}&theme=dark`}>Dark</a>
        <a href={`?view=${encodeURIComponent(currentView)}&theme=light`}>Light</a>
      </nav>
      {children}
    </>
  );
}
