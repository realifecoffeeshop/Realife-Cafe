import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Discount } from '../../types';

const DiscountManagement: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
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

    const handleDeleteDiscount = (id: string) => {
        if (window.confirm('Are you sure you want to delete this discount?')) {
            dispatch({ type: 'DELETE_DISCOUNT', payload: id });
            addToast('Discount deleted.', 'success');
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Add New Discount</h2>
                <form onSubmit={handleAddDiscount} className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Discount Code</label>
                        <input name="code" required className="mt-1 w-full p-2 border rounded-md border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 dark:text-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Type</label>
                        <select name="type" required className="mt-1 w-full p-2 border rounded-md border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 dark:text-white">
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Value</label>
                        <input name="value" type="number" step="0.01" required className="mt-1 w-full p-2 border rounded-md border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 dark:text-white"/>
                    </div>
                    <button type="submit" className="bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 px-4 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 h-10">Add Discount</button>
                </form>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Existing Discounts</h2>
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 dark:text-zinc-400">
                        <thead className="text-xs text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Code</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Value</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.discounts.map(discount => (
                                <tr key={discount.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{discount.code}</td>
                                    <td className="px-6 py-4 capitalize">{discount.type}</td>
                                    <td className="px-6 py-4">{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDeleteDiscount(discount.id)} className="text-red-600 hover:underline">Delete</button>
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

export default DiscountManagement;