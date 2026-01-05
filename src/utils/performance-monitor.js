/**
 * Performance Monitor for Markups
 * Tracks Core Web Vitals and custom metrics
 */

// Performance metrics storage
const metrics = {
    FCP: null,  // First Contentful Paint
    LCP: null,  // Largest Contentful Paint
    FID: null,  // First Input Delay
    CLS: null,  // Cumulative Layout Shift
    TTFB: null, // Time to First Byte
    TTI: null,  // Time to Interactive
    custom: {}
};

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitor() {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Track First Contentful Paint
    observePaint();

    // Track Largest Contentful Paint
    observeLCP();

    // Track First Input Delay
    observeFID();

    // Track Cumulative Layout Shift
    observeCLS();

    // Track navigation timing
    trackNavigationTiming();

    // Report metrics when page is hidden (user leaves)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            reportMetrics();
        }
    });
}

/**
 * Observe paint timing (FCP)
 */
function observePaint() {
    if (!('PerformanceObserver' in window)) return;

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    metrics.FCP = Math.round(entry.startTime);
                    observer.disconnect();
                }
            }
        });
        observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
        // PerformanceObserver not supported
    }
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.LCP = Math.round(lastEntry.startTime);
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
        // LCP not supported
    }
}

/**
 * Observe First Input Delay
 */
function observeFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                metrics.FID = Math.round(entry.processingStart - entry.startTime);
                observer.disconnect();
            }
        });
        observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
        // FID not supported
    }
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    const firstEntry = sessionEntries[0];
                    const lastEntry = sessionEntries[sessionEntries.length - 1];

                    if (
                        sessionValue &&
                        entry.startTime - lastEntry.startTime < 1000 &&
                        entry.startTime - firstEntry.startTime < 5000
                    ) {
                        sessionValue += entry.value;
                        sessionEntries.push(entry);
                    } else {
                        sessionValue = entry.value;
                        sessionEntries = [entry];
                    }

                    if (sessionValue > clsValue) {
                        clsValue = sessionValue;
                        metrics.CLS = Math.round(clsValue * 1000) / 1000;
                    }
                }
            }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
        // CLS not supported
    }
}

/**
 * Track navigation timing metrics
 */
function trackNavigationTiming() {
    if (!('performance' in window)) return;

    // Wait for load event
    window.addEventListener('load', () => {
        setTimeout(() => {
            const timing = performance.getEntriesByType('navigation')[0];

            if (timing) {
                metrics.TTFB = Math.round(timing.responseStart - timing.requestStart);
                metrics.TTI = Math.round(timing.domInteractive);
            }
        }, 0);
    });
}

/**
 * Mark a custom timing point
 */
export function mark(name) {
    if ('performance' in window && performance.mark) {
        performance.mark(name);
    }
}

/**
 * Measure time between two marks
 */
export function measure(name, startMark, endMark) {
    if ('performance' in window && performance.measure) {
        try {
            performance.measure(name, startMark, endMark);
            const entries = performance.getEntriesByName(name, 'measure');
            if (entries.length > 0) {
                metrics.custom[name] = Math.round(entries[entries.length - 1].duration);
                return metrics.custom[name];
            }
        } catch (e) {
            // Measurement failed
        }
    }
    return null;
}

/**
 * Track memory usage (Chrome only)
 */
export function getMemoryUsage() {
    if ('memory' in performance) {
        const memory = performance.memory;
        return {
            usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
            jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };
    }
    return null;
}

/**
 * Get all collected metrics
 */
export function getMetrics() {
    return { ...metrics, memory: getMemoryUsage() };
}

/**
 * Report metrics to analytics
 */
function reportMetrics() {
    const data = getMetrics();

    // Send to Google Analytics if available
    if (typeof gtag === 'function') {
        // Report Core Web Vitals
        if (data.LCP) {
            gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'LCP',
                value: data.LCP,
                non_interaction: true
            });
        }

        if (data.FID) {
            gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'FID',
                value: data.FID,
                non_interaction: true
            });
        }

        if (data.CLS !== null) {
            gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'CLS',
                value: Math.round(data.CLS * 1000),
                non_interaction: true
            });
        }
    }

    // Log to console in development
    if (import.meta.env?.DEV) {
        console.table({
            'First Contentful Paint (FCP)': `${data.FCP}ms`,
            'Largest Contentful Paint (LCP)': `${data.LCP}ms`,
            'First Input Delay (FID)': `${data.FID}ms`,
            'Cumulative Layout Shift (CLS)': data.CLS,
            'Time to First Byte (TTFB)': `${data.TTFB}ms`,
            'Time to Interactive (TTI)': `${data.TTI}ms`
        });
    }
}

/**
 * Log performance warning if metric exceeds threshold
 */
export function checkPerformance() {
    const thresholds = {
        FCP: 1800,   // 1.8s
        LCP: 2500,   // 2.5s
        FID: 100,    // 100ms
        CLS: 0.1,    // 0.1
        TTFB: 600    // 600ms
    };

    const warnings = [];

    Object.entries(thresholds).forEach(([metric, threshold]) => {
        if (metrics[metric] !== null && metrics[metric] > threshold) {
            warnings.push(`${metric}: ${metrics[metric]} exceeds threshold ${threshold}`);
        }
    });

    return warnings;
}

export default {
    initPerformanceMonitor,
    mark,
    measure,
    getMetrics,
    getMemoryUsage,
    checkPerformance
};
