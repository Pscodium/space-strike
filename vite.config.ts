import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: Number(process.env.PORT) || 2304,
        host: process.env.HOST || 'localhost',
        fs: {
            allow: ['.'],
        },
        allowedHosts: [process.env.HOST || 'localhost']
    },
    assetsInclude: ['**/*.md'],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
