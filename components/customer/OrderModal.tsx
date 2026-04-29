import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Drink, ModifierGroup, ModifierOption, CartItem, SelectedModifier } from '../../types';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import Modal from '../shared/Modal';

import { Loader2, Heart, Plus, Minus, Info, ClipboardList, PenTool, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderModalProps {
  drink: Drink | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: CartItem) => void;
  cartItemToEdit?: CartItem | null;
}

const OrderModal: React.FC<OrderModalProps> = ({ drink, isOpen, onClose, onSaveItem, cartItemToEdit }) => {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const { currentUser } = state;
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: string]: SelectedModifier[] }>({});
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [totalPrice, setTotalPrice] = useState(0);
  const [customName, setCustomName] = useState('');
  const [isSavingFavourite, setIsSavingFavourite] = useState(false);

  useEffect(() => {
    const activeDrink = cartItemToEdit?.drink || drink;
    if (activeDrink) {
      if (cartItemToEdit) {
        // Populate from existing item
        setSelectedModifiers(cartItemToEdit.selectedModifiers || {});
        setSelectedVariantId(cartItemToEdit.selectedVariantId);
        setQuantity(cartItemToEdit.quantity);
        setCustomName(cartItemToEdit.customName || '');
      } else {
        // Populate with defaults for a new item
        const initialSelections: { [groupId: string]: SelectedModifier[] } = {};
        activeDrink.modifierGroups.forEach(groupId => {
          const group = state.modifierGroups.find(g => g.id === groupId);
          if (group) {
            if (group.isRequired) {
              // If required, use defaultOptionId or the first available option
              const defaultOption = group.options.find(o => o.id === group.defaultOptionId && o.isAvailable !== false) 
                || group.options.find(o => o.isAvailable !== false);
              
              if (defaultOption) {
                initialSelections[groupId] = [{ option: defaultOption, quantity: 1 }];
              }
            }
          }
        });
        setSelectedModifiers(initialSelections);
        
        if (activeDrink.variants && activeDrink.variants.length > 0) {
          const firstAvailableVariant = activeDrink.variants.find(v => v.isAvailable !== false) || activeDrink.variants[0];
          setSelectedVariantId(firstAvailableVariant.id);
        } else {
          setSelectedVariantId(undefined);
        }
        
        setQuantity(1);
        setCustomName('');
      }
    }
  }, [drink, cartItemToEdit, state.modifierGroups]);


  useEffect(() => {
    const activeDrink = cartItemToEdit?.drink || drink;
    if (activeDrink) {
      let basePrice = activeDrink.basePrice;
      if (selectedVariantId && activeDrink.variants) {
        const variant = activeDrink.variants.find(v => v.id === selectedVariantId);
        if (variant) {
          basePrice = variant.price;
        }
      }
      
      let price = typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0;
      Object.values(selectedModifiers || {}).forEach((mods: SelectedModifier[]) => {
        mods.forEach(sm => {
          if (!sm.option) return;
          const modPrice = typeof sm.option.price === 'number' && !isNaN(sm.option.price) ? sm.option.price : 0;
          price += modPrice * sm.quantity;
        });
      });
      setTotalPrice(price * quantity);
    }
  }, [drink, cartItemToEdit, selectedModifiers, quantity, selectedVariantId]);
  
  const activeDrink = cartItemToEdit?.drink || drink;

  const drinkModifierGroups = useMemo(() => 
    activeDrink ? state.modifierGroups.filter(mg => activeDrink.modifierGroups.includes(mg.id)) : [],
    [state.modifierGroups, activeDrink?.modifierGroups]
  );

  const handleModifierChange = useCallback((groupId: string, option: ModifierOption) => {
    const group = state.modifierGroups.find(g => g.id === groupId);
    if (!group) return;

    const currentGroupSelections = selectedModifiers[groupId] || [];
    const existingSelectionIndex = currentGroupSelections.findIndex(s => s.option.id === option.id);

    if (existingSelectionIndex > -1) {
      // Already selected
      if (group.allowMultiple) {
        // In multi-select, clicking again unselects it (unless required and it's the only one?)
        if (group.isRequired && currentGroupSelections.length === 1) {
          // Don't unselect if it's the only one in a required group
          return;
        }
        setSelectedModifiers(prev => ({
          ...prev,
          [groupId]: currentGroupSelections.filter(s => s.option.id !== option.id)
        }));
      } else {
        // In single-select, clicking the same one again
        if (!group.isRequired) {
          // Unselect if not required
          setSelectedModifiers(prev => {
            const next = { ...prev };
            delete next[groupId];
            return next;
          });
        }
      }
    } else {
      // Not selected
      const newSelection: SelectedModifier = { option, quantity: 1 };
      if (group.allowMultiple) {
        setSelectedModifiers(prev => ({
          ...prev,
          [groupId]: [...currentGroupSelections, newSelection]
        }));
      } else {
        setSelectedModifiers(prev => ({
          ...prev,
          [groupId]: [newSelection]
        }));
      }
    }
  }, [state.modifierGroups, selectedModifiers]);

  const handleModifierQuantityChange = useCallback((groupId: string, optionId: string, delta: number) => {
    setSelectedModifiers(prev => {
      const currentGroupSelections = prev[groupId] || [];
      const updatedSelections = currentGroupSelections.map(s => {
        if (s.option.id === optionId) {
          return { ...s, quantity: Math.max(1, s.quantity + delta) };
        }
        return s;
      });
      return { ...prev, [groupId]: updatedSelections };
    });
  }, []);

  const trimmedCustomName = customName.trim();
  const currentCartItem: CartItem = useMemo(() => ({
      id: cartItemToEdit?.id || (activeDrink ? `${activeDrink.id}-${selectedVariantId || 'base'}-${JSON.stringify(selectedModifiers)}-${trimmedCustomName}` : ''),
      drink: activeDrink!,
      quantity,
      selectedModifiers,
      selectedVariantId,
      finalPrice: totalPrice,
      ...(trimmedCustomName && { customName: trimmedCustomName }),
  }), [cartItemToEdit?.id, activeDrink, quantity, selectedModifiers, selectedVariantId, totalPrice, trimmedCustomName]);

  const handleSaveItemClick = useCallback(() => {
    if (!activeDrink) return;
    onSaveItem(currentCartItem);
    addToast(cartItemToEdit ? 'Item updated!' : 'Item added to order!', 'success');
    onClose();
  }, [onSaveItem, currentCartItem, cartItemToEdit, onClose, addToast, activeDrink]);

  const handleSaveFavourite = useCallback(async () => {
    if (!currentUser || !activeDrink) return;
    
    // Check for duplicates
    const isDuplicate = (currentUser.favourites || []).some(fav => fav.id === currentCartItem.id);
    if (isDuplicate) {
      addToast('This drink is already in your favourites!', 'info');
      return;
    }

    setIsSavingFavourite(true);
    
    try {
      dispatch({ type: 'ADD_FAVOURITE', payload: { ...currentCartItem, quantity: 1 } });
      await new Promise(resolve => setTimeout(resolve, 800));
      addToast(`${currentCartItem.customName || activeDrink.name || 'Drink'} saved to favourites!`, 'success');
    } finally {
      setIsSavingFavourite(false);
    }
  }, [currentUser, currentCartItem, dispatch, addToast, activeDrink]);

  if (!activeDrink) return null;

  const modalTitle = cartItemToEdit ? `Edit ${activeDrink.name}` : `Customise ${activeDrink.name}`;

  const footerContent = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Total Price</span>
          <span className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">${totalPrice.toFixed(2)}</span>
        </div>
        
        {currentUser && (
          <button 
            onClick={handleSaveFavourite} 
            disabled={isSavingFavourite}
            className={`p-4 rounded-xl transition-all border ${
              isSavingFavourite 
                ? 'bg-stone-50 dark:bg-zinc-900 text-stone-300 border-stone-100 dark:border-zinc-800' 
                : 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white border-stone-100 dark:border-zinc-800 hover:border-amber-200'
            }`}
          >
            {isSavingFavourite ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${currentUser.favourites?.some(f => f.id === currentCartItem.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
            )}
          </button>
        )}
      </div>

      <button 
        id="add-to-order-button" 
        onClick={handleSaveItemClick} 
        className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 px-6 rounded-2xl font-bold text-base hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-stone-900/10 dark:shadow-white/5 flex items-center justify-center gap-2 group"
      >
        <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
        {cartItemToEdit ? 'Update My Item' : 'Add to My Order'}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footerContent}>
      <div className="space-y-6 max-w-2xl mx-auto py-2">
        
        {/* Drink Header Info */}
        <div className="bg-stone-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400">
            <Info size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-0.5">{activeDrink.name}</h4>
            <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed italic">
              {activeDrink.description || "The perfect brew, precisely how you like it."}
            </p>
          </div>
        </div>

        {/* Individual Drink Name */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-900 text-white dark:bg-zinc-800 text-[10px] font-mono">01</div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Order Label</h3>
          </div>
          <div className="relative group">
            <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 dark:text-zinc-600 transition-colors group-focus-within:text-amber-600" size={16} />
            <input
              id="customName"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Who is this for? (e.g. Sarah's Oat Latte)"
              className="w-full pl-12 pr-4 py-4 border rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 focus:outline-none transition-all font-serif italic text-sm placeholder:text-stone-300 dark:placeholder:text-zinc-700"
            />
          </div>
        </section>

        {/* Size / Variants Section */}
        {activeDrink.variants && activeDrink.variants.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-900 text-white dark:bg-zinc-800 text-[10px] font-mono">02</div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Select Size</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Required</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeDrink.variants.map(variant => {
                const isVarUnavailable = variant.isAvailable === false;
                const isSelected = selectedVariantId === variant.id;
                return (
                  <button
                    key={variant.id}
                    disabled={isVarUnavailable}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all duration-300 group ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500/30 ring-1 ring-amber-500/20 dark:bg-amber-900/10'
                        : isVarUnavailable
                          ? 'bg-stone-50 dark:bg-zinc-800/30 border-stone-100 dark:border-zinc-800 opacity-40 cursor-not-allowed'
                          : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 hover:border-amber-200 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-bold ${isSelected ? 'text-amber-900 dark:text-amber-200' : 'text-stone-700 dark:text-zinc-300'}`}>
                        {variant.name}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-zinc-500'}`}>
                        ${(variant.price || 0).toFixed(2)}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-amber-600">
                         <CheckCircle2 size={16} />
                      </div>
                    )}
                    {isVarUnavailable && (
                      <span className="absolute bottom-2 right-2 text-[8px] uppercase font-bold text-stone-400">Sold Out</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Modifiers Sections */}
        {drinkModifierGroups.map((group, idx) => (
          <section key={group.id} className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-900 text-white dark:bg-zinc-800 text-[10px] font-mono">
                  {(idx + 3).toString().padStart(2, '0')}
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">{group.name}</h3>
              </div>
              {group.isRequired ? (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Required</span>
              ) : (
                <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-tighter">Optional</span>
              )}
            </div>
            
            <div className="space-y-2">
              {group.options.map(option => {
                const selection = (selectedModifiers[group.id] || []).find(s => s.option.id === option.id);
                const isSelected = !!selection;
                const isOptUnavailable = option.isAvailable === false;
                
                return (
                  <div key={option.id} className="group">
                    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-amber-50 border-amber-500/30 dark:bg-amber-900/10' 
                        : isOptUnavailable
                          ? 'bg-stone-50 dark:bg-zinc-800 opacity-40 cursor-not-allowed'
                          : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 hover:border-amber-200'
                    }`}>
                      <button
                        disabled={isOptUnavailable}
                        onClick={() => handleModifierChange(group.id, option)}
                        className="flex-1 text-left flex flex-col"
                      >
                        <span className={`text-sm font-bold ${isSelected ? 'text-amber-900 dark:text-amber-200' : 'text-stone-700 dark:text-zinc-300'}`}>
                          {option.name}
                        </span>
                        {option.price > 0 && (
                          <span className={`text-[10px] ${isSelected ? 'text-amber-600' : 'text-stone-400'}`}>
                            + ${(option.price || 0).toFixed(2)}
                          </span>
                        )}
                      </button>
                      
                      {isSelected ? (
                        <div className="flex items-center gap-1">
                          {group.allowQuantity && (
                            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-xl px-2 py-1 shadow-sm border border-amber-200/50 dark:border-amber-900/30">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleModifierQuantityChange(group.id, option.id, -1); }}
                                className="p-1 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold min-w-[0.75rem] text-center text-amber-900 dark:text-amber-200">{selection.quantity}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleModifierQuantityChange(group.id, option.id, 1); }}
                                className="p-1 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                          <button 
                            onClick={() => handleModifierChange(group.id, option)}
                            className="p-2 text-amber-600"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </div>
                      ) : (
                        !isOptUnavailable && (
                          <button 
                            onClick={() => handleModifierChange(group.id, option)}
                            className="p-2 text-stone-200 hover:text-amber-200 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        )
                      )}
                      
                      {isOptUnavailable && (
                        <span className="text-[8px] uppercase font-bold text-stone-400">Sold Out</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Final Quantity Section */}
        <section className="space-y-3 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-900 text-white dark:bg-zinc-800 text-[10px] font-mono">
              {(drinkModifierGroups.length + 3).toString().padStart(2, '0')}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">How many?</h3>
          </div>
          <div className="flex items-center justify-between bg-stone-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800">
            <span className="text-sm font-bold text-stone-700 dark:text-zinc-300">Total Quantity</span>
            <div className="flex items-center gap-6">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all border border-stone-100 dark:border-zinc-700">
                <Minus size={18} />
              </button>
              <span className="text-xl font-serif font-bold w-6 text-center text-stone-900 dark:text-white">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all border border-stone-100 dark:border-zinc-700">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );

};

export default memo(OrderModal);
