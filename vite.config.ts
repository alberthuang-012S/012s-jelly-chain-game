import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { entries: ['index.html'] },
  test: { include: ['src/**/*.test.ts'] },
});
