import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL for the app
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true // Allow access from mobile devices on same network
  },
  
  // PWA and static assets
  publicDir: 'public',
  
  // Environment variables
  envPrefix: 'VITE_',
  
  // For PWA service worker
  plugins: []
}) 