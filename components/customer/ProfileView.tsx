import React, { useContext, useMemo, useState } from 'react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { CartItem, ModifierOption } from '../../types';
import ErrorBoundary from '../shared/ErrorBoundary';
import OrderModal from './OrderModal';

const ProfileView: React.FC = () => {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const { currentUser, orders } = state;
  const [swipedFavouriteId, setSwipedFavouriteId] = useState<string | null>(null);
  const [birthday, setBirthday] = useState(currentUser?.birthday || '');

  const handleUpdateBirthday = () => {
    if (!currentUser) return;
    dispatch({ 
      type: 'UPDATE_USER_PROFILE', 
      payload: { userId: currentUser.id, birthday } 
    });
    addToast('Birthday updated successfully!', 'success');
  };

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return (orders || [])
      .filter(o => o && o.customerId === currentUser.id)
      .sort((a,b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  }, [currentUser, orders]);
  
  const handleSwipe = (favouriteId: string) => {
    setSwipedFavouriteId(current => (current === favouriteId ? null : favouriteId));
  };

  const handleReorder = (favourite: CartItem) => {
    const newCartItem = { ...favourite, id: `cart-item-${Date.now()}` };
    dispatch({ type: 'ADD_ITEM_TO_CART', payload: newCartItem });
    addToast(`${favourite.customName || favourite.drink?.name || 'Item'} added to your order!`, 'success');
    setSwipedFavouriteId(null); // Close the swipe view
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-white">Please log in to view your profile.</h1>
      </div>
    );
  }
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingFavourite, setEditingFavourite] = useState<CartItem | null>(null);

  const handleRemoveFavourite = (favouriteId: string) => {
    dispatch({ type: 'REMOVE_FAVOURITE', payload: favouriteId });
    addToast('Favourite removed.', 'success');
    setSwipedFavouriteId(null);
    setConfirmDeleteId(null);
  };

  const handleUpdateFavourite = (updatedItem: CartItem) => {
    dispatch({ type: 'UPDATE_FAVOURITE', payload: updatedItem });
    setEditingFavourite(null);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 md:p-8 text-stone-800 dark:text-zinc-200">
      <h1 className="text-3xl font-bold mb-6 text-stone-800 dark:text-white">Welcome back, {currentUser.name}!</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Profile Info */}
        <div className="space-y-8">
          {/* Loyalty Rewards Section */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Loyalty Rewards</h2>
            <div className="flex flex-col items-center justify-center p-4 bg-stone-50 dark:bg-zinc-700/30 rounded-xl border border-stone-100 dark:border-zinc-700">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-stone-200 dark:text-zinc-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * (currentUser.loyaltyPoints || 0)) / 15}
                    strokeLinecap="round"
                    className="text-[#A58D79] transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-stone-800 dark:text-white">{currentUser.loyaltyPoints || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-zinc-400">Points</span>
                </div>
              </div>
              <p className="text-sm text-center text-stone-600 dark:text-zinc-300 font-medium">
                {currentUser.loyaltyPoints >= 15 
                  ? "You've earned a FREE drink! 🎉" 
                  : `${15 - (currentUser.loyaltyPoints || 0)} more drinks until your next free one!`}
              </p>
              <div className="mt-4 w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#A58D79] h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((currentUser.loyaltyPoints || 0) / 15) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] text-stone-400 dark:text-zinc-500 text-center uppercase tracking-tighter">
                15 drinks = 1 free drink. Points clear after reward.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="birthday-input" className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">
                  Your Birthday
                </label>
                <div className="flex gap-2">
                  <input 
                    id="birthday-input"
                    type="date" 
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="flex-grow p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                  />
                  <button 
                    onClick={handleUpdateBirthday}
                    className="px-4 py-2 bg-[#A58D79] text-white rounded-md hover:bg-[#947D6A] transition-colors font-semibold text-sm"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-500 dark:text-zinc-400">
                  Set your birthday to receive a free drink on your special day!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (spanning 2 cols on lg): History and Favourites */}
        <div className="lg:col-span-2 space-y-8">

          {/* Order History */}
          <ErrorBoundary fallback={<div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md text-center text-red-500">Error loading order history</div>}>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Recent Orders</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {userOrders.length > 0 ? userOrders.map(order => {
                  if (!order) return null;
                  const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                  return (
                    <div key={order.id} className="border-b dark:border-zinc-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">{orderDate ? orderDate.toLocaleString() : 'Unknown Date'}</p>
                        <p className="font-bold text-lg">${(Number(order.finalTotal) || 0).toFixed(2)}</p>
                      </div>
                      <ul className="list-disc pl-5 mt-2 text-sm text-stone-600 dark:text-zinc-400">
                        {(order.items || []).map(item => {
                          if (!item) return null;
                          return (
                            <li key={item.id}>
                              {item.quantity || 1}x {item.drink?.name || 'Unknown Drink'} {item.customName && `(${item.customName})`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }) : <p className="text-stone-500 dark:text-zinc-400">You haven't placed any orders yet.</p>}
              </div>
            </div>
          </ErrorBoundary>

          {/* Favourites */}
          <ErrorBoundary fallback={<div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md text-center text-red-500">Error loading favourites</div>}>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Favourite Drinks</h2>
              {currentUser.favourites && currentUser.favourites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentUser.favourites.map(fav => {
                           if (!fav) return null;
                           return (
                             <div key={fav.id} className="relative bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm">
                                 {/* --- Actions Container - sits behind the content --- */}
                                 <div className="absolute top-0 right-0 h-full flex">
                                     <button 
                                         onClick={(e) => { e.stopPropagation(); handleReorder(fav); }}
                                         className="w-20 h-full flex items-center justify-center bg-stone-700 text-white font-semibold transition-colors hover:bg-stone-600 text-xs"
                                         aria-label={`Re-order ${fav.customName || fav.drink?.name || 'Item'}`}
                                     >
                                         Re-order
                                     </button>
                                     <button 
                                         onClick={(e) => { e.stopPropagation(); setEditingFavourite(fav); }}
                                         className="w-20 h-full flex items-center justify-center bg-amber-600 text-white font-semibold transition-colors hover:bg-amber-700 text-xs"
                                         aria-label={`Edit ${fav.customName || fav.drink?.name || 'Item'}`}
                                     >
                                         Edit
                                     </button>
                                     <button
                                         onClick={(e) => { 
                                           e.stopPropagation(); 
                                           if (confirmDeleteId === fav.id) {
                                             handleRemoveFavourite(fav.id);
                                           } else {
                                             setConfirmDeleteId(fav.id);
                                           }
                                         }}
                                         className={`w-20 h-full flex items-center justify-center text-white font-semibold transition-colors text-xs ${confirmDeleteId === fav.id ? 'bg-red-800 hover:bg-red-900' : 'bg-red-600 hover:bg-red-700'}`}
                                         aria-label={`Remove ${fav.customName || fav.drink?.name || 'Item'} from favourites`}
                                     >
                                        {confirmDeleteId === fav.id ? 'Confirm?' : 'Remove'}
                                     </button>
                                 </div>

                                 {/* --- Swipeable Content - sits on top --- */}
                                 <div
                                     className={`relative p-4 transition-transform duration-300 ease-in-out cursor-pointer z-10 ${swipedFavouriteId === fav.id ? 'bg-stone-50 dark:bg-zinc-700/50' : 'bg-white dark:bg-zinc-800'}`}
                                     style={{ transform: swipedFavouriteId === fav.id ? 'translateX(-240px)' : 'translateX(0)' }}
                                     onClick={() => {
                                       handleSwipe(fav.id);
                                       if (confirmDeleteId) setConfirmDeleteId(null);
                                     }}
                                 >
                                     <div className="flex justify-between items-center pointer-events-none">
                                        <div className="flex-grow overflow-hidden pr-2">
                                            <p className="font-bold text-stone-900 dark:text-white truncate">{fav.customName || fav.drink?.name || 'Unknown Drink'}</p>
                                            <p className="text-sm text-stone-600 dark:text-zinc-400 truncate">
                                                {fav.selectedModifiers && Object.values(fav.selectedModifiers)
                                                  .flatMap((m: any) => Array.isArray(m) ? m : [m])
                                                  .map((m: any) => m?.option?.name || m?.name)
                                                  .filter(Boolean)
                                                  .join(', ')}
                                            </p>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-stone-400 transition-transform duration-300 flex-shrink-0 ${swipedFavouriteId === fav.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                     </div>
                                 </div>
                             </div>
                           );
                      })}
                  </div>
              ) : (
                  <p className="text-stone-500 dark:text-zinc-400">You haven't saved any favourite drinks yet.</p>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </div>
      
      {editingFavourite && (
        <OrderModal
          isOpen={!!editingFavourite}
          onClose={() => setEditingFavourite(null)}
          drink={editingFavourite.drink}
          cartItemToEdit={editingFavourite}
          onSaveItem={handleUpdateFavourite}
        />
      )}
    </div>
  </ErrorBoundary>
);
};

export default ProfileView;
