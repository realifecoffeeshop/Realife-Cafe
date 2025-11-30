
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Drink, ModifierGroup, ModifierOption, Category } from '../../types';
import Modal from '../shared/Modal';

// A sub-component for the Modifier Group form to keep the main component cleaner
const ModifierGroupForm: React.FC<{
    group: ModifierGroup;
    onSave: (group: ModifierGroup) => void;
    onClose: () => void;
}> = ({ group, onSave, onClose }) => {
    const [name, setName] = useState(group.name);
    const [options, setOptions] = useState<ModifierOption[]>(group.options.map(o => ({...o})));
    const { addToast } = useToast();

    const handleOptionChange = (index: number, field: keyof ModifierOption, value: string | number) => {
        const newOptions = [...options];
        (newOptions[index] as any)[field] = field === 'name' ? value : parseFloat(value as string);
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { id: `new-opt-${Date.now()}`, name: '', price: 0, cost: 0 }]);
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addToast('Group name cannot be empty.', 'error');
            return;
        }
        const hasEmptyOptionName = options.some(opt => !opt.name.trim());
        if (hasEmptyOptionName) {
            addToast('Modifier option names cannot be empty.', 'error');
            return;
        }
        
        // Trim names before saving
        const cleanedOptions = options.map(opt => ({ ...opt, name: opt.name.trim() }));
        onSave({ ...group, name: name.trim(), options: cleanedOptions });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-stone-800 dark:text-zinc-200">
            <div>
                <label className="block mb-1 font-medium">Group Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
            </div>
            <div>
                <h4 className="font-medium mb-2">Options</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {options.map((option, index) => (
                    <div key={option.id} className="grid grid-cols-12 gap-2 items-center">
                        <input value={option.name} onChange={(e) => handleOptionChange(index, 'name', e.target.value)} placeholder="Name" className="col-span-4 p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                        <input type="number" step="0.01" value={option.price} onChange={(e) => handleOptionChange(index, 'price', e.target.value)} placeholder="Price" className="col-span-3 p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                        <input type="number" step="0.01" value={option.cost} onChange={(e) => handleOptionChange(index, 'cost', e.target.value)} placeholder="Cost" className="col-span-3 p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                        <button type="button" onClick={() => removeOption(index)} className="col-span-2 text-red-500 hover:text-red-700 justify-self-center">Remove</button>
                    </div>
                ))}
                </div>
                <button type="button" onClick={addOption} className="mt-3 text-sm text-stone-700 dark:text-zinc-300 hover:underline">Add Option</button>
            </div>
            <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 bg-stone-200 dark:bg-zinc-600 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md">Save Group</button>
            </div>
        </form>
    );
};


const MenuManagement: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { addToast } = useToast();
    const [editingDrink, setEditingDrink] = useState<Partial<Drink> | null>(null);
    const [drinkFormState, setDrinkFormState] = useState<Partial<Drink> | null>(null);
    const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
    
    useEffect(() => {
        if (editingDrink) {
            const defaultCategoryId = state.categories.find(c => c.name === 'Uncategorised')?.id || state.categories[0]?.id || '';
            const initialState: Partial<Drink> = editingDrink.id 
              ? { ...editingDrink } 
              : { name: '', basePrice: 0, baseCost: 0, imageUrl: '', modifierGroups: [], category: defaultCategoryId };
            setDrinkFormState(initialState);
            
            if (initialState.imageUrl && initialState.imageUrl.startsWith('data:image')) {
                setImageSource('upload');
            } else {
                setImageSource('url');
            }
        } else {
            setDrinkFormState(null);
        }
    }, [editingDrink, state.categories]);

    useEffect(() => {
        if (editingCategory) {
            setCategoryName(editingCategory.name || '');
        }
    }, [editingCategory]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (e.target.tagName === 'SELECT' && name === 'modifierGroups') {
            const selectedOptions = Array.from((e.target as HTMLSelectElement).options)
                .filter(o => o.selected)
                .map(o => o.value);
            setDrinkFormState(prev => prev ? { ...prev, [name]: selectedOptions } : null);
        } else {
            setDrinkFormState(prev => prev ? { ...prev, [name]: type === 'number' ? parseFloat(value) : value } : null);
        }
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDrinkFormState(prev => prev ? { ...prev, imageUrl: reader.result as string } : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveDrink = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!drinkFormState || !drinkFormState.name || !drinkFormState.name.trim()) {
            addToast('Drink name cannot be empty.', 'error');
            return;
        }

        const drink: Drink = {
            id: editingDrink?.id || `drink-${Date.now()}`,
            name: drinkFormState.name.trim(),
            category: drinkFormState.category || '',
            basePrice: drinkFormState.basePrice || 0,
            baseCost: drinkFormState.baseCost || 0,
            imageUrl: drinkFormState.imageUrl || '',
            modifierGroups: drinkFormState.modifierGroups || [],
        };
        dispatch({ type: editingDrink?.id ? 'UPDATE_DRINK' : 'ADD_DRINK', payload: drink });
        addToast(`Drink '${drink.name}' saved successfully!`, 'success');
        setEditingDrink(null);
    }
    
    const handleDeleteDrink = (id: string) => {
        if(window.confirm('Are you sure you want to delete this drink?')) {
            dispatch({ type: 'DELETE_DRINK', payload: id });
            addToast('Drink deleted.', 'success');
        }
    }

    const handleSaveModifierGroup = (group: ModifierGroup) => {
        const actionType = group.id.startsWith('new-group-') ? 'ADD_MODIFIER_GROUP' : 'UPDATE_MODIFIER_GROUP';
        const payload = { ...group };
        if (actionType === 'ADD_MODIFIER_GROUP') {
            payload.id = `mod-group-${Date.now()}`;
        }
        dispatch({ type: actionType, payload });
        addToast(`Modifier group '${group.name}' saved successfully!`, 'success');
        setEditingModifierGroup(null);
    };
    
    const handleDeleteModifierGroup = (id: string) => {
        if (window.confirm('Are you sure you want to delete this modifier group? This might affect drinks using it.')) {
            dispatch({ type: 'DELETE_MODIFIER_GROUP', payload: id });
            addToast('Modifier group deleted.', 'success');
        }
    };
    
    const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            addToast('Category name cannot be empty.', 'error');
            return;
        }
        
        if (editingCategory?.id) {
            // Update
            dispatch({ type: 'UPDATE_CATEGORY', payload: { id: editingCategory.id, name: trimmedName } });
            addToast(`Category '${trimmedName}' updated.`, 'success');
        } else {
            // Add
            dispatch({ type: 'ADD_CATEGORY', payload: { name: trimmedName } });
            addToast(`Category '${trimmedName}' added.`, 'success');
        }
        setEditingCategory(null);
    };

    const handleDeleteCategory = (id: string) => {
        if (id === 'cat-4') {
             addToast("Cannot delete the default 'Uncategorised' category.", 'error');
             return;
        }
        if (window.confirm('Are you sure you want to delete this category? Drinks in it will be moved to "Uncategorised".')) {
            dispatch({ type: 'DELETE_CATEGORY', payload: id });
            addToast('Category deleted.', 'success');
        }
    };
    
    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center pb-4 border-b dark:border-zinc-700">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Live Menu Configuration</h2>
            </div>
            {/* Categories Management */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Categories</h2>
                    <button onClick={() => setEditingCategory({ name: '' })} className="bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 px-4 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200">Add Category</button>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 dark:text-zinc-400">
                        <thead className="text-xs text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.categories.map(cat => (
                                <tr key={cat.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{cat.name}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => setEditingCategory(cat)} className="text-stone-700 dark:text-zinc-300 hover:underline">Edit</button>
                                        {cat.id !== 'cat-4' && ( // Prevent deleting "Uncategorised"
                                           <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:underline">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Drinks Management */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Drinks</h2>
                    <button onClick={() => setEditingDrink({} as Drink)} className="bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 px-4 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200">Add Drink</button>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 dark:text-zinc-400">
                        {/* Table head */}
                        <thead className="text-xs text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Image</th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Price</th>
                                <th scope="col" className="px-6 py-3">Cost</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        {/* Table body */}
                        <tbody>
                            {state.drinks.map(drink => {
                                const categoryName = state.categories.find(c => c.id === drink.category)?.name || 'N/A';
                                return (
                                <tr key={drink.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                                    <td className="px-6 py-4">
                                        {drink.imageUrl ? (
                                            <img src={drink.imageUrl} alt={drink.name} className="w-10 h-10 rounded-md object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-md bg-stone-200 dark:bg-zinc-700 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{drink.name}</td>
                                    <td className="px-6 py-4">{categoryName}</td>
                                    <td className="px-6 py-4">${drink.basePrice.toFixed(2)}</td>
                                    <td className="px-6 py-4">${drink.baseCost.toFixed(2)}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => setEditingDrink(drink)} className="text-stone-700 dark:text-zinc-300 hover:underline">Edit</button>
                                        <button onClick={() => handleDeleteDrink(drink.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modifier Groups Management */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Modifier Groups</h2>
                    <button onClick={() => setEditingModifierGroup({id: `new-group-${Date.now()}`, name: '', options: []})} className="bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 px-4 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200">Add Group</button>
                </div>
                 <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 dark:text-zinc-400">
                        {/* Table head */}
                        <thead className="text-xs text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Options</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        {/* Table body */}
                        <tbody>
                            {state.modifierGroups.map(group => (
                                <tr key={group.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{group.name}</td>
                                    <td className="px-6 py-4">{group.options.map(o => o.name).join(', ')}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => setEditingModifierGroup(group)} className="text-stone-700 dark:text-zinc-300 hover:underline">Edit</button>
                                        <button onClick={() => handleDeleteModifierGroup(group.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drink Edit/Add Modal */}
            <Modal isOpen={!!editingDrink} onClose={() => setEditingDrink(null)} title={editingDrink?.id ? 'Edit Drink' : 'Add Drink'} helpArticleId="kb-8">
                {drinkFormState && (
                    <form onSubmit={handleSaveDrink} className="space-y-4 text-stone-800 dark:text-zinc-200">
                        <div>
                            <label className="block mb-1 font-medium">Name</label>
                            <input name="name" value={drinkFormState.name || ''} onChange={handleFormChange} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">Base Price</label>
                                <input name="basePrice" type="number" step="0.01" value={drinkFormState.basePrice || ''} onChange={handleFormChange} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Base Cost</label>
                                <input name="baseCost" type="number" step="0.01" value={drinkFormState.baseCost || ''} onChange={handleFormChange} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">Category</label>
                            <select name="category" value={drinkFormState.category || ''} onChange={handleFormChange} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white">
                                {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block mb-2 font-medium">Image Source</label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="imageSource"
                                        value="url"
                                        checked={imageSource === 'url'}
                                        onChange={() => setImageSource('url')}
                                        className="h-4 w-4 text-stone-600 border-stone-300 focus:ring-stone-500"
                                    />
                                    <span>Image URL</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="imageSource"
                                        value="upload"
                                        checked={imageSource === 'upload'}
                                        onChange={() => setImageSource('upload')}
                                        className="h-4 w-4 text-stone-600 border-stone-300 focus:ring-stone-500"
                                    />
                                    <span>Upload File</span>
                                </label>
                            </div>
                        </div>

                        {imageSource === 'url' && (
                            <div>
                                <label className="block mb-1 font-medium">Image URL (Optional)</label>
                                <input name="imageUrl" value={drinkFormState.imageUrl || ''} onChange={handleFormChange} placeholder="https://example.com/image.jpg" className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                            </div>
                        )}
                        
                        {imageSource === 'upload' && (
                            <div>
                                <label className="block mb-1 font-medium">Upload Image File</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-50 dark:file:bg-zinc-600 file:text-stone-700 dark:file:text-zinc-200 hover:file:bg-stone-100 dark:hover:file:bg-zinc-500"/>
                            </div>
                        )}

                        <div>
                            <label className="block mb-1 font-medium">Image Preview</label>
                             {drinkFormState.imageUrl ? (
                                <img src={drinkFormState.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md mt-2" loading="lazy"/>
                             ) : (
                                <div className="w-32 h-32 bg-stone-200 dark:bg-zinc-700 rounded-md mt-2 flex items-center justify-center border border-stone-300 dark:border-zinc-600">
                                    <span className="text-stone-500 dark:text-zinc-400 text-sm">No Image</span>
                                </div>
                             )}
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">Modifier Groups</label>
                            <select name="modifierGroups" multiple value={drinkFormState.modifierGroups || []} onChange={handleFormChange} className="w-full p-2 border rounded-md h-32 bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white">
                                {state.modifierGroups.map(mg => <option key={mg.id} value={mg.id}>{mg.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setEditingDrink(null)} className="px-4 py-2 mr-2 bg-stone-200 dark:bg-zinc-600 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md">Save</button>
                        </div>
                    </form>
                )}
            </Modal>
            
            {/* Category Edit/Add Modal */}
            <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title={editingCategory?.id ? 'Edit Category' : 'Add Category'} helpArticleId="kb-8">
                <form onSubmit={handleSaveCategory} className="space-y-4">
                     <div>
                        <label className="block mb-1 font-medium text-stone-800 dark:text-zinc-200">Category Name</label>
                        <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 mr-2 bg-stone-200 dark:bg-zinc-600 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md">Save</button>
                    </div>
                </form>
            </Modal>

            {/* Modifier Group Edit/Add Modal */}
            <Modal isOpen={!!editingModifierGroup} onClose={() => setEditingModifierGroup(null)} title={editingModifierGroup?.id.startsWith('new-group-') ? 'Add Modifier Group' : 'Edit Modifier Group'} helpArticleId="kb-8">
                {editingModifierGroup && <ModifierGroupForm group={editingModifierGroup} onSave={handleSaveModifierGroup} onClose={() => setEditingModifierGroup(null)} />}
            </Modal>
        </div>
    );
};

export default MenuManagement;
