import React, { useContext, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../shared/ConfirmationModal';
import { Discount } from '../../types';

const DiscountManagement: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();

    const handleAddDiscount = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newDiscount: Discount = {
            id: `disc-${Date.now()}`,
            code: (formData.get('code') as string).toUpperCase(),
            type: formData.get('type') as 'percentage' | 'fixed',
            value: parseFloat(formData.get('value') as string),
        };
        dispatch({ type: 'ADD_DISCOUNT', payload: newDiscount });
        addToast(`Discount '${newDiscount.code}' added.`, 'success');
        e.currentTarget.reset();
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const handleDeleteDiscount = (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDeleteDiscount = () => {
        if (!showDeleteConfirm) return;
        dispatch({ type: 'DELETE_DISCOUNT', payload: showDeleteConfirm });
        addToast('Discount deleted.', 'success');
        setShowDeleteConfirm(null);
    };

    return (
        <div className="p-8 space-y-12">
            <header className="pb-6 border-b border-stone-100 dark:border-zinc-800">
                <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Discount Management</h2>
                <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">Create and manage promotional codes.</p>
            </header>

            <section>
                <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mb-6">Add New Discount</h3>
                <form onSubmit={handleAddDiscount} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Discount Code</label>
                        <input 
                            name="code" 
                            required 
                            placeholder="e.g. SUMMER25"
                            className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border-none rounded-xl text-sm text-stone-900 dark:text-white placeholder:text-stone-300 focus:ring-2 focus:ring-stone-200 dark:focus:ring-zinc-700 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Type</label>
                        <select 
                            name="type" 
                            required 
                            className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border-none rounded-xl text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-200 dark:focus:ring-zinc-700 transition-all cursor-pointer"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Value</label>
                        <input 
                            name="value" 
                            type="number" 
                            step="0.01" 
                            required 
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border-none rounded-xl text-sm text-stone-900 dark:text-white placeholder:text-stone-300 focus:ring-2 focus:ring-stone-200 dark:focus:ring-zinc-700 transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-sm h-[42px]"
                    >
                        Add Discount
                    </button>
                </form>
            </section>
            
            <section>
                <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mb-6">Existing Discounts</h3>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-stone-400 dark:text-zinc-500 uppercase tracking-widest bg-stone-50/50 dark:bg-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold">Code</th>
                                <th scope="col" className="px-6 py-4 font-bold">Type</th>
                                <th scope="col" className="px-6 py-4 font-bold">Value</th>
                                <th scope="col" className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-zinc-800">
                            {(state.discounts || []).map(discount => (
                                <tr key={discount.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-5 font-bold text-stone-900 dark:text-white tracking-wider">{discount.code}</td>
                                    <td className="px-6 py-5">
                                        <span className="capitalize text-stone-500 dark:text-zinc-400">{discount.type}</span>
                                    </td>
                                    <td className="px-6 py-5 font-serif font-bold text-stone-900 dark:text-white text-base">
                                        {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button onClick={() => handleDeleteDiscount(discount.id)} className="text-red-400 hover:text-red-600 transition-colors font-medium">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(state.discounts || []).length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-stone-400 dark:text-zinc-500 italic">No active discounts found.</p>
                        </div>
                    )}
                </div>
            </section>
            {showDeleteConfirm && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    onConfirm={confirmDeleteDiscount}
                    title="Delete Discount"
                    message="Are you sure you want to delete this discount?"
                />
            )}
        </div>
    );
};

export default DiscountManagement;