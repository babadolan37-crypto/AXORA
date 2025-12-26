
  import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all. Default: {}
      include: ['process', 'buffer', 'util', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].${Date.now()}.js`,
          chunkFileNames: `assets/[name].${Date.now()}.js`,
          assetFileNames: `assets/[name].[ext]`
        }
      }
    },
    server: {
      host: true,
      port: 3000,
      open: true,
    },
  });