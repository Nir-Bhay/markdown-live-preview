/**
 * Lazy Loader Utility for Markups
 * Dynamically loads heavy libraries only when needed
 */

// Cache for loaded modules
const moduleCache = new Map();

// Loading state tracking
const loadingPromises = new Map();

/**
 * Generic lazy loader with caching
 */
async function lazyLoad(moduleName, importFn) {
    // Return cached module if available
    if (moduleCache.has(moduleName)) {
        return moduleCache.get(moduleName);
    }

    // Return existing promise if already loading
    if (loadingPromises.has(moduleName)) {
        return loadingPromises.get(moduleName);
    }

    // Start loading
    const loadPromise = importFn().then(module => {
        moduleCache.set(moduleName, module);
        loadingPromises.delete(moduleName);
        return module;
    }).catch(error => {
        loadingPromises.delete(moduleName);
        console.error(`Failed to load ${moduleName}:`, error);
        throw error;
    });

    loadingPromises.set(moduleName, loadPromise);
    return loadPromise;
}

/**
 * Lazy load Mermaid for diagram rendering
 */
export async function loadMermaid() {
    const mermaid = await lazyLoad('mermaid', () => import('mermaid'));

    // Initialize with optimized settings
    if (!mermaid.default.isInitialized) {
        mermaid.default.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            logLevel: 'error', // Reduce console noise
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
        mermaid.default.isInitialized = true;
    }

    return mermaid.default;
}

/**
 * Lazy load KaTeX for math rendering
 */
export async function loadKaTeX() {
    const katex = await lazyLoad('katex', () => import('katex'));

    // Also load CSS if not already loaded
    if (!document.querySelector('link[href*="katex"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    return katex.default;
}

/**
 * Lazy load html2pdf for PDF export
 */
export async function loadHtml2Pdf() {
    const html2pdf = await lazyLoad('html2pdf', () => import('html2pdf.js'));
    return html2pdf.default;
}

/**
 * Lazy load docx for DOCX export
 */
export async function loadDocx() {
    const docx = await lazyLoad('docx', () => import('docx'));
    return docx;
}

/**
 * Check if content contains Mermaid diagrams
 */
export function hasMermaidContent(markdown) {
    return /```mermaid[\s\S]*?```/i.test(markdown);
}

/**
 * Check if content contains KaTeX math
 */
export function hasKaTeXContent(markdown) {
    // Check for inline math ($...$) or block math ($$...$$)
    return /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g.test(markdown);
}

/**
 * Preload modules in the background during idle time
 */
export function preloadInBackground(modules = ['mermaid', 'katex']) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            modules.forEach(mod => {
                switch (mod) {
                    case 'mermaid':
                        loadMermaid().catch(() => { });
                        break;
                    case 'katex':
                        loadKaTeX().catch(() => { });
                        break;
                }
            });
        }, { timeout: 5000 });
    }
}

/**
 * Get loading status
 */
export function getLoadingStatus() {
    return {
        loaded: Array.from(moduleCache.keys()),
        loading: Array.from(loadingPromises.keys())
    };
}

export default {
    loadMermaid,
    loadKaTeX,
    loadHtml2Pdf,
    loadDocx,
    hasMermaidContent,
    hasKaTeXContent,
    preloadInBackground,
    getLoadingStatus
};
