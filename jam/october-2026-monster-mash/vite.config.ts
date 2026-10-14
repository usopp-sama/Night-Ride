import { defineConfig } from 'vite';

// Self-contained relative assets; no storage, external CDN, threads, or host-header assumptions.
// RUN SDK integration is deliberately deferred until a hosted compatibility probe.
export default defineConfig({
  base: './',
  build: { target: 'es2022', rollupOptions: { input: { atlas: 'index.html', drive: 'drive.html', world: 'world.html' } } },
  // Listen on the home LAN so other devices can join the local preview.
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
});

