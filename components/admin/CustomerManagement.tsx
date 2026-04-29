import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { auth } from '../../firebase/config';
import { User, UserRole } from '../../types';
import { updateUser } from '../../firebase/firestoreService';

const CustomerManagement: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isResetting, setIsResetting] = useState<string | null>(null);

    const customers = state.users.filter(u => 
        u.role === UserRole.CUSTOMER && 
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleResetPassword = async (user: User) => {
        if (!auth || !user.email) {
            addToast('Cannot reset password: User has no email associated.', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to send a password reset email to ${user.name} (${user.email})?`)) {
            return;
        }

        setIsResetting(user.id);
        try {
            await auth.sendPasswordResetEmail(user.email);
            addToast(`Password reset email sent to ${user.email}`, 'success');
        } catch (error: any) {
            console.error("Password reset error:", error);
            addToast(error.message || 'Failed to send reset email.', 'error');
        } finally {
            setIsResetting(null);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        try {
            await updateUser(userId, { role: newRole });
            dispatch({ type: 'UPDATE_USER_ROLE', payload: { userId, role: newRole } });
            addToast(`User role updated to ${newRole}`, 'success');
        } catch (error: any) {
            addToast('Failed to update user role.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Customer Credentials Library</h2>
                    <p className="text-stone-500 dark:text-zinc-400 text-sm">Manage customer accounts and security.</p>
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search customers..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-stone-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none w-full md:w-64"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 dark:bg-zinc-800/50 border-b border-stone-100 dark:border-zinc-800">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Email</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Role</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Loyalty</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                            {customers.length > 0 && customers.map(user => (
                                <tr key={user.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-stone-900 dark:text-white">{user.name}</div>
                                        <div className="text-xs text-stone-400 font-mono">{user.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600 dark:text-zinc-400">
                                        {user.email || <span className="text-stone-300 italic">No email</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                            className="bg-stone-100 dark:bg-zinc-800 border-none rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-brand-primary/20"
                                        >
                                            <option value={UserRole.CUSTOMER}>Customer</option>
                                            <option value={UserRole.KITCHEN}>Kitchen</option>
                                            <option value={UserRole.ADMIN}>Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                            {user.loyaltyPoints} pts
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleResetPassword(user)}
                                            disabled={isResetting === user.id || !user.email}
                                            className="text-brand-primary hover:text-stone-900 dark:hover:text-white font-bold text-sm transition-colors disabled:opacity-30"
                                        >
                                            {isResetting === user.id ? 'Sending...' : 'Reset Password'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden divide-y divide-stone-100 dark:divide-zinc-800">
                    {customers.length > 0 && customers.map(user => (
                        <div key={user.id} className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-stone-900 dark:text-white text-base">{user.name}</div>
                                    <div className="text-[10px] text-stone-400 font-mono mt-1">{user.id}</div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                    {user.loyaltyPoints} pts
                                </span>
                            </div>
                            
                            <div className="text-xs text-stone-600 dark:text-zinc-400 bg-stone-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                                {user.email || <span className="text-stone-300 italic">No email associated</span>}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <select 
                                    value={user.role}
                                    onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                    className="bg-stone-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 appearance-none"
                                >
                                    <option value={UserRole.CUSTOMER}>Customer</option>
                                    <option value={UserRole.KITCHEN}>Kitchen</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                </select>
                                
                                <button 
                                    onClick={() => handleResetPassword(user)}
                                    disabled={isResetting === user.id || !user.email}
                                    className="bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-400 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors disabled:opacity-30"
                                >
                                    {isResetting === user.id ? 'Sending...' : 'Reset Password'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {customers.length === 0 && (
                    <div className="px-6 py-20 text-center text-stone-400 italic font-serif">
                        <div className="mb-4 text-4xl opacity-20">🔍</div>
                        "No customers found matching your search."
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerManagement;
