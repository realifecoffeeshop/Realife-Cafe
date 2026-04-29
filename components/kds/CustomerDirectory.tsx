
import React, { useContext, useState, memo } from 'react';
import { useApp } from '../../context/useApp';
import { Customer, CartItem, Drink, SelectedModifier, Order } from '../../types';
import { useToast } from '../../context/ToastContext';
import { addOrder, saveCustomer, deleteCustomer } from '../../firebase/firestoreService';
import OrderModal from '../customer/OrderModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface CustomerDirectoryProps {
  onSelectCustomer?: (customer: Customer) => void;
}

const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({ onSelectCustomer }) => {
  const { state, dispatch } = useApp();
  const { customers, drinks } = state;
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  
  // States for OrderModal (adding/editing favorites)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedDrinkForModal, setSelectedDrinkForModal] = useState<Drink | null>(null);
  const [cartItemToEdit, setCartItemToEdit] = useState<CartItem | null>(null);
  const [activeCustomerForFav, setActiveCustomerForFav] = useState<Customer | null>(null);
  
  // State for drink selection list
  const [isSelectingDrink, setIsSelectingDrink] = useState(false);

  // State for delete confirmation
  const [favToDelete, setFavToDelete] = useState<{ customer: Customer, favId: string } | null>(null);

  const filteredCustomers = customers.filter(c => 
    (c?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerName,
      favouriteDrinks: [],
      notes: '',
      loyaltyPoints: 0
    };
    try {
        await saveCustomer(newCustomer);
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
        setNewCustomerName('');
        setIsAddingCustomer(false);
        addToast(`Customer ${newCustomerName} added to directory`, 'success');
    } catch (err) {
        console.error("Failed to add customer:", err);
        addToast('Failed to add customer', 'error');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
        await deleteCustomer(id);
        dispatch({ type: 'DELETE_CUSTOMER', payload: id });
        addToast('Customer removed from directory', 'info');
    } catch (err) {
        console.error("Failed to delete customer:", err);
        addToast('Failed to remove customer', 'error');
    }
  };

  const handleUpdateNotes = async (customer: Customer, notes: string) => {
    try {
        const updatedCustomer = { ...customer, notes };
        await saveCustomer(updatedCustomer);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
    } catch (err) {
        console.error("Failed to update notes:", err);
        addToast('Failed to update notes', 'error');
    }
  };

  const handleRemoveFavourite = async (customer: Customer, favId: string) => {
    if (!favId) {
      addToast('Could not identify favourite to remove', 'error');
      return;
    }
    const updatedFavourites = customer.favouriteDrinks.filter(f => f.id !== favId);
    if (updatedFavourites.length === customer.favouriteDrinks.length) {
      addToast('Favourite not found', 'error');
      return;
    }
    try {
        const updatedCustomer = { ...customer, favouriteDrinks: updatedFavourites };
        await saveCustomer(updatedCustomer);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
        addToast('Favourite removed', 'info');
    } catch (err) {
        console.error("Failed to remove favorite:", err);
        addToast('Failed to remove favourite', 'error');
    }
  };

  const handleOpenAddFavourite = (customer: Customer) => {
    setActiveCustomerForFav(customer);
    setIsSelectingDrink(true);
  };

  const handleSelectDrinkForFav = (drink: Drink) => {
    setSelectedDrinkForModal(drink);
    setCartItemToEdit(null);
    setIsOrderModalOpen(true);
    setIsSelectingDrink(false);
  };

  const handleEditFavourite = (customer: Customer, fav: CartItem) => {
    setActiveCustomerForFav(customer);
    setSelectedDrinkForModal(fav.drink);
    setCartItemToEdit(fav);
    setIsOrderModalOpen(true);
  };

  const handleSaveFavourite = async (item: CartItem) => {
    if (!activeCustomerForFav) return;

    let updatedFavourites = [...(activeCustomerForFav.favouriteDrinks || [])];
    
    if (cartItemToEdit) {
      // Editing existing - preserve the stable ID
      const updatedItem = { ...item, id: cartItemToEdit.id };
      updatedFavourites = updatedFavourites.map(f => f.id === cartItemToEdit.id ? updatedItem : f);
    } else {
      // Adding new - assign a stable ID
      updatedFavourites.push({ ...item, id: `fav-${Date.now()}` });
    }

    try {
        const updatedCustomer = { ...activeCustomerForFav, favouriteDrinks: updatedFavourites };
        await saveCustomer(updatedCustomer);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
        setIsOrderModalOpen(false);
        setActiveCustomerForFav(null);
        setCartItemToEdit(null);
        setSelectedDrinkForModal(null);
        addToast(cartItemToEdit ? 'Favourite updated' : 'Favourite added', 'success');
    } catch (err) {
        console.error("Failed to save favorite:", err);
        addToast('Failed to save favourite', 'error');
    }
  };

  const handleQuickOrder = async (customer: Customer, item: CartItem) => {
    // Calculate total cost for the order
    const modifiersCost = Object.values(item.selectedModifiers || {}).reduce((modSum: number, mods: SelectedModifier[]) => {
        return modSum + mods.reduce((innerSum, sm) => {
            const cost = typeof sm.option.cost === 'number' && !isNaN(sm.option.cost) ? sm.option.cost : 0;
            return innerSum + (cost * sm.quantity);
        }, 0);
    }, 0);
    const baseCost = item.drink ? (typeof item.drink.baseCost === 'number' && !isNaN(item.drink.baseCost) ? item.drink.baseCost : 0) : 0;
    const totalCost = (baseCost + modifiersCost) * item.quantity;

    const newOrder: Omit<Order, 'id'> = {
        customerName: customer.name || 'Unknown',
        customerId: customer.id || `cust-${Date.now()}`,
        items: [{ ...item, id: `item-${Date.now()}` }],
        total: item.finalPrice || 0,
        totalCost: totalCost,
        discountApplied: null,
        finalTotal: item.finalPrice || 0,
        paymentMethod: 'Cash' as any,
        status: 'pending' as any,
        createdAt: Date.now()
    };
    
    try {
        if (!item.drink) {
            throw new Error("Drink information is missing for this item.");
        }
        await addOrder(newOrder);
        addToast(`Quick order placed for ${customer.name || 'Customer'}: ${item.drink.name || 'Drink'}`, 'success');
    } catch (error) {
        console.error("Failed to place quick order:", error);
        addToast(error instanceof Error ? error.message : "Failed to place quick order.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setIsAddingCustomer(true)}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
        >
          Add Customer
        </button>
      </div>

      {isAddingCustomer && (
        <div className="bg-stone-100 dark:bg-zinc-800 p-4 rounded-lg border border-stone-200 dark:border-zinc-700 flex gap-2">
          <input
            type="text"
            placeholder="Customer Name"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            className="flex-grow px-3 py-2 border rounded dark:bg-zinc-900 dark:border-zinc-600"
            autoFocus
          />
          <button onClick={handleAddCustomer} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
          <button onClick={() => setIsAddingCustomer(false)} className="bg-stone-300 text-stone-700 px-4 py-2 rounded hover:bg-stone-400">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-zinc-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div 
                className={`flex flex-col ${onSelectCustomer ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => onSelectCustomer?.(customer)}
              >
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">{customer.name || 'Unknown'}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <svg className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {customer.loyaltyPoints || 0} Points
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteCustomer(customer.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Notes</label>
              <textarea
                value={customer.notes || ''}
                onChange={(e) => handleUpdateNotes(customer, e.target.value)}
                placeholder="Add notes (e.g., allergies, preferences)..."
                className="w-full text-sm p-2 bg-stone-50 dark:bg-zinc-900 border-none rounded-md resize-none h-16 focus:ring-1 focus:ring-stone-300"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Favourite Drinks</label>
                <button 
                  onClick={() => handleOpenAddFavourite(customer)}
                  className="text-[10px] font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 bg-stone-100 dark:bg-zinc-700 px-2 py-0.5 rounded transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {customer.favouriteDrinks && customer.favouriteDrinks.length > 0 ? (
                <div className="space-y-2">
                  {customer.favouriteDrinks.map((fav, idx) => {
                    const stableFavId = fav.id || `fav-${idx}`;
                    return (
                      <div key={stableFavId} className="flex flex-col bg-stone-50 dark:bg-zinc-900 p-2 rounded-lg group border border-transparent hover:border-stone-200 dark:hover:border-zinc-700 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate pr-2">{fav.quantity}x {fav.drink?.name || 'Drink'}</span>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleQuickOrder(customer, fav)}
                              className="text-[10px] bg-stone-800 text-white px-2.5 py-1 rounded-md hover:bg-stone-700 transition-colors font-bold"
                            >
                              Order
                            </button>
                            <button 
                              onClick={() => handleEditFavourite(customer, fav)}
                              className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-all"
                              title="Edit Favourite"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => setFavToDelete({ customer, favId: stableFavId })}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                              title="Remove Favourite"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {fav.selectedModifiers && Object.values(fav.selectedModifiers).some(m => m.length > 0) && (
                          <div className="text-[10px] text-stone-400 dark:text-zinc-500 mt-1 truncate">
                            {Object.values(fav.selectedModifiers).flatMap(m => m).map(m => m.option.name).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">No favourites saved yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Drink Selection Modal for Adding Favourites */}
      {isSelectingDrink && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b dark:border-zinc-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">Select a Drink</h3>
              <button onClick={() => setIsSelectingDrink(false)} className="text-stone-400 hover:text-stone-600">
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {drinks.filter(d => d.isAvailable !== false).map(drink => (
                <button
                  key={drink.id}
                  onClick={() => handleSelectDrinkForFav(drink)}
                  className="w-full text-left p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors flex justify-between items-center border border-transparent hover:border-stone-100 dark:hover:border-zinc-600"
                >
                  <span className="font-medium">{drink.name}</span>
                  <span className="text-xs text-stone-400">${drink.basePrice.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OrderModal for configuring the favourite */}
      {isOrderModalOpen && selectedDrinkForModal && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setCartItemToEdit(null);
            setSelectedDrinkForModal(null);
          }}
          drink={selectedDrinkForModal}
          cartItemToEdit={cartItemToEdit}
          onSaveItem={handleSaveFavourite}
        />
      )}

      <ConfirmationModal
        isOpen={!!favToDelete}
        onClose={() => setFavToDelete(null)}
        onConfirm={() => {
          if (favToDelete) {
            handleRemoveFavourite(favToDelete.customer, favToDelete.favId);
          }
        }}
        title="Remove Favourite"
        message={`Are you sure you want to remove this favourite drink for ${favToDelete?.customer.name}?`}
        confirmButtonText="Remove"
        variant="danger"
      />

      {filteredCustomers.length === 0 && !isAddingCustomer && (
        <div className="text-center py-12 bg-stone-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-stone-200 dark:border-zinc-800">
          <p className="text-stone-500">No customers found in directory.</p>
        </div>
      )}
    </div>
  );
};

export default memo(CustomerDirectory);
