import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Forcing local port 5173 to ensure consistency with Electron Main process
export default defineConfig({
  base: './', // CRITICAL: This ensures local file paths (file://) work in Electron
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist'
  }
});
