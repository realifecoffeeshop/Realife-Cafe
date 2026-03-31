
import React, { useState, useContext, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import ConfirmationModal from '../shared/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import { Drink, ModifierGroup, ModifierOption, Category } from '../../types';
import Modal from '../shared/Modal';
import { saveMenu } from '../../firebase/firestoreService';

// A sub-component for the Modifier Group form to keep the main component cleaner
const ModifierGroupForm: React.FC<{
    group: ModifierGroup;
    onSave: (group: ModifierGroup) => void;
    onClose: () => void;
}> = ({ group, onSave, onClose }) => {
    const [name, setName] = useState(group.name || '');
    const [options, setOptions] = useState<ModifierOption[]>((group.options || []).map(o => ({...o})));
    const [isRequired, setIsRequired] = useState(group.isRequired || false);
    const [allowQuantity, setAllowQuantity] = useState(group.allowQuantity || false);
    const [allowMultiple, setAllowMultiple] = useState(group.allowMultiple || false);
    const [defaultOptionId, setDefaultOptionId] = useState(group.defaultOptionId || '');
    const { addToast } = useToast();

    const handleOptionChange = (index: number, field: keyof ModifierOption, value: string | number) => {
        const newOptions = [...options];
        if (field === 'name') {
            newOptions[index].name = value as string;
        } else {
            const parsed = parseFloat(value as string);
            (newOptions[index] as any)[field] = isNaN(parsed) ? 0 : parsed;
        }
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
        onSave({ 
            ...group, 
            name: name.trim(), 
            options: cleanedOptions,
            isRequired,
            allowQuantity,
            allowMultiple,
            defaultOptionId: isRequired ? defaultOptionId : undefined
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Group Name</label>
                <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-zinc-600 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all font-serif font-bold text-lg"
                    placeholder="e.g. Milk Options"
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all group">
                    <input 
                        type="checkbox" 
                        checked={isRequired} 
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="w-5 h-5 rounded border-stone-200 text-stone-900 focus:ring-stone-900/10"
                    />
                    <span className="text-sm font-bold text-stone-600 dark:text-zinc-400 tracking-tight">Required</span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all group">
                    <input 
                        type="checkbox" 
                        checked={allowQuantity} 
                        onChange={(e) => setAllowQuantity(e.target.checked)}
                        className="w-5 h-5 rounded border-stone-200 text-stone-900 focus:ring-stone-900/10"
                    />
                    <span className="text-sm font-bold text-stone-600 dark:text-zinc-400 tracking-tight">Quantity</span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all group">
                    <input 
                        type="checkbox" 
                        checked={allowMultiple} 
                        onChange={(e) => setAllowMultiple(e.target.checked)}
                        className="w-5 h-5 rounded border-stone-200 text-stone-900 focus:ring-stone-900/10"
                    />
                    <span className="text-sm font-bold text-stone-600 dark:text-zinc-400 tracking-tight">Multiple</span>
                </label>
            </div>

            {isRequired && (
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Default Selection</label>
                    <select 
                        value={defaultOptionId} 
                        onChange={(e) => setDefaultOptionId(e.target.value)}
                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white font-serif font-bold text-lg focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select a default...</option>
                        {options.map(opt => (
                            <option key={opt?.id} value={opt?.id}>{opt?.name || 'Unnamed Option'}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Options</h4>
                    <button type="button" onClick={addOption} className="text-[10px] font-bold uppercase tracking-widest text-stone-900 dark:text-white hover:underline transition-all">Add Option</button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {options.map((option, index) => (
                    <div key={option?.id || index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-stone-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800 group transition-all hover:bg-white dark:hover:bg-zinc-800">
                        <div className="col-span-1 sm:col-span-5 space-y-1">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Name</label>
                            <input value={option?.name || ''} onChange={(e) => handleOptionChange(index, 'name', e.target.value)} placeholder="Name" className="w-full bg-transparent border-none p-0 text-stone-900 dark:text-white font-serif font-bold text-base focus:ring-0 placeholder-stone-300"/>
                        </div>
                        <div className="col-span-1 sm:col-span-3 space-y-1">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Price</label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold text-xs">$</span>
                                <input type="number" step="0.01" value={option?.price || 0} onChange={(e) => handleOptionChange(index, 'price', e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none pl-3 p-0 text-stone-900 dark:text-white font-serif font-bold text-base focus:ring-0 placeholder-stone-300"/>
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-3 space-y-1">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Cost</label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold text-xs">$</span>
                                <input type="number" step="0.01" value={option?.cost || 0} onChange={(e) => handleOptionChange(index, 'cost', e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none pl-3 p-0 text-stone-900 dark:text-white font-serif font-bold text-base focus:ring-0 placeholder-stone-300"/>
                            </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <button type="button" onClick={() => removeOption(index)} className="text-red-400 hover:text-red-600 transition-all p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-8">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-10 py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 font-serif italic"
                >
                    Save Group
                </button>
            </div>
        </form>
    );
};


const MenuManagement: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const [editingDrink, setEditingDrink] = useState<Partial<Drink> | null>(null);
    const [drinkFormState, setDrinkFormState] = useState<Partial<Drink> | null>(null);
    const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'category' | 'drink' | 'modifier'; id: string } | null>(null);
    const [showSyncConfirm, setShowSyncConfirm] = useState(false);
    
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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (e.target.tagName === 'SELECT' && name === 'modifierGroups') {
            const selectedOptions = Array.from((e.target as HTMLSelectElement).options)
                .filter(o => o.selected)
                .map(o => o.value);
            setDrinkFormState(prev => prev ? { ...prev, [name]: selectedOptions } : null);
        } else {
            let finalValue: string | number = value;
            if (type === 'number') {
                const parsed = parseFloat(value);
                finalValue = isNaN(parsed) ? 0 : parsed;
            }
            setDrinkFormState(prev => prev ? { ...prev, [name]: finalValue } : null);
        }
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                // Compress image to avoid "Write too large" errors in Firebase
                try {
                    const compressed = await compressImage(base64);
                    setDrinkFormState(prev => prev ? { ...prev, imageUrl: compressed } : null);
                } catch (error) {
                    console.error("Image compression failed:", error);
                    setDrinkFormState(prev => prev ? { ...prev, imageUrl: base64 } : null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper to compress base64 images
    const compressImage = (base64Str: string, maxWidth = 600, maxHeight = 600, quality = 0.6): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleSaveDrink = async (e: React.FormEvent<HTMLFormElement>) => {
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
            description: drinkFormState.description || '',
            modifierGroups: drinkFormState.modifierGroups || [],
            variants: drinkFormState.variants || [],
        };

        // Optimistic update
        dispatch({ type: editingDrink?.id ? 'UPDATE_DRINK' : 'ADD_DRINK', payload: drink });
        
        try {
            const updatedDrinks = editingDrink?.id 
                ? state.drinks.map(d => d.id === editingDrink.id ? drink : d)
                : [...state.drinks, drink];
            await saveMenu({ drinks: updatedDrinks, categories: state.categories, modifierGroups: state.modifierGroups });
            addToast(`Drink '${drink.name}' saved successfully!`, 'success');
        } catch (error) {
            console.error("Failed to save drink to Firebase:", error);
            addToast('Failed to save to database.', 'error');
        }
        
        setEditingDrink(null);
    }
    
    const handleDeleteDrink = (id: string) => {
        setShowDeleteConfirm({ type: 'drink', id });
    };

    const confirmDeleteDrink = async () => {
        if (!showDeleteConfirm) return;
        const id = showDeleteConfirm.id;
        dispatch({ type: 'DELETE_DRINK', payload: id });
        try {
            const updatedDrinks = state.drinks.filter(d => d.id !== id);
            await saveMenu({ drinks: updatedDrinks, categories: state.categories, modifierGroups: state.modifierGroups });
            addToast('Drink deleted.', 'success');
        } catch (error) {
            addToast('Failed to delete from database.', 'error');
        }
        setShowDeleteConfirm(null);
    };

    const handleSaveModifierGroup = async (group: ModifierGroup) => {
        const isNew = group.id.startsWith('new-group-');
        const actionType = isNew ? 'ADD_MODIFIER_GROUP' : 'UPDATE_MODIFIER_GROUP';
        const payload = { ...group };
        if (isNew) {
            payload.id = `mod-group-${Date.now()}`;
        }
        dispatch({ type: actionType, payload });

        try {
            const updatedGroups = isNew 
                ? [...state.modifierGroups, payload]
                : state.modifierGroups.map(g => g.id === payload.id ? payload : g);
            await saveMenu({ drinks: state.drinks, categories: state.categories, modifierGroups: updatedGroups });
            addToast(`Modifier group '${group.name}' saved successfully!`, 'success');
        } catch (error) {
            addToast('Failed to save modifier group to database.', 'error');
        }
        setEditingModifierGroup(null);
    };

    const handleDeleteModifierGroup = (id: string) => {
        setShowDeleteConfirm({ type: 'modifier', id });
    };

    const confirmDeleteModifierGroup = async () => {
        if (!showDeleteConfirm) return;
        const id = showDeleteConfirm.id;
        dispatch({ type: 'DELETE_MODIFIER_GROUP', payload: id });
        try {
            const updatedGroups = state.modifierGroups.filter(g => g.id !== id);
            await saveMenu({ drinks: state.drinks, categories: state.categories, modifierGroups: updatedGroups });
            addToast('Modifier group deleted.', 'success');
        } catch (error) {
            addToast('Failed to delete from database.', 'error');
        }
        setShowDeleteConfirm(null);
    };
    
    const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            addToast('Category name cannot be empty.', 'error');
            return;
        }
        
        if (editingCategory?.id) {
            // Update
            dispatch({ type: 'UPDATE_CATEGORY', payload: { id: editingCategory.id, name: trimmedName } });
            try {
                const updatedCategories = state.categories.map(c => c.id === editingCategory.id ? { ...c, name: trimmedName } : c);
                await saveMenu({ drinks: state.drinks, categories: updatedCategories, modifierGroups: state.modifierGroups });
                addToast(`Category '${trimmedName}' updated.`, 'success');
            } catch (error) {
                addToast('Failed to update category in database.', 'error');
            }
        } else {
            // Add
            const newCategory = { id: `cat-${Date.now()}`, name: trimmedName };
            dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
            try {
                const updatedCategories = [...state.categories, newCategory];
                await saveMenu({ drinks: state.drinks, categories: updatedCategories, modifierGroups: state.modifierGroups });
                addToast(`Category '${trimmedName}' added.`, 'success');
            } catch (error) {
                addToast('Failed to add category to database.', 'error');
            }
        }
        setEditingCategory(null);
    };

    const handleDeleteCategory = (id: string) => {
        if (id === 'cat-4') {
             addToast("Cannot delete the default 'Uncategorised' category.", 'error');
             return;
        }
        setShowDeleteConfirm({ type: 'category', id });
    };

    const confirmDeleteCategory = async () => {
        if (!showDeleteConfirm) return;
        const id = showDeleteConfirm.id;
        dispatch({ type: 'DELETE_CATEGORY', payload: id });
        try {
            const updatedCategories = state.categories.filter(c => c.id !== id);
            await saveMenu({ drinks: state.drinks, categories: updatedCategories, modifierGroups: state.modifierGroups });
            addToast('Category deleted.', 'success');
        } catch (error) {
            addToast('Failed to delete category from database.', 'error');
        }
        setShowDeleteConfirm(null);
    };

    const handleSyncDescriptions = async () => {
        const { INITIAL_DRINKS } = await import('../../constants');
        const updatedDrinks = state.drinks.map(drink => {
            const defaultDrink = INITIAL_DRINKS.find(d => d.id === drink.id);
            if (defaultDrink && defaultDrink.description) {
                return { ...drink, description: defaultDrink.description };
            }
            return drink;
        });

        // Update state
        updatedDrinks.forEach(drink => {
            dispatch({ type: 'UPDATE_DRINK', payload: drink });
        });

        try {
            await saveMenu({ drinks: updatedDrinks, categories: state.categories, modifierGroups: state.modifierGroups });
            addToast('Drink descriptions synced with defaults!', 'success');
        } catch (error) {
            console.error("Failed to sync descriptions:", error);
            addToast('Failed to sync with database.', 'error');
        }
        setShowSyncConfirm(false);
    };
    
    return (
        <div className="p-8 space-y-10">
            <header className="pb-10 border-b border-stone-100 dark:border-zinc-800">
                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Menu Configuration</h2>
                <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Manage your categories, drinks, and modifiers with elegance.</p>
            </header>
            
            {/* Categories Management */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Categories</h3>
                    <button 
                        onClick={() => setEditingCategory({ name: '' })} 
                        className="w-full sm:w-auto bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-8 py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 font-serif italic"
                    >
                        Add Category
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {(state.categories || []).filter(c => c && c.id).map(cat => (
                        <div key={cat.id} className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-800 flex justify-between items-center group hover:border-stone-900 dark:hover:border-white transition-all duration-300">
                            <span className="font-serif font-bold text-stone-900 dark:text-white text-base tracking-tight">{cat.name || 'Unnamed'}</span>
                            <div className="flex gap-4">
                                <button onClick={() => setEditingCategory(cat)} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all">Edit</button>
                                {cat.id !== 'cat-4' && (
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-all">Delete</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* Drinks Management */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Drinks</h3>
                        <button 
                            onClick={() => setShowSyncConfirm(true)}
                            className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all text-left"
                        >
                            Sync Default Descriptions
                        </button>
                    </div>
                    <button 
                        onClick={() => setEditingDrink({} as Drink)} 
                        className="w-full sm:w-auto bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-8 py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 font-serif italic"
                    >
                        Add Drink
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {(state.drinks || []).map(drink => {
                        const categoryName = (state.categories || []).find(c => c.id === drink.category)?.name || 'N/A';
                        return (
                            <div key={drink.id} className="bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-800 flex items-center justify-between group hover:border-stone-900 dark:hover:border-white transition-all duration-300">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-50 dark:bg-zinc-800 flex-shrink-0 border border-stone-100 dark:border-zinc-700 shadow-inner">
                                        {drink.imageUrl ? (
                                            <img src={drink.imageUrl} alt={drink.name || 'Drink'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-serif font-bold text-stone-900 dark:text-white text-base tracking-tight truncate">{drink.name || 'Unnamed'}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">{categoryName}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-8 ml-4">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Price</span>
                                        <span className="font-serif font-bold text-stone-900 dark:text-white text-sm">${(drink.basePrice || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setEditingDrink(drink)} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all">Edit</button>
                                        <button onClick={() => handleDeleteDrink(drink.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-all">Delete</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Modifier Groups Management */}
            <section className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Modifier Groups</h3>
                    <button 
                        onClick={() => setEditingModifierGroup({id: `new-group-${Date.now()}`, name: '', options: [], isRequired: false})} 
                        className="w-full sm:w-auto bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-8 py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 font-serif italic"
                    >
                        Add Group
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {(state.modifierGroups || []).map(group => (
                        <div key={group.id} className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-800 flex items-center justify-between group hover:border-stone-900 dark:hover:border-white transition-all duration-300">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex flex-col min-w-0">
                                    <span className="font-serif font-bold text-stone-900 dark:text-white text-base tracking-tight truncate">{group?.name || 'Unnamed'}</span>
                                    <div className="flex items-center gap-2">
                                        {group.isRequired ? (
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Required</span>
                                        ) : (
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Optional</span>
                                        )}
                                        <span className="text-[8px] text-stone-300">•</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400 truncate">
                                            {(group.options || []).length} Options
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 ml-4">
                                <button onClick={() => setEditingModifierGroup(group)} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all">Edit</button>
                                <button onClick={() => handleDeleteModifierGroup(group.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-all">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Drink Edit/Add Modal */}
            <Modal isOpen={!!editingDrink} onClose={() => setEditingDrink(null)} title={editingDrink?.id ? 'Edit Drink' : 'Add Drink'}>
                {drinkFormState && (
                    <form onSubmit={handleSaveDrink} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Drink Name</label>
                            <input 
                                name="name" 
                                value={drinkFormState.name || ''} 
                                onChange={handleFormChange} 
                                required 
                                className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-zinc-600 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all font-serif font-bold text-lg"
                                placeholder="e.g. Honey Lavender Latte"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Base Price</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold">$</span>
                                    <input 
                                        name="basePrice" 
                                        type="number" 
                                        step="0.01" 
                                        value={drinkFormState.basePrice || ''} 
                                        onChange={handleFormChange} 
                                        required 
                                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl pl-10 pr-6 py-4 text-stone-900 dark:text-white font-serif font-bold text-lg focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Base Cost</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold">$</span>
                                    <input 
                                        name="baseCost" 
                                        type="number" 
                                        step="0.01" 
                                        value={drinkFormState.baseCost || ''} 
                                        onChange={handleFormChange} 
                                        required 
                                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl pl-10 pr-6 py-4 text-stone-900 dark:text-white font-serif font-bold text-lg focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Category</label>
                            <select 
                                name="category" 
                                value={drinkFormState.category || ''} 
                                onChange={handleFormChange} 
                                required 
                                className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white font-serif font-bold text-lg focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all appearance-none cursor-pointer"
                            >
                                {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Visual Identity</label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 bg-stone-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-stone-100 dark:border-zinc-800">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${imageSource === 'url' ? 'border-stone-900 dark:border-white' : 'border-stone-200 dark:border-zinc-700'}`}>
                                        {imageSource === 'url' && <div className="w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-white" />}
                                    </div>
                                    <input type="radio" name="imageSource" value="url" checked={imageSource === 'url'} onChange={() => setImageSource('url')} className="hidden" />
                                    <span className={`text-sm font-bold tracking-tight transition-all ${imageSource === 'url' ? 'text-stone-900 dark:text-white' : 'text-stone-400'}`}>Image URL</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${imageSource === 'upload' ? 'border-stone-900 dark:border-white' : 'border-stone-200 dark:border-zinc-700'}`}>
                                        {imageSource === 'upload' && <div className="w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-white" />}
                                    </div>
                                    <input type="radio" name="imageSource" value="upload" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} className="hidden" />
                                    <span className={`text-sm font-bold tracking-tight transition-all ${imageSource === 'upload' ? 'text-stone-900 dark:text-white' : 'text-stone-400'}`}>Upload File</span>
                                </label>
                            </div>
                        </div>

                        {imageSource === 'url' && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Image URL</label>
                                <input 
                                    name="imageUrl" 
                                    value={drinkFormState.imageUrl || ''} 
                                    onChange={handleFormChange} 
                                    placeholder="https://images.unsplash.com/..." 
                                    className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-zinc-600 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all font-mono text-xs"
                                />
                            </div>
                        )}
                        
                        {imageSource === 'upload' && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Upload Image</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full bg-stone-50 dark:bg-zinc-800 border-2 border-dashed border-stone-200 dark:border-zinc-700 rounded-2xl px-6 py-8 text-center transition-all group-hover:border-stone-400 dark:group-hover:border-zinc-500">
                                        <p className="text-sm font-bold text-stone-400 dark:text-zinc-500">Drop image here or click to browse</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Preview</label>
                             <div className="w-40 h-40 rounded-3xl overflow-hidden bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700 shadow-inner">
                                {drinkFormState.imageUrl ? (
                                    <img src={drinkFormState.imageUrl} alt="Preview" className="w-full h-full object-cover" loading="lazy"/>
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-10 h-10 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                 )}
                             </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Description</label>
                            <textarea 
                                name="description" 
                                value={drinkFormState.description || ''} 
                                onChange={handleFormChange} 
                                rows={4}
                                className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-zinc-600 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all font-serif italic text-lg resize-none"
                                placeholder="Describe the flavor profile and ingredients..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Modifier Groups</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl border border-stone-100 dark:border-zinc-800">
                                {state.modifierGroups.map(mg => (
                                    <label key={mg.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer border border-transparent hover:border-stone-100 dark:hover:border-zinc-700">
                                        <input 
                                            type="checkbox" 
                                            checked={(drinkFormState.modifierGroups || []).includes(mg.id)}
                                            onChange={(e) => {
                                                const current = drinkFormState.modifierGroups || [];
                                                const next = e.target.checked 
                                                    ? [...current, mg.id]
                                                    : current.filter(id => id !== mg.id);
                                                setDrinkFormState({ ...drinkFormState, modifierGroups: next });
                                            }}
                                            className="w-5 h-5 rounded border-stone-200 text-stone-900 focus:ring-stone-900/10"
                                        />
                                        <span className="text-sm font-bold text-stone-600 dark:text-zinc-400 tracking-tight">{mg.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Variants (e.g. Sizes)</label>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const current = drinkFormState.variants || [];
                                        setDrinkFormState({
                                            ...drinkFormState,
                                            variants: [...current, { id: `var-${Date.now()}`, name: '', price: drinkFormState.basePrice || 0, cost: drinkFormState.baseCost || 0 }]
                                        });
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-stone-900 dark:text-white hover:underline transition-all"
                                >
                                    Add Variant
                                </button>
                            </div>
                            <div className="space-y-4">
                                {(drinkFormState.variants || []).map((variant, index) => (
                                    <div key={variant.id} className="bg-stone-50 dark:bg-zinc-800/30 p-6 rounded-3xl border border-stone-100 dark:border-zinc-800 group transition-all hover:bg-white dark:hover:bg-zinc-800">
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                            <div className="sm:col-span-5 space-y-2">
                                                <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Variant Name</label>
                                                <input 
                                                    value={variant.name} 
                                                    onChange={(e) => {
                                                        const next = [...(drinkFormState.variants || [])];
                                                        next[index].name = e.target.value;
                                                        setDrinkFormState({ ...drinkFormState, variants: next });
                                                    }} 
                                                    placeholder="e.g. Large" 
                                                    className="w-full bg-stone-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white font-serif font-bold text-base focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all border-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-3 space-y-2">
                                                <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Price</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold text-xs">$</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        value={variant.price} 
                                                        onChange={(e) => {
                                                            const next = [...(drinkFormState.variants || [])];
                                                            next[index].price = parseFloat(e.target.value) || 0;
                                                            setDrinkFormState({ ...drinkFormState, variants: next });
                                                        }} 
                                                        placeholder="0.00" 
                                                        className="w-full bg-stone-100 dark:bg-zinc-800 rounded-xl pl-8 pr-4 py-3 text-stone-900 dark:text-white font-serif font-bold text-base focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all border-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="sm:col-span-3 space-y-2">
                                                <label className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Cost</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold text-xs">$</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        value={variant.cost} 
                                                        onChange={(e) => {
                                                            const next = [...(drinkFormState.variants || [])];
                                                            next[index].cost = parseFloat(e.target.value) || 0;
                                                            setDrinkFormState({ ...drinkFormState, variants: next });
                                                        }} 
                                                        placeholder="0.00" 
                                                        className="w-full bg-stone-100 dark:bg-zinc-800 rounded-xl pl-8 pr-4 py-3 text-stone-900 dark:text-white font-serif font-bold text-base focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all border-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="sm:col-span-1 flex justify-end">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const next = (drinkFormState.variants || []).filter((_, i) => i !== index);
                                                        setDrinkFormState({ ...drinkFormState, variants: next });
                                                    }} 
                                                    className="text-red-400 hover:text-red-600 transition-all p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-8">
                            <button 
                                type="button" 
                                onClick={() => setEditingDrink(null)} 
                                className="px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-10 py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 font-serif italic"
                            >
                                Save Product
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
            
            {/* Category Edit/Add Modal */}
            <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title={editingCategory?.id ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSaveCategory} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Category Name</label>
                        <input 
                            value={categoryName} 
                            onChange={(e) => setCategoryName(e.target.value)} 
                            required 
                            className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-zinc-600 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all font-serif font-bold text-lg"
                            placeholder="e.g. Signature Lattes"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setEditingCategory(null)} 
                            className="px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-10 py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 font-serif italic"
                        >
                            Save Category
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modifier Group Edit/Add Modal */}
            <Modal isOpen={!!editingModifierGroup} onClose={() => setEditingModifierGroup(null)} title={editingModifierGroup?.id.startsWith('new-group-') ? 'Add Modifier Group' : 'Edit Modifier Group'}>
                {editingModifierGroup && (
                    <ModifierGroupForm 
                        group={editingModifierGroup} 
                        onSave={handleSaveModifierGroup} 
                        onClose={() => setEditingModifierGroup(null)} 
                    />
                )}
            </Modal>
            {/* Delete Confirmation Modals */}
            {showDeleteConfirm?.type === 'category' && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    onConfirm={confirmDeleteCategory}
                    title="Delete Category"
                    message="Are you sure you want to delete this category? All drinks in this category will be uncategorized."
                />
            )}
            {showDeleteConfirm?.type === 'drink' && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    onConfirm={confirmDeleteDrink}
                    title="Delete Drink"
                    message="Are you sure you want to delete this drink?"
                />
            )}
            {showDeleteConfirm?.type === 'modifier' && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    onConfirm={confirmDeleteModifierGroup}
                    title="Delete Modifier Group"
                    message="Are you sure you want to delete this modifier group?"
                />
            )}
            {showSyncConfirm && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setShowSyncConfirm(false)}
                    onConfirm={handleSyncDescriptions}
                    title="Sync Descriptions"
                    message="This will overwrite all current drink descriptions with the default ones from the system. Are you sure?"
                />
            )}
        </div>
    );
};

export default MenuManagement;
