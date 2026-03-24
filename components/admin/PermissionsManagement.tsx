import React, { useContext } from 'react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { ChevronDown } from 'lucide-react';

const PermissionsManagement: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const { users, currentUser } = state;

    const handleRoleChange = (userId: string, role: UserRole) => {
        if (userId === currentUser?.id) {
            addToast("For security reasons, you cannot change your own role.", 'error');
            return;
        }
        dispatch({ type: 'UPDATE_USER_ROLE', payload: { userId, role } });
        addToast(`User role updated successfully.`, 'success');
    };

    return (
        <div className="p-8 space-y-10">
            <header className="pb-10 border-b border-stone-100 dark:border-zinc-800">
                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">User Permissions</h2>
                <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Manage access levels and roles for your team with precision.</p>
            </header>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em] bg-stone-50/50 dark:bg-zinc-800/30">
                            <tr>
                                <th scope="col" className="px-8 py-5 font-bold">User</th>
                                <th scope="col" className="px-8 py-5 font-bold">Current Role</th>
                                <th scope="col" className="px-8 py-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                            {(users || []).filter(u => u && u.id).map(user => (
                                <tr key={user.id} className="hover:bg-stone-50/30 dark:hover:bg-zinc-800/20 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 font-bold text-sm shadow-inner border border-stone-100 dark:border-zinc-700">
                                                {(user.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-serif font-bold text-stone-900 dark:text-white text-base tracking-tight">{user.name || 'Unknown'}</span>
                                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">ID: {user.id?.slice(-8).toUpperCase() || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                            user.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                            user.role === UserRole.KITCHEN ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                            'bg-stone-50 text-stone-700 border-stone-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="relative inline-block">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                disabled={user.id === currentUser?.id}
                                                className="pl-4 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:ring-4 focus:ring-stone-900/5 dark:focus:ring-white/5 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none shadow-sm font-serif italic"
                                                aria-label={`Change role for ${user.name}`}
                                            >
                                                {Object.values(UserRole).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PermissionsManagement;