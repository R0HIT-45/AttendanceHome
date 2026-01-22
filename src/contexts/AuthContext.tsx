import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authUtils } from '../utils/auth';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAppReady: boolean;
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // 1. Get initial session
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (initialSession) {
                    // 2. Validate session age for persistent auth requirement
                    if (!authUtils.isSessionValid()) {
                        console.log('[Auth] Session expired or invalid (7-day rule), signing out...');
                        await authUtils.signOutAndCleanup('expired');
                        return;
                    }
                    setSession(initialSession);
                    setUser(initialSession.user);
                }
            } catch (err) {
                console.error('[Auth] Initialization error:', err);
            } finally {
                setLoading(false);
                setIsAppReady(true);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (import.meta.env.DEV) {
                console.log(`[Auth] Event: ${event}`, currentSession?.user?.email);
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Ensure login time is set if not present (e.g. social login)
                if (!localStorage.getItem('auth_login_time')) {
                    authUtils.setLoginTime();
                }

                // Re-validate session age on refresh/boot
                if (!authUtils.isSessionValid()) {
                    await authUtils.signOutAndCleanup('expired');
                    return;
                }

                setSession(currentSession);
                setUser(currentSession?.user ?? null);
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                localStorage.removeItem('auth_login_time');
            }

            setLoading(false);
            setIsAppReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!error && data.session) {
            authUtils.setLoginTime();
        }

        return { error };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
        // Note: auth_login_time will be set in onAuthStateChange when redirected back
        return { error };
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        if (!error && data.session) {
            authUtils.setLoginTime();
        }

        return { error };
    };

    const signOut = async () => {
        await authUtils.signOutAndCleanup();
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
    };

    const value = {
        user,
        session,
        loading,
        isAppReady,
        signInWithEmail,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
