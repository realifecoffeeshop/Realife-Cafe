import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

const PermissionsManagement: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
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
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">User Permissions</h2>
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 dark:text-zinc-400">
                        <thead className="text-xs text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">User Name</th>
                                <th scope="col" className="px-6 py-3">Current Role</th>
                                <th scope="col" className="px-6 py-3">Set New Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{user.name}</td>
                                    <td className="px-6 py-4">{user.role}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            disabled={user.id === currentUser?.id}
                                            className="p-2 border rounded-md border-stone-300 dark:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-zinc-700 dark:text-white"
                                            aria-label={`Change role for ${user.name}`}
                                        >
                                            {Object.values(UserRole).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
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