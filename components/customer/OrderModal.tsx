import React, { useState, useEffect, useMemo } from 'react';
import { Drink, ModifierGroup, ModifierOption, CartItem, SelectedModifier } from '../../types';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../shared/Modal';

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
              // If required, use defaultOptionId or the first option
              const defaultOption = group.options.find(o => o.id === group.defaultOptionId) || group.options[0];
              if (defaultOption) {
                initialSelections[groupId] = [{ option: defaultOption, quantity: 1 }];
              }
            }
          }
        });
        setSelectedModifiers(initialSelections);
        
        if (activeDrink.variants && activeDrink.variants.length > 0) {
          setSelectedVariantId(activeDrink.variants[0].id);
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

  if (!activeDrink) return null;
  
  const modalTitle = `Customise ${customName.trim() ? `${customName.trim()} (${activeDrink.name || 'Drink'})` : (activeDrink.name || 'Drink')}`;

  const handleModifierChange = (groupId: string, option: ModifierOption) => {
    const group = state.modifierGroups.find(g => g.id === groupId);
    if (!group) return;

    const currentGroupSelections = selectedModifiers[groupId] || [];
    const existingSelectionIndex = currentGroupSelections.findIndex(s => s.option.id === option.id);

    if (existingSelectionIndex > -1) {
      // Already selected
      if (group.allowMultiple) {
        // In multi-select, clicking again unselects it (unless required and it's the only one?)
        // Actually, usually clicking again unselects.
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
        // If required, do nothing (must pick another)
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
  };

  const handleModifierQuantityChange = (groupId: string, optionId: string, delta: number) => {
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
  };
  
  const trimmedCustomName = customName.trim();
  const currentCartItem: CartItem = {
      id: cartItemToEdit?.id || `${activeDrink.id}-${selectedVariantId || 'base'}-${JSON.stringify(selectedModifiers)}-${trimmedCustomName}`,
      drink: activeDrink,
      quantity,
      selectedModifiers,
      selectedVariantId,
      finalPrice: totalPrice,
      ...(trimmedCustomName && { customName: trimmedCustomName }),
  };

  const handleSaveItemClick = () => {
    onSaveItem(currentCartItem);
    addToast(cartItemToEdit ? 'Item updated!' : 'Item added to order!', 'success');
    onClose();
  };

  const handleSaveFavourite = () => {
    dispatch({ type: 'ADD_FAVOURITE', payload: { ...currentCartItem, quantity: 1 } }); // Favourites are always quantity 1
    addToast(`${currentCartItem.customName || currentCartItem.drink?.name || 'Drink'} saved to favourites!`, 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <div className="space-y-8 text-stone-800 dark:text-zinc-200 order-modal-content p-2">
        <div id="variants-section" className="space-y-8">
          {activeDrink.variants && activeDrink.variants.length > 0 && (
            <div className="border-b border-stone-100 dark:border-zinc-700/50 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-serif text-xl font-bold text-stone-900 dark:text-white">Select Size / Variant</h4>
                <span className="text-[10px] uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full text-amber-700 dark:text-amber-400 font-bold">Required</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {activeDrink.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`px-6 py-3 text-sm font-bold rounded-2xl border transition-all duration-500 ${
                      selectedVariantId === variant.id
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xl transform scale-105'
                        : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:border-stone-900 dark:hover:border-white hover:bg-stone-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {variant.name} <span className="ml-2 opacity-60 font-serif italic">(${(variant.price || 0).toFixed(2)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div id="modifiers-section" className="space-y-8">
          {drinkModifierGroups.map(group => (
            <div key={group.id} className="border-b border-stone-100 dark:border-zinc-700/50 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-serif text-xl font-bold text-stone-900 dark:text-white">{group?.name || 'Group'}</h4>
                {group?.isRequired ? (
                  <span className="text-[10px] uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full text-amber-700 dark:text-amber-400 font-bold">Required</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-zinc-500 font-semibold">Optional</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                {group?.options?.map(option => {
                  const selection = (selectedModifiers[group.id] || []).find(s => s?.option?.id === option?.id);
                  const isSelected = !!selection;
                  
                  return (
                    <div key={option?.id} className="flex items-center gap-3">
                      <button
                        onClick={() => handleModifierChange(group.id, option)}
                        className={`px-6 py-3 text-sm font-bold rounded-2xl border transition-all duration-500 ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xl transform scale-105'
                            : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:border-stone-900 dark:hover:border-white hover:bg-stone-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {option?.name || 'Option'} {option?.price > 0 && <span className="ml-2 opacity-60 font-serif italic">(+${(option?.price || 0).toFixed(2)})</span>}
                      </button>
                      
                      {isSelected && group?.allowQuantity && (
                        <div className="flex items-center gap-3 bg-stone-50 dark:bg-zinc-900 rounded-2xl px-3 py-1.5 border border-stone-100 dark:border-zinc-800 shadow-inner">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleModifierQuantityChange(group.id, option?.id, -1); }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all shadow-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold min-w-[1.5rem] text-center">{selection?.quantity || 1}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleModifierQuantityChange(group.id, option?.id, 1); }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div id="quantity-and-name-section" className="space-y-8 pt-6">
            <div className="space-y-2">
                <label htmlFor="customName" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Individual Drink Name</label>
                <input
                    id="customName"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={`e.g., "Sarah's Latte"`}
                    className="w-full p-4 border rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 focus:outline-none transition-all font-serif italic"
                />
            </div>
            
            <div className="flex items-center justify-between bg-stone-50 dark:bg-zinc-900/30 p-6 rounded-3xl border border-stone-100 dark:border-zinc-800">
              <h4 className="font-serif text-xl font-bold text-stone-900 dark:text-white">Quantity</h4>
              <div className="flex items-center gap-6">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all border border-stone-100 dark:border-zinc-700 font-bold text-xl">-</button>
                <span className="text-2xl font-serif font-bold w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all border border-stone-100 dark:border-zinc-700 font-bold text-xl">+</button>
              </div>
            </div>
        </div>

        <div className="pt-10 border-t border-stone-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-8">
                <span className="text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Total Amount</span>
                <span className="text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4">
                <button id="add-to-order-button" onClick={handleSaveItemClick} className="flex-1 bg-stone-900 text-white dark:bg-white dark:text-stone-900 py-5 rounded-full font-bold text-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl transform active:scale-95">
                    {cartItemToEdit ? 'Update Item' : 'Add to Order'}
                </button>
                {currentUser && (
                    <button onClick={handleSaveFavourite} title="Save as Favourite" className="p-5 bg-white text-stone-900 dark:bg-zinc-900 dark:text-white rounded-2xl hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all shadow-lg border border-stone-100 dark:border-zinc-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderModal;