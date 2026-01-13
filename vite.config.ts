import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/view': path.resolve(__dirname, 'src/view'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@/data': path.resolve(__dirname, 'src/data'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/tests': path.resolve(__dirname, 'src/tests'),
    }
  }
});