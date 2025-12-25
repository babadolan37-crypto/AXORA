
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    define: {
      'process.env': {},
      global: 'window',
    },
    server: {
      host: true,
      port: 3000,
      open: true,
    },
  });