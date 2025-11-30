import React, { useState, useEffect, useContext } from 'react';
import { Drink, ModifierGroup, ModifierOption, CartItem } from '../../types';
import { AppContext } from '../../context/AppContext';
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
  const { state, dispatch } = useContext(AppContext);
  const { addToast } = useToast();
  const { currentUser } = state;
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: string]: ModifierOption }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    const activeDrink = cartItemToEdit?.drink || drink;
    if (activeDrink) {
      if (cartItemToEdit) {
        // Populate from existing item
        setSelectedModifiers(cartItemToEdit.selectedModifiers);
        setQuantity(cartItemToEdit.quantity);
        setCustomName(cartItemToEdit.customName || '');
      } else {
        // Populate with defaults for a new item
        const initialSelections: { [groupId: string]: ModifierOption } = {};
        activeDrink.modifierGroups.forEach(groupId => {
          const group = state.modifierGroups.find(g => g.id === groupId);
          if (group && group.options.length > 0) {
            initialSelections[groupId] = group.options[0];
          }
        });
        setSelectedModifiers(initialSelections);
        setQuantity(1);
        setCustomName('');
      }
    }
  }, [drink, cartItemToEdit, state.modifierGroups]);


  useEffect(() => {
    const activeDrink = cartItemToEdit?.drink || drink;
    if (activeDrink) {
      let price = activeDrink.basePrice;
      Object.values(selectedModifiers).forEach((mod: ModifierOption) => {
        price += mod.price;
      });
      setTotalPrice(price * quantity);
    }
  }, [drink, cartItemToEdit, selectedModifiers, quantity]);
  
  const activeDrink = cartItemToEdit?.drink || drink;
  if (!activeDrink) return null;
  
  const modalTitle = `Customise ${customName.trim() ? `${customName.trim()} (${activeDrink.name})` : activeDrink.name}`;

  const handleModifierChange = (groupId: string, option: ModifierOption) => {
    setSelectedModifiers(prev => ({ ...prev, [groupId]: option }));
  };
  
  const trimmedCustomName = customName.trim();
  const currentCartItem: CartItem = {
      id: cartItemToEdit?.id || `${activeDrink.id}-${JSON.stringify(selectedModifiers)}-${trimmedCustomName}`,
      drink: activeDrink,
      quantity,
      selectedModifiers,
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
    addToast(`${currentCartItem.customName || currentCartItem.drink.name} saved to favourites!`, 'success');
  };

  const drinkModifierGroups = state.modifierGroups.filter(mg => activeDrink.modifierGroups.includes(mg.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} helpArticleId="kb-1">
      <div className="space-y-6 text-stone-800 dark:text-zinc-200 order-modal-content">
        <div id="modifiers-section" className="space-y-6">
          {drinkModifierGroups.map(group => (
            <div key={group.id}>
              <h4 className="font-semibold mb-2">{group.name}</h4>
              <div className="flex flex-wrap gap-2">
                {group.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleModifierChange(group.id, option)}
                    className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                      selectedModifiers[group.id]?.id === option.id
                        ? 'bg-[#A58D79] text-white border-[#A58D79] dark:bg-zinc-100 dark:text-zinc-800 dark:border-zinc-100'
                        : 'bg-stone-100 dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 hover:bg-stone-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {option.name} {option.price > 0 && `(+$${option.price.toFixed(2)})`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div id="quantity-and-name-section" className="space-y-4">
            <div>
                <label htmlFor="customName" className="font-semibold block mb-2">Individual Drink Name (Optional)</label>
                <input
                    id="customName"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={`e.g., "Sarah's Latte"`}
                    className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                />
            </div>
            
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Quantity</h4>
              <div className="flex items-center space-x-3">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 rounded-md bg-stone-200 dark:bg-zinc-600 hover:bg-stone-300 dark:hover:bg-zinc-500">-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-1 rounded-md bg-stone-200 dark:bg-zinc-600 hover:bg-stone-300 dark:hover:bg-zinc-500">+</button>
              </div>
            </div>
        </div>

        <div className="pt-4 border-t dark:border-zinc-700">
            <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2 mt-4">
                <button id="add-to-order-button" onClick={handleSaveItemClick} className="w-full bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-3 rounded-lg font-semibold hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors">
                    {cartItemToEdit ? 'Update Item' : 'Add to Order'}
                </button>
                {currentUser && (
                    <button onClick={handleSaveFavourite} title="Save as Favourite" className="p-3 bg-stone-100 text-stone-700 dark:bg-zinc-700 dark:text-white rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderModal;