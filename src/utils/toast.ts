/**
 * Toast Notification Service
 * Unified notification system for user feedback
 * 
 * Usage:
 * import { showToast, showSuccess, showError, showWarning } from '@/utils/toast';
 * 
 * showSuccess('Labour added successfully!');
 * showError('Failed to save. Please try again.');
 * showWarning('Session expires in 1 hour.');
 * showToast('Loading attendance records...', 'info');
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

/**
 * In-memory toast storage (until you integrate react-toastify)
 * This is a temporary solution for demonstrating toast functionality
 */
const toastContainer = {
    toasts: [] as Toast[],
    listeners: [] as ((toasts: Toast[]) => void)[],
    
    add(message: string, type: ToastType = 'info', duration: number = 3000) {
        const id = Math.random().toString(36).substr(2, 9);
        const toast: Toast = { id, message, type, duration };
        
        this.toasts.push(toast);
        this.notifyListeners();
        
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
        
        return id;
    },
    
    remove(id: string) {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notifyListeners();
    },
    
    clear() {
        this.toasts = [];
        this.notifyListeners();
    },
    
    subscribe(listener: (toasts: Toast[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },
    
    notifyListeners() {
        this.listeners.forEach(listener => listener([...this.toasts]));
    }
};

/**
 * Show success notification
 * @param message - Success message to display
 * @param duration - How long to show (ms), 0 = manual dismiss
 */
export const showSuccess = (message: string, duration: number = 3000): string => {
    console.log(`✅ ${message}`);
    return toastContainer.add(message, 'success', duration);
};

/**
 * Show error notification
 * @param message - Error message to display
 * @param duration - How long to show (ms), 0 = manual dismiss (default for errors)
 */
export const showError = (message: string, duration: number = 5000): string => {
    console.error(`❌ ${message}`);
    return toastContainer.add(message, 'error', duration);
};

/**
 * Show warning notification
 * @param message - Warning message to display
 * @param duration - How long to show (ms), 0 = manual dismiss
 */
export const showWarning = (message: string, duration: number = 4000): string => {
    console.warn(`⚠️ ${message}`);
    return toastContainer.add(message, 'warning', duration);
};

/**
 * Show info notification
 * @param message - Info message to display
 * @param duration - How long to show (ms), 0 = manual dismiss
 */
export const showInfo = (message: string, duration: number = 3000): string => {
    console.info(`ℹ️ ${message}`);
    return toastContainer.add(message, 'info', duration);
};

/**
 * Generic toast function
 * @param message - Message to display
 * @param type - Toast type: 'success' | 'error' | 'warning' | 'info'
 * @param duration - How long to show (ms), 0 = manual dismiss
 */
export const showToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
): string => {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    console.log(`${icons[type]} [${type.toUpperCase()}] ${message}`);
    return toastContainer.add(message, type, duration);
};

/**
 * Remove a specific toast by ID
 */
export const dismissToast = (id: string): void => {
    toastContainer.remove(id);
};

/**
 * Clear all toasts
 */
export const clearAllToasts = (): void => {
    toastContainer.clear();
};

/**
 * Subscribe to toast changes (for React integration)
 */
export const subscribeToToasts = (
    listener: (toasts: Toast[]) => void
): (() => void) => {
    return toastContainer.subscribe(listener);
};

/**
 * Get current toasts
 */
export const getToasts = (): Toast[] => {
    return [...toastContainer.toasts];
};

/**
 * Common error messages
 */
export const ErrorMessages = {
    NETWORK: 'Network error. Please check your internet connection.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested item was not found.',
    INVALID_INPUT: 'Please check your input and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    DUPLICATE: 'This record already exists.',
    SAVE_FAILED: 'Failed to save. Please try again.',
    DELETE_FAILED: 'Failed to delete. Please try again.',
    LOAD_FAILED: 'Failed to load data. Please try again.',
};

/**
 * Common success messages
 */
export const SuccessMessages = {
    SAVED: 'Saved successfully!',
    DELETED: 'Deleted successfully!',
    CREATED: 'Created successfully!',
    UPDATED: 'Updated successfully!',
    EXPORTED: 'Exported successfully!',
    COPIED: 'Copied to clipboard!',
};

/**
 * Enhanced error handler with toast
 * Use in catch blocks
 */
export const handleError = (
    error: Error | string | unknown,
    defaultMessage: string = 'An error occurred'
): void => {
    let message = defaultMessage;
    
    if (typeof error === 'string') {
        message = error;
    } else if (error instanceof Error) {
        message = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
        message = String((error as Record<string, unknown>).message);
    }
    
    // Check for specific error types
    if (message.includes('auth') || message.includes('unauthorized')) {
        showError(ErrorMessages.UNAUTHORIZED);
    } else if (message.includes('network') || message.includes('fetch')) {
        showError(ErrorMessages.NETWORK);
    } else if (message.includes('not found')) {
        showError(ErrorMessages.NOT_FOUND);
    } else if (message.includes('duplicate')) {
        showError(ErrorMessages.DUPLICATE);
    } else {
        showError(message || defaultMessage);
    }
};

/**
 * Async operation with loading toast
 * Example:
 * const result = await withLoadingToast(
 *     database.getLabours(),
 *     'Loading labours...',
 *     'Labours loaded!',
 *     'Failed to load labours'
 * );
 */
export const withLoadingToast = async <T,>(
    promise: Promise<T>,
    loadingMessage: string = 'Loading...',
    successMessage: string = 'Success!',
    errorMessage: string = 'Failed'
): Promise<T> => {
    const loadingId = showInfo(loadingMessage, 0); // Don't auto-dismiss
    
    try {
        const result = await promise;
        dismissToast(loadingId);
        showSuccess(successMessage);
        return result;
    } catch (error) {
        dismissToast(loadingId);
        handleError(error, errorMessage);
        throw error;
    }
};

/**
 * Show confirmation dialog (requires modal component)
 * Placeholder - implement with your modal system
 */
export const showConfirmation = (
    message: string,
    _onConfirm?: () => void,
    _onCancel?: () => void
): void => {
    // This would be implemented with your actual modal system
    console.warn('[CONFIRMATION] Implement showConfirmation with your modal system');
    console.log(message);
};

export default {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    dismissToast,
    clearAllToasts,
    subscribeToToasts,
    getToasts,
    ErrorMessages,
    SuccessMessages,
    handleError,
    withLoadingToast,
    showConfirmation,
};
