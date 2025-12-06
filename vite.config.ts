import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  css: {
    preprocessorOptions: {
      scss: {
        // Silence Bootstrap's Sass deprecation warnings until Bootstrap 6 migrates to @use
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
