import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authUtils } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Chrome, AlertCircle, CheckCircle2 } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signInWithEmail, signInWithGoogle, signUp, resetPassword } = useAuth();

    const [mode, setMode] = useState<AuthMode>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('reason') === 'expired') {
            setError('Your session has expired. Please sign in again.');
        }
    }, [location]);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const { error } = await signInWithEmail(formData.email, formData.password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            authUtils.setLoginTime(); // Set the 7-day session timer
            navigate('/');
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const { data, error } = await signUp(formData.email, formData.password, formData.name);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else if (data?.session) {
            // Email confirmation disabled, user is signed in
            authUtils.setLoginTime();
            navigate('/');
        } else {
            // Email confirmation enabled
            setSuccess('Check your email to confirm your account!');
            setLoading(false);
            setTimeout(() => setMode('signin'), 3000);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const { error } = await resetPassword(formData.email);

        if (error) {
            setError(error.message);
        } else {
            setSuccess('Password reset email sent! Check your inbox.');
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');

        const { error } = await signInWithGoogle();

        if (error) {
            setError(error.message);
            setLoading(false);
        }
        // Note: Google OAuth will redirect, so navigation is handled automatically
    };

    const handleSubmit = (e: React.FormEvent) => {
        if (mode === 'signin') handleEmailSignIn(e);
        else if (mode === 'signup') handleSignUp(e);
        else handleResetPassword(e);
    };

    return (
        <div className="login-page">
            <div className="login-bg-blob" style={{ top: '-10%', left: '-10%', background: 'var(--gradient-primary)' }} />
            <div className="login-bg-blob" style={{ bottom: '-10%', right: '-10%', background: 'var(--gradient-accent)' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="login-card"
                style={{ maxWidth: '460px' }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 1rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--gradient-primary)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 4px rgba(102, 126, 234, 0.1)',
                        }}
                    >
                        <Lock style={{ color: 'white' }} size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
                        {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        {mode === 'signin' ? 'Sign in to manage your workforce' : mode === 'signup' ? 'Get started with LAMS' : 'Enter your email to reset password'}
                    </p>
                </div>

                {/* Error/Success Messages */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <AlertCircle size={18} color="#ef4444" />
                            <p style={{ color: '#fca5a5', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <CheckCircle2 size={18} color="#22c55e" />
                            <p style={{ color: '#86efac', fontSize: '0.875rem', margin: 0 }}>{success}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Google Sign In Button */}
                {mode === 'signin' && (
                    <motion.button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            marginBottom: '1.5rem',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        <Chrome size={22} />
                        Continue with Google
                    </motion.button>
                )}

                {/* Divider */}
                {mode === 'signin' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '0.875rem',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
                        <span>or</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
                    </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {mode === 'signup' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                            Email Address
                        </label>
                        <div className="input-group">
                            <Mail className="input-icon" size={20} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            <input
                                type="email"
                                required
                                placeholder="admin@lams.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: '100%',
                                    paddingTop: '0.875rem',
                                    paddingBottom: '0.875rem',
                                    paddingLeft: '2.75rem',
                                    paddingRight: '1rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {mode !== 'reset' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                                Password
                            </label>
                            <div className="input-group">
                                <Lock className="input-icon" size={20} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={{
                                        width: '100%',
                                        paddingTop: '0.875rem',
                                        paddingBottom: '0.875rem',
                                        paddingLeft: '2.75rem',
                                        paddingRight: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(30, 41, 59, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Forgot Password Link */}
                    {mode === 'signin' && (
                        <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setMode('reset')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: 'var(--shadow-glow-primary)',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? (
                            'Please wait...'
                        ) : (
                            <>
                                {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Toggle Mode */}
                <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                }}>
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button
                                onClick={() => setMode('signup')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                            >
                                Sign up
                            </button>
                        </>
                    ) : mode === 'signup' ? (
                        <>
                            Already have an account?{' '}
                            <button
                                onClick={() => setMode('signin')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                            >
                                Sign in
                            </button>
                        </>
                    ) : (
                        <>
                            Remember your password?{' '}
                            <button
                                onClick={() => setMode('signin')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
