
import React, { useContext, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, CartItem, Drink } from '../../types';
import { useToast } from '../../context/ToastContext';

import { addOrder } from '../../firebase/firestoreService';
import { SelectedModifier, Order } from '../../types';

const CustomerDirectory: React.FC = () => {
  const { state, dispatch } = useApp();
  const { customers, drinks } = state;
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => 
    (c?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerName,
      favouriteDrinks: [],
      notes: ''
    };
    dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
    setNewCustomerName('');
    setIsAddingCustomer(false);
    addToast(`Customer ${newCustomerName} added to directory`, 'success');
  };

  const handleDeleteCustomer = (id: string) => {
    dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    addToast('Customer removed from directory', 'info');
  };

  const handleUpdateNotes = (customer: Customer, notes: string) => {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...customer, notes } });
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
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">{customer.name || 'Unknown'}</h3>
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
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Favourite Drinks</label>
              {customer.favouriteDrinks && customer.favouriteDrinks.length > 0 ? (
                <div className="space-y-2">
                  {customer.favouriteDrinks.map(fav => (
                    <div key={fav.id} className="flex justify-between items-center bg-stone-50 dark:bg-zinc-900 p-2 rounded-lg group">
                      <span className="text-sm font-medium">{fav.quantity}x {fav.drink?.name || 'Drink'}</span>
                      <button 
                        onClick={() => handleQuickOrder(customer, fav)}
                        className="text-xs bg-stone-200 dark:bg-zinc-700 px-2 py-1 rounded hover:bg-stone-300 dark:hover:bg-zinc-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Quick Order
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">No favourites saved yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredCustomers.length === 0 && !isAddingCustomer && (
        <div className="text-center py-12 bg-stone-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-stone-200 dark:border-zinc-800">
          <p className="text-stone-500">No customers found in directory.</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectory;
