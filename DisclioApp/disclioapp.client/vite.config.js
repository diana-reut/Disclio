import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    test: {
        globals: true,
        environment: 'jsdom',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.spec.{js,ts,jsx}'
        ],
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
        dedupe: ['react', 'react-dom']
    },
    server: {
        port: 5173,
        strictPort: true
    },
    optimizeDeps: {
        include: ['recharts'],
    }
})