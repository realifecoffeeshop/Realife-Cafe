import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import Modal from '../shared/Modal';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { auth } from '../../firebase/config';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch, firebaseUser } = useApp();
    const { addToast } = useToast();
    const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Auto-fill from localStorage on mount
    React.useEffect(() => {
        const savedName = localStorage.getItem('last_user_name');
        const savedEmail = localStorage.getItem('last_user_email');
        if (savedName) setName(savedName);
        if (savedEmail) setEmail(savedEmail);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        
        setIsLoading(true);
        
        // Add a safety timeout for mobile connections
        const loginTimeout = setTimeout(() => {
            if (isLoading) {
                addToast("Login is taking longer than usual. Please check your connection.", "info");
            }
        }, 8000);

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            clearTimeout(loginTimeout);
            const user = userCredential.user;
            
            if (user) {
                // Save for next time
                localStorage.setItem('last_user_email', email);
                addToast("Logging in...", "info");
                onClose();
            }
        } catch (error: any) {
            clearTimeout(loginTimeout);
            console.error("Login error:", error);
            // Handle specific Firebase Auth error codes
            let errorMessage = error.message || 'Login failed. Please check your credentials.';
            
            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid credentials. The email or password may be incorrect, or the account doesn\'t exist. If you haven\'t created an account yet, please use the Register tab.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please register first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again or use "Forgot Password".';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }

            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;

        const trimmedName = name.trim();
        if (!trimmedName) {
            addToast('Please enter a name.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (user) {
                // Save name for next time
                if (trimmedName) localStorage.setItem('last_user_name', trimmedName);
                if (email) localStorage.setItem('last_user_email', email);

                await user.updateProfile({ displayName: trimmedName });
                addToast(`Setting up your account, ${trimmedName}...`, 'success');
                onClose();
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            addToast(error.message || 'Registration failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;

        if (!email) {
            addToast('Please enter your email address.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await auth.sendPasswordResetEmail(email);
            addToast('Password reset email sent! Please check your inbox.', 'success');
            setViewMode('login');
        } catch (error: any) {
            console.error("Password reset error:", error);
            addToast(error.message || 'Failed to send reset email.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!auth) return;
        setIsLoading(true);
        
        const MAX_RETRIES = 2;
        let attempt = 0;

        const performLogin = async (): Promise<void> => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                
                const result = await auth.signInWithPopup(provider);
                const user = result.user;

                if (user) {
                    addToast(`Logging in...`, 'info');
                    onClose();
                }
            } catch (error: any) {
                console.error(`Google Login attempt ${attempt + 1} failed:`, error);
                
                if (error.code === 'auth/network-request-failed' && attempt < MAX_RETRIES) {
                    attempt++;
                    addToast(`Connection issues. Retrying login (Attempt ${attempt + 1})...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return performLogin();
                }

                if (error.code === 'auth/unauthorized-domain') {
                    addToast("Action Required: Please whitelist this domain in Firebase Console (Auth > Settings > Authorized Domains).", 'error', { duration: 10000 });
                } else if (error.code === 'auth/popup-blocked') {
                    addToast("Popup blocked! Please allow popups for this site to sign in with Google.", 'error');
                } else if (error.code === 'auth/popup-closed-by-user') {
                    addToast("Popup closed before completion. Please try again.", 'info');
                } else {
                    addToast(error.message || 'Google Login failed.', 'error');
                }
            }
        };

        await performLogin();
        setIsLoading(false);
    };
    
    const handleClose = () => {
        setName('');
        setEmail('');
        setPassword('');
        setViewMode('login');
        onClose();
    };

    const getModalTitle = () => {
        if (viewMode === 'login') return "Login to Your Account";
        if (viewMode === 'register') return "Create New Account";
        return "Reset Your Password";
    };

    const renderContent = () => (
        <div className="space-y-6">
            {/* Efficiency Boost: Direct Google Login at the top if it's a cold login */}
            {viewMode === 'login' && (
                <div className="pb-2">
                    <button 
                        type="button" 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google Account
                    </button>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-200 dark:border-zinc-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-800 px-2 text-stone-400 font-bold tracking-widest">Or use Email</span>
                        </div>
                    </div>
                </div>
            )}

            {viewMode !== 'forgot' && (
                <div className="flex p-1 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex-1">
                        <button 
                            onClick={() => setViewMode('login')} 
                            className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all text-center flex items-center justify-center ${viewMode === 'login' ? 'bg-brand-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            Login
                        </button>
                    </div>
                    <div className="flex-1">
                        <button 
                            onClick={() => setViewMode('register')} 
                            className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all text-center flex items-center justify-center ${viewMode === 'register' ? 'bg-brand-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            Register
                        </button>
                    </div>
                </div>
            )}
            
            {viewMode === 'login' && (
                 <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-left" 
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-left" 
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="button"
                            onClick={() => setViewMode('forgot')}
                            className="text-xs font-bold text-brand-primary hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-700 transition-all shadow-lg transform active:scale-95 text-center flex items-center justify-center disabled:opacity-50"
                    >
                        {isLoading ? 'Logging in...' : 'Login with Email'}
                    </button>
                </form>
            )}

            {viewMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Full Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-left"
                            placeholder="e.g., John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-left"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-left"
                            placeholder="Min 6 characters"
                            minLength={6}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-700 transition-all shadow-lg transform active:scale-95 text-center flex items-center justify-center disabled:opacity-50"
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            )}

            {viewMode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-stone-500 dark:text-zinc-400 text-center">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-left"
                            placeholder="your@email.com"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-700 transition-all shadow-lg transform active:scale-95 text-center flex items-center justify-center disabled:opacity-50"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setViewMode('login')}
                        className="w-full text-sm font-bold text-stone-400 hover:text-stone-600 transition-all"
                    >
                        Back to Login
                    </button>
                </form>
            )}
        </div>
    );


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()}>
            <div className="space-y-4">
                {renderContent()}
            </div>
        </Modal>
    );
};

export default LoginModal;
