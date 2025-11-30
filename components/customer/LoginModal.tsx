import React, { useState, useContext } from 'react';
import Modal from '../shared/Modal';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
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
            c => c.name.toLowerCase() === trimmedName.toLowerCase()
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

        const existingUser = state.users.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (existingUser) {
            addToast('A user with this name already exists. Please log in.', 'error');
            return;
        }
        dispatch({ type: 'REGISTER', payload: { name: trimmedName } });
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
        <>
            <div className="flex border-b dark:border-zinc-700">
                <button onClick={() => setViewMode('login')} className={`flex-1 py-2 text-center font-medium ${viewMode === 'login' ? 'text-stone-800 dark:text-white border-b-2 border-stone-700 dark:border-white' : 'text-stone-500'}`}>Login</button>
                <button onClick={() => setViewMode('register')} className={`flex-1 py-2 text-center font-medium ${viewMode === 'register' ? 'text-stone-800 dark:text-white border-b-2 border-stone-700 dark:border-white' : 'text-stone-500'}`}>Register</button>
            </div>
            {viewMode === 'login' ? (
                 <form onSubmit={handleLogin} className="pt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-stone-900 dark:text-white" placeholder="Enter your name..."/>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Enter an existing name to log in, or a new name to continue as a guest.</p>
                    </div>
                    <button type="submit" className="w-full bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors font-semibold">Continue</button>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="pt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Choose a Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-stone-900 dark:text-white"/>
                    </div>
                    <button type="submit" className="w-full bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors font-semibold">Create Account</button>
                </form>
            )}
        </>
    );


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} helpArticleId="kb-10">
            <div className="space-y-4">
                {renderContent()}
            </div>
        </Modal>
    );
};

export default LoginModal;