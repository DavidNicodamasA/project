import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import { spawn } from 'child_process';

function autoStartBackendPlugin() {
  let serverProcess = null;
  return {
    name: 'auto-start-backend',
    configureServer() {
      const checkReq = http.get('http://127.0.0.1:5000/api/v1/health', () => {
        // Backend is already running
      });
      checkReq.on('error', () => {
        console.log('[HandyPro] Backend server is not running on port 5000. Launching server/index.js...');
        serverProcess = spawn('node', ['server/index.js'], {
          stdio: 'inherit',
          shell: true,
        });
      });
    },
    buildEnd() {
      if (serverProcess) {
        serverProcess.kill();
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), autoStartBackendPlugin()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});