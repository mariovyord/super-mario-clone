import { defineConfig } from 'vite';

// Single config used by both `vite` (dev) and `vite build` (prod).
export default defineConfig({
    base: './',
    server: {
        port: 8080,
    },
    build: {
        rollupOptions: {
            output: {
                // Split Phaser into its own chunk for better caching.
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
        minify: 'terser',
        terserOptions: {
            compress: { passes: 2 },
            mangle: true,
            format: { comments: false },
        },
    },
});
