/**
 * Sentry Error Tracking Integration
 * 
 * This file provides setup instructions and implementation for error tracking
 * using Sentry (https://sentry.io)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://sentry.io and create a free account
 * 2. Create a new project (select "React" as platform)
 * 3. Copy your DSN (looks like: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx)
 * 4. Add to .env.local: VITE_SENTRY_DSN=your_dsn_here
 * 5. Run: npm install @sentry/react @sentry/tracing
 * 6. Import this file in src/main.tsx before creating your app
 * 
 * FEATURES:
 * - Automatic error tracking
 * - Session replay (on paid plans)
 * - Performance monitoring
 * - Source map upload
 * - Environment separation (dev/prod)
 */

// Sentry integration - install with: npm install @sentry/react @sentry/tracing
// This is a configuration template - uncomment when Sentry packages are installed

/**
 * Initialize Sentry for error tracking
 * Call this in main.tsx before rendering your app
 * 
 * To use Sentry:
 * 1. npm install @sentry/react @sentry/tracing
 * 2. Get DSN from https://sentry.io
 * 3. Add VITE_SENTRY_DSN to .env.local
 * 4. Uncomment the code below
 */
export const initSentry = (): void => {
    // NOTE: Uncomment the following code after installing Sentry packages
    /*
    import * as Sentry from '@sentry/react';
    import { BrowserTracing } from '@sentry/tracing';
    
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const env = import.meta.env.VITE_APP_ENV || 'development';
    
    // Skip in development if DSN not provided
    if (!dsn && env === 'development') {
        console.log('[Sentry] DSN not configured, error tracking disabled');
        return;
    }
    
    if (!dsn) {
        console.warn('[Sentry] DSN not found in environment variables');
        return;
    }
    
    Sentry.init({
        dsn: dsn,
        environment: env,
        tracesSampleRate: env === 'production' ? 0.1 : 1.0,
        integrations: [
            new BrowserTracing({
                // Set sampling rate for performance monitoring
                tracingOrigins: ['localhost', /^\//],
            }),
        ],
        // Release tracking (optional - set during build)
        release: import.meta.env.VITE_APP_VERSION,
        // Ignore certain errors
        ignoreErrors: [
            // Random plugins/extensions
            'top.GLOBALS',
            // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
        ],
        // Track breadcrumbs (user actions)
        attachStacktrace: true,
    });
    
    console.log(`[Sentry] Initialized for ${env} environment`);
    */
    console.log('[Sentry] Set up instructions: see src/utils/errorTracking.ts');
};

/**
 * Capture exception and send to Sentry
 * Use in catch blocks
 */
export const captureException = (error: Error | string, context?: Record<string, any>): void => {
    // When Sentry is initialized, use: Sentry.captureException(error)
    const message = typeof error === 'string' ? error : error.message;
    console.error('[Error Captured]', message, context);
};

/**
 * Capture message and send to Sentry
 * Use for non-error messages
 */
export const captureMessage = (
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error',
    context?: Record<string, any>
): void => {
    // When Sentry is initialized, use: Sentry.captureMessage(message, level)
    console.log(`[${level.toUpperCase()}]`, message, context);
};

/**
 * Set user context for error tracking
 * Call after user login
 */
export const setSentryUser = (userId: string, email?: string, username?: string): void => {
    // When Sentry is initialized, use: Sentry.setUser({ id, email, username })
    console.log('[User Context Set]', { userId, email, username });
};

/**
 * Clear user context
 * Call after logout
 */
export const clearSentryUser = (): void => {
    // When Sentry is initialized, use: Sentry.setUser(null)
    console.log('[User Context Cleared]');
};

/**
 * Add breadcrumb (user action tracking)
 * Helps with debugging by showing user actions before error
 */
export const addBreadcrumb = (
    message: string,
    category: string = 'user-action',
    _level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    data?: Record<string, any>
): void => {
    // When Sentry is initialized, use: Sentry.addBreadcrumb(...)
    console.log(`[Breadcrumb] ${category}:`, message, data);
};

/**
 * Enhanced error logger with context
 * Use instead of console.error
 */
export const logError = (
    error: Error | string,
    context: {
        page?: string;
        action?: string;
        userId?: string;
        [key: string]: any;
    } = {}
): void => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? '' : error.stack;
    
    console.error(`[ERROR] ${errorMessage}`, error);
    
    // Send to Sentry in production
    if (import.meta.env.VITE_APP_ENV === 'production') {
        captureException(error, { ...context, stack: errorStack });
        addBreadcrumb(`Error: ${errorMessage}`, 'error', 'error', context);
    }
};

/**
 * Enhanced logger with breadcrumbs
 * Use to log important user actions
 */
export const logAction = (
    action: string,
    details?: Record<string, any>
): void => {
    console.log(`[ACTION] ${action}`, details);
    
    if (import.meta.env.VITE_APP_ENV === 'production') {
        addBreadcrumb(action, 'user-action', 'info', details);
    }
};

/**
 * Enhanced performance logger
 * Use to track operation duration
 */
export const logPerformance = (
    operationName: string,
    durationMs: number,
    threshold: number = 1000
): void => {
    if (durationMs > threshold) {
        console.warn(
            `[PERFORMANCE] ${operationName} took ${durationMs.toFixed(2)}ms (threshold: ${threshold}ms)`,
            { duration: durationMs, operation: operationName }
        );
        
        if (import.meta.env.VITE_APP_ENV === 'production') {
            addBreadcrumb(
                `Slow operation: ${operationName}`,
                'performance',
                'warning',
                { duration_ms: durationMs, threshold_ms: threshold }
            );
        }
    } else {
        console.log(`[PERFORMANCE] ${operationName}: ${durationMs.toFixed(2)}ms`);
    }
};

export default {
    initSentry,
    captureException,
    captureMessage,
    setSentryUser,
    clearSentryUser,
    addBreadcrumb,
    logError,
    logAction,
    logPerformance,
};
