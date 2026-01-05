import { defineConfig } from 'vite';

export default defineConfig({
    // Optimize dependencies for faster dev startup
    optimizeDeps: {
        include: ['monaco-editor', 'marked', 'dompurify', 'prismjs']
    },

    // Build optimizations
    build: {
        // Target modern browsers for smaller bundles
        target: 'es2020',

        // Minification settings
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },

        // CSS optimization
        cssCodeSplit: true,
        cssMinify: true,

        // Asset handling
        assetsInlineLimit: 4096,

        // Chunk size warnings
        chunkSizeWarningLimit: 600,

        // Rollup specific options
        rollupOptions: {
            output: {
                // Smart chunk splitting based on modules
                manualChunks(id) {
                    if (id.includes('monaco-editor')) {
                        return 'monaco';
                    }
                    if (id.includes('mermaid')) {
                        return 'mermaid';
                    }
                    if (id.includes('katex')) {
                        return 'katex';
                    }
                    if (id.includes('marked') || id.includes('dompurify')) {
                        return 'markdown';
                    }
                    if (id.includes('prismjs')) {
                        return 'prism';
                    }
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },

        sourcemap: false,
        reportCompressedSize: true
    },

    // Server optimizations
    server: {
        hmr: {
            overlay: true
        }
    },

    // Preview server
    preview: {
        port: 4173,
        strictPort: true
    }
});
