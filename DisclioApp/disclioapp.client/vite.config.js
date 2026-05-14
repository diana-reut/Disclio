import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const sslPfxPath = env.VITE_SSL_PFX_PATH;
    const sslPassphrase = env.VITE_SSL_PFX_PASSPHRASE;
    const devHost = env.VITE_DEV_HOST || '0.0.0.0';
    const devOpen = env.VITE_DEV_OPEN_PATH || '/';
    const httpsConfig = sslPfxPath
        ? {
            pfx: fs.readFileSync(sslPfxPath),
            passphrase: sslPassphrase
        }
        : undefined;

    return {
        plugins: [plugin()],
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setupTests.js',
            coverage: {
                provider: 'v8',
                reporter: ['text', 'html'],
                exclude: [
                    '**/*.css',
                    '**/*.test.{js,jsx,ts,tsx}',
                    'src/test/**'
                ]
            },
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
            host: devHost,
            https: httpsConfig,
            hmr: httpsConfig ? {
                protocol: 'wss',
                clientPort: 5173
            } : undefined,
            port: 5173,
            strictPort: true,
            open: devOpen
        },
        optimizeDeps: {
            include: ['recharts'],
        }
    };
});
