import React, { useState, useContext } from 'react';
import Modal from '../shared/Modal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch, firebaseUser } = useApp();
    const { addToast } = useToast();
    const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            addToast('Please enter a name.', 'error');
            return;
        }
        
        const user = state.users.find(
            c => c?.name?.toLowerCase() === trimmedName.toLowerCase()
        );
        
        dispatch({ type: 'LOGIN', payload: { name: trimmedName } });

        if (user) {
            addToast(`Welcome back, ${trimmedName}!`, 'success');
        } else {
            addToast(`User "${trimmedName}" not found. Continuing as a guest.`, 'info');
        }
        
        onClose();
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            addToast('Please enter a name.', 'error');
            return;
        }

        if (!firebaseUser) {
            addToast('Connecting to security service... Please try again in a moment.', 'info');
            return;
        }

        const existingUser = state.users.find(c => c?.name?.toLowerCase() === trimmedName.toLowerCase());
        if (existingUser) {
            addToast('A user with this name already exists. Please log in.', 'error');
            return;
        }
        dispatch({ type: 'REGISTER', payload: { name: trimmedName, userId: firebaseUser.uid } });
        addToast(`Account created for ${trimmedName}! Welcome!`, 'success');
        onClose();
    };
    
    const handleClose = () => {
        setName('');
        setViewMode('login');
        onClose();
    };

    const modalTitle = viewMode === 'login' ? "Login or Continue as Guest" : "Register Account";

    const renderContent = () => (
        <div className="space-y-6">
            <div className="flex p-1 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-sm">
                <button 
                    onClick={() => setViewMode('login')} 
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${viewMode === 'login' ? 'bg-brand-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    Login
                </button>
                <button 
                    onClick={() => setViewMode('register')} 
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${viewMode === 'register' ? 'bg-brand-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    Register
                </button>
            </div>
            
            {viewMode === 'login' ? (
                 <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Your Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all" 
                            placeholder="e.g., John Doe"
                        />
                        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-2 italic font-serif">Enter your name to access your profile and history.</p>
                    </div>
                    <button type="submit" className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-700 transition-all shadow-lg transform active:scale-95">
                        Continue to Menu
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Choose a Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
                        />
                    </div>
                    <button type="submit" className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-700 transition-all shadow-lg transform active:scale-95">
                        Create Account
                    </button>
                </form>
            )}
        </div>
    );


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
            <div className="space-y-4">
                {renderContent()}
            </div>
        </Modal>
    );
};

export default LoginModal;