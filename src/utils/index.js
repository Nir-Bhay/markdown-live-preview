/**
 * Utils Index
 * Re-exports all utility modules
 * @module utils
 */

export { eventBus, EVENTS } from './eventBus.js';
export { debounce, throttle, once, delay, after, before } from './debounce.js';
export {
    $, $$, byId, createElement,
    addClass, removeClass, toggleClass, hasClass,
    show, hide, toggle,
    on, once as onceDOM, delegate,
    getOffset, scrollIntoView,
    setHTML, setText, val, empty, remove, clone,
    isVisible, ready
} from './dom.js';
export {
    copyToClipboard,
    copyHTMLToClipboard,
    readFromClipboard,
    isClipboardAvailable,
    copyElementText,
    copyElementHTML
} from './clipboard.js';
export {
    downloadFile,
    downloadMarkdown,
    downloadHTML,
    downloadJSON,
    readFileAsText,
    readFileAsDataURL,
    readFileAsArrayBuffer,
    getExtension,
    getBaseName,
    isImageFile,
    isMarkdownFile,
    isTextFile,
    formatFileSize,
    validateFileSize,
    selectFiles,
    selectMarkdownFile,
    selectImageFiles
} from './file.js';
export { scrollSync } from './scroll-sync.js';

// Performance utilities
export {
    loadMermaid,
    loadKaTeX,
    loadHtml2Pdf,
    loadDocx,
    hasMermaidContent,
    hasKaTeXContent,
    preloadInBackground,
    getLoadingStatus
} from './lazy-loader.js';

export {
    initLazyImages,
    compressImage,
    convertToWebP,
    generateBlurPlaceholder,
    preloadImages,
    supportsWebP,
    getOptimalFormat
} from './image-optimizer.js';

export {
    initPerformanceMonitor,
    mark as perfMark,
    measure as perfMeasure,
    getMetrics,
    getMemoryUsage,
    checkPerformance
} from './performance-monitor.js';
