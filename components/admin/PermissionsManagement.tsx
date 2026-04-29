import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { updateUser, deleteUser as firestoreDeleteUser } from '../../firebase/firestoreService';
import { ChevronDown, Search, Filter, ShieldCheck, Users, Info, UserPlus, UserCircle, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ROLE_PERMISSIONS = {
    [UserRole.ADMIN]: {
        title: 'Administrator',
        description: 'Full access to all systems, financial data, menu, and user management.',
        capabilities: [
            'Manage Menu & Inventory',
            'Edit User Permissions',
            'View Financial Reports',
            'Create Discount Codes',
            'Manage Order History',
            'Access Developer Tools'
        ],
        color: 'amber'
    },
    [UserRole.KITCHEN]: {
        title: 'Kitchen Staff',
        description: 'Access to KDS (Kitchen Display System) and customer order tracking.',
        capabilities: [
            'View & Manage Active Orders',
            'Mark Orders as Complete',
            'View User Directory',
            'Receive Feedback Notifications'
        ],
        color: 'blue'
    },
    [UserRole.CUSTOMER]: {
        title: 'Customer',
        description: 'Standard ordering access. No management privileges.',
        capabilities: [
            'Browse Menu',
            'Place Orders',
            'Manage Own Profile',
            'Redeem Loyalty Points'
        ],
        color: 'stone'
    }
};

const PermissionsManagement: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const { users, currentUser } = state;
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [showRoleInfo, setShowRoleInfo] = useState<UserRole | null>(null);

    const filteredUsers = useMemo(() => {
        return (users || []).filter(u => {
            if (!u) return false;
            const matchesSearch = 
                (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    const handleRoleChange = async (userId: string, role: UserRole) => {
        if (userId === currentUser?.id) {
            addToast("For security reasons, you cannot change your own role.", 'error');
            return;
        }
        try {
            await updateUser(userId, { role });
            dispatch({ type: 'UPDATE_USER_ROLE', payload: { userId, role } });
            addToast(`User role updated to ${role} successfully.`, 'success');
        } catch (err) {
            console.error("Failed to update user role:", err);
            addToast("Failed to update role", "error");
        }
    };

    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        const { id: userId, name: userName } = userToDelete;
        const nameToDisplay = userName || 'this user';
        
        setIsDeleting(true);
        try {
            await firestoreDeleteUser(userId);
            dispatch({ type: 'DELETE_USER', payload: userId });
            addToast(`User ${nameToDisplay} removed successfully.`, "success");
            setUserToDelete(null);
        } catch (error: any) {
            console.error("Delete user error:", error);
            addToast("Failed to delete user: " + error.message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
    const kitchenCount = users.filter(u => u.role === UserRole.KITCHEN).length;
    const customerCount = users.filter(u => u.role === UserRole.CUSTOMER).length;

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-stone-100 dark:border-zinc-800">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Staff & Permissions</h2>
                    <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Control access levels and review organizational hierarchy.</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest mb-0.5">Admins</div>
                        <div className="text-2xl font-serif font-bold text-amber-900 dark:text-amber-100">{adminCount}</div>
                    </div>
                    <div className="px-5 py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-0.5">Kitchen</div>
                        <div className="text-2xl font-serif font-bold text-blue-900 dark:text-blue-100">{kitchenCount}</div>
                    </div>
                </div>
            </header>

            {/* Role Guide Quick Review */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(ROLE_PERMISSIONS).map(([role, info]) => (
                    <div 
                        key={role}
                        onClick={() => setShowRoleInfo(role as UserRole)}
                        className={`group p-6 rounded-3xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
                            showRoleInfo === role 
                                ? 'bg-white dark:bg-zinc-800 border-stone-900 dark:border-white' 
                                : 'bg-stone-50/50 dark:bg-zinc-900/50 border-stone-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' :
                                role === UserRole.KITCHEN ? 'bg-blue-100 text-blue-600' :
                                'bg-stone-200 text-stone-600'
                            }`}>
                                {role === UserRole.ADMIN ? <ShieldCheck size={24} /> :
                                 role === UserRole.KITCHEN ? <Users size={24} /> :
                                 <UserCircle size={24} />}
                            </div>
                            <Info size={16} className="text-stone-300 group-hover:text-stone-500 transition-colors" />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">{info.title}</h3>
                        <p className="text-xs text-stone-400 dark:text-zinc-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                            {info.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Modal for Role review */}
            <AnimatePresence>
                {showRoleInfo && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
                        onClick={() => setShowRoleInfo(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 dark:border-zinc-800"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`p-10 ${
                                showRoleInfo === UserRole.ADMIN ? 'bg-amber-50/50 dark:bg-amber-900/10' :
                                showRoleInfo === UserRole.KITCHEN ? 'bg-blue-50/50 dark:bg-blue-900/10' :
                                'bg-stone-50/50 dark:bg-stone-900/10'
                            }`}>
                                <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-white">
                                    {ROLE_PERMISSIONS[showRoleInfo].title}
                                </h3>
                                <p className="text-stone-500 dark:text-zinc-400 mt-3 font-medium text-sm">
                                    {ROLE_PERMISSIONS[showRoleInfo].description}
                                </p>
                            </div>
                            
                            <div className="p-10 space-y-8">
                                <section>
                                    <h4 className="text-[10px] text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] mb-4">Included Capabilities</h4>
                                    <ul className="space-y-3">
                                        {ROLE_PERMISSIONS[showRoleInfo].capabilities.map((cap, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-serif italic text-stone-700 dark:text-zinc-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-white" />
                                                {cap}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                                
                                <button 
                                    onClick={() => setShowRoleInfo(null)}
                                    className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-serif font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98]"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Management Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input 
                        type="text"
                        placeholder="Search by name, email or ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all font-serif italic"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <select 
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value as any)}
                            className="pl-11 pr-10 py-4 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-stone-900/5 outline-none font-serif italic text-sm appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Roles</option>
                            <option value={UserRole.ADMIN}>Administrators Only</option>
                            <option value={UserRole.KITCHEN}>Kitchen Staff Only</option>
                            <option value={UserRole.CUSTOMER}>Customers Only</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden">
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50/50 dark:bg-zinc-800/30 border-b border-stone-50 dark:border-zinc-800/50">
                            <tr>
                                <th className="px-8 py-6 text-[10px] text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em]">User Profile</th>
                                <th className="px-8 py-6 text-[10px] text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em]">Role Assignment</th>
                                <th className="px-8 py-6 text-[10px] text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-stone-50/30 dark:hover:bg-zinc-800/20 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-[1.25rem] bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 font-bold text-xl shadow-inner border border-stone-100 dark:border-zinc-700 relative group">
                                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                                    {user.id === currentUser?.id && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-serif font-bold text-stone-900 dark:text-white text-lg tracking-tight truncate max-w-[200px]">
                                                        {user.name || 'Unknown User'}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 mt-1">
                                                        {user.email || 'No email provided'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <span className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border ${
                                                    user.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                                    user.role === UserRole.KITCHEN ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                                    'bg-stone-50 text-stone-700 border-stone-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                                }`}>
                                                    {ROLE_PERMISSIONS[user.role]?.title || user.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 w-full">
                                                <div className="relative inline-block w-full max-w-[160px]">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                        disabled={user.id === currentUser?.id}
                                                        className="w-full pl-4 pr-10 py-3 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none shadow-sm font-serif italic"
                                                    >
                                                        {Object.values(UserRole).map(role => (
                                                            <option key={role} value={role}>{ROLE_PERMISSIONS[role].title}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                                                </div>
                                                
                                                <button
                                                    onClick={() => setUserToDelete({ id: user.id, name: user.name })}
                                                    disabled={user.id === currentUser?.id}
                                                    className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                                                    title={user.id === currentUser?.id ? "Cannot delete yourself" : `Delete ${user.name}`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : null}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="block sm:hidden divide-y divide-stone-50 dark:divide-zinc-800/50">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <div key={user.id} className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 font-bold text-lg shadow-inner border border-stone-100 dark:border-zinc-700 relative">
                                        {(user.name || 'U').charAt(0).toUpperCase()}
                                        {user.id === currentUser?.id && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-serif font-bold text-stone-900 dark:text-white text-base tracking-tight truncate">
                                            {user.name || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest truncate">
                                            {user.email || 'No email'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Current Role</span>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border ${
                                            user.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                            user.role === UserRole.KITCHEN ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                            'bg-stone-50 text-stone-700 border-stone-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                        }`}>
                                            {ROLE_PERMISSIONS[user.role]?.title || user.role}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                disabled={user.id === currentUser?.id}
                                                className="w-full pl-4 pr-10 py-3 bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none transition-all disabled:opacity-50 appearance-none font-serif italic"
                                            >
                                                {Object.values(UserRole).map(role => (
                                                    <option key={role} value={role}>{ROLE_PERMISSIONS[role].title}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                                        </div>
                                        <button
                                            onClick={() => setUserToDelete({ id: user.id, name: user.name })}
                                            disabled={user.id === currentUser?.id}
                                            className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl transition-all disabled:opacity-20"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>

                {filteredUsers.length === 0 && (
                    <div className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-[2rem] bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-200 dark:text-zinc-700">
                                <Search size={40} />
                            </div>
                            <div>
                                <p className="text-xl font-serif font-bold text-stone-900 dark:text-white">No users found</p>
                                <p className="text-stone-400 dark:text-zinc-500 mt-1 font-medium">Try adjusting your search or filters.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {filteredUsers.length > 0 && (
                    <div className="p-8 bg-stone-50/30 dark:bg-zinc-800/10 border-t border-stone-50 dark:border-zinc-800/50 flex items-center justify-between">
                        <span className="text-xs font-serif italic text-stone-400 dark:text-zinc-500 italic">
                            Showing {filteredUsers.length} of {users.length} users
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                            <Info size={12} />
                            Manage carefully, role changes are immediate.
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {userToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-zinc-800"
                        >
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-stone-900 dark:text-white mb-2">Delete User</h3>
                            <p className="text-center text-stone-600 dark:text-zinc-400 mb-8">
                                Are you sure you want to permanently delete <span className="font-bold text-stone-900 dark:text-white">{userToDelete.name || 'this user'}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setUserToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 font-bold hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PermissionsManagement;
