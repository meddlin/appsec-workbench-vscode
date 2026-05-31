import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: true,
    outDir: 'media/webview',
    sourcemap: true,
    rollupOptions: {
      input: 'src/webview/main.tsx',
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some((name) => name.endsWith('.css'))) {
            return 'assets/webview.css';
          }

          return 'assets/[name][extname]';
        },
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/webview.js'
      }
    }
  }
});
