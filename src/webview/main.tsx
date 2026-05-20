import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import type { WebviewPayload } from './types';

declare global {
  interface Window {
    __APPSEC_SIDECAR_INITIAL_STATE__?: WebviewPayload;
  }
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App payload={window.__APPSEC_SIDECAR_INITIAL_STATE__} />
    </React.StrictMode>
  );
}
