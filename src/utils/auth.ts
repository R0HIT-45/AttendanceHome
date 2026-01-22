import { supabase } from '../lib/supabase';

const AUTH_LOGIN_TIME_KEY = 'auth_login_time';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const authUtils = {
    /**
     * Sets the login timestamp in localStorage
     */
    setLoginTime: () => {
        localStorage.setItem(AUTH_LOGIN_TIME_KEY, Date.now().toString());
    },

    /**
     * Clears all auth-related local storage and signs out of Supabase
     */
    clearLoginTime: () => {
        localStorage.removeItem(AUTH_LOGIN_TIME_KEY);
    },

    /**
     * Clears all auth-related local storage and signs out of Supabase
     * @param reason Optional reason for sign out (e.g. 'expired')
     */
    signOutAndCleanup: async (reason?: string) => {
        localStorage.removeItem(AUTH_LOGIN_TIME_KEY);
        await supabase.auth.signOut();
        const url = reason ? `/login?reason=${reason}` : '/login';
        window.location.href = url;
    },

    /**
     * Validates if the current session is within the 7-day window.
     * Also checks for clock drift (login time in the future).
     * @returns boolean true if session is valid, false otherwise
     */
    isSessionValid: (): boolean => {
        const loginTimeStr = localStorage.getItem(AUTH_LOGIN_TIME_KEY);
        if (!loginTimeStr) return false;

        const loginTime = parseInt(loginTimeStr, 10);
        const now = Date.now();

        // Check for future timestamp (clock drift)
        if (loginTime > now) {
            console.warn('[Auth] Future login time detected, invalidating session.');
            return false;
        }

        // Check 7-day window
        return (now - loginTime) < SEVEN_DAYS_MS;
    },

    /**
     * Returns how many milliseconds are left until the 7-day limit
     */
    getTimeUntilExpiry: (): number => {
        const loginTimeStr = localStorage.getItem(AUTH_LOGIN_TIME_KEY);
        if (!loginTimeStr) return 0;

        const loginTime = parseInt(loginTimeStr, 10);
        const expiryTime = loginTime + SEVEN_DAYS_MS;
        return Math.max(0, expiryTime - Date.now());
    }
};
