import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        }
      },
      build: {
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              const normalized = id.replace(/\\/g, '/');

              if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalized)) {
                return 'vendor-react';
              }
              if (/\/node_modules\/(@firebase|firebase)\//.test(normalized)) {
                return 'vendor-firebase';
              }
              if (/\/node_modules\/(recharts|d3-[^/]+|victory-vendor)\//.test(normalized)) {
                return 'vendor-charts';
              }
              if (/\/node_modules\/(motion|framer-motion)\//.test(normalized)) {
                return 'vendor-animation';
              }
              if (/\/node_modules\/lucide-react\//.test(normalized)) {
                return 'vendor-icons';
              }
              if (/\/node_modules\/@dnd-kit\//.test(normalized)) {
                return 'vendor-dnd';
              }
              if (/\/node_modules\/(@stripe|stripe)\//.test(normalized)) {
                return 'vendor-stripe';
              }
              return 'vendor-others';
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      }
    };
});
