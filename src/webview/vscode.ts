import type { VsCodeApi } from './types';

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

let api: VsCodeApi | undefined;

export function getVsCodeApi(): VsCodeApi | undefined {
  if (!api && window.acquireVsCodeApi) {
    api = window.acquireVsCodeApi();
  }

  return api;
}

export function openExternal(url: string | null | undefined): void {
  if (!url || !url.startsWith('https://')) {
    return;
  }

  getVsCodeApi()?.postMessage({
    type: 'openExternal',
    url
  });
}
