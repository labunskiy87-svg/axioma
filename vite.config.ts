import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.GITHUB_ACTIONS === 'true' ? '/axioma/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:3001' },
    watch: { usePolling: true, interval: 500, ignored: ['**/.local-db/**', '**/.local-files/**'] },
  },
});
