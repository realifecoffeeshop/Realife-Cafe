import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { CartItem, ModifierOption } from '../../types';

const ProfileView: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { addToast } = useToast();
  const { currentUser, orders } = state;
  const [swipedFavouriteId, setSwipedFavouriteId] = useState<string | null>(null);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(o => o.customerId === currentUser.id).sort((a,b) => b.createdAt - a.createdAt);
  }, [currentUser, orders]);
  
  const handleSwipe = (favouriteId: string) => {
    setSwipedFavouriteId(current => (current === favouriteId ? null : favouriteId));
  };

  const handleReorder = (favourite: CartItem) => {
    const newCartItem = { ...favourite, id: `cart-item-${Date.now()}` };
    dispatch({ type: 'ADD_ITEM_TO_CART', payload: newCartItem });
    addToast(`${favourite.customName || favourite.drink.name} added to your order!`, 'success');
    setSwipedFavouriteId(null); // Close the swipe view
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-white">Please log in to view your profile.</h1>
      </div>
    );
  }
  
  const handleRemoveFavourite = (favouriteId: string) => {
    if(window.confirm('Are you sure you want to remove this favourite?')) {
        dispatch({ type: 'REMOVE_FAVOURITE', payload: favouriteId });
        addToast('Favourite removed.', 'success');
        setSwipedFavouriteId(null); // Close the swipe view
    }
  };

  const hasReward = currentUser.loyaltyPoints === 0 && userOrders.length > 0;

  return (
    <div className="container mx-auto p-4 md:p-8 text-stone-800 dark:text-zinc-200">
      <h1 className="text-3xl font-bold mb-6 text-stone-800 dark:text-white">Welcome back, {currentUser.name}!</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main content: History and Favourites */}
        <div className="lg:col-span-2 space-y-8">

          {/* Order History */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Recent Orders</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {userOrders.length > 0 ? userOrders.map(order => (
                <div key={order.id} className="border-b dark:border-zinc-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="font-bold text-lg">${order.finalTotal.toFixed(2)}</p>
                  </div>
                  <ul className="list-disc pl-5 mt-2 text-sm text-stone-600 dark:text-zinc-400">
                    {order.items.map(item => <li key={item.id}>{item.quantity}x {item.drink.name} {item.customName && `(${item.customName})`}</li>)}
                  </ul>
                </div>
              )) : <p className="text-stone-500 dark:text-zinc-400">You haven't placed any orders yet.</p>}
            </div>
          </div>

          {/* Favourites */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Favourite Drinks</h2>
            {currentUser.favourites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentUser.favourites.map(fav => (
                         <div key={fav.id} className="relative bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm">
                             {/* --- Actions Container - sits behind the content --- */}
                             <div className="absolute top-0 right-0 h-full flex">
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); handleReorder(fav); }}
                                     className="w-24 h-full flex items-center justify-center bg-stone-700 text-white font-semibold transition-colors hover:bg-stone-600"
                                     aria-label={`Re-order ${fav.customName || fav.drink.name}`}
                                 >
                                     Re-order
                                 </button>
                                 <button
                                     onClick={(e) => { e.stopPropagation(); handleRemoveFavourite(fav.id); }}
                                     className="w-24 h-full flex items-center justify-center bg-red-600 text-white font-semibold transition-colors hover:bg-red-700"
                                     aria-label={`Remove ${fav.customName || fav.drink.name} from favourites`}
                                 >
                                    Remove
                                 </button>
                             </div>

                             {/* --- Swipeable Content - sits on top --- */}
                             <div
                                 className={`relative p-4 transition-transform duration-300 ease-in-out cursor-pointer z-10 ${swipedFavouriteId === fav.id ? 'bg-stone-50 dark:bg-zinc-700/50' : 'bg-white dark:bg-zinc-800'}`}
                                 style={{ transform: swipedFavouriteId === fav.id ? 'translateX(-192px)' : 'translateX(0)' }}
                                 onClick={() => handleSwipe(fav.id)}
                             >
                                 <div className="flex justify-between items-center pointer-events-none">
                                    <div className="flex-grow overflow-hidden pr-2">
                                        <p className="font-bold text-stone-900 dark:text-white truncate">{fav.customName || fav.drink.name}</p>
                                        <p className="text-sm text-stone-600 dark:text-zinc-400 truncate">{Object.values(fav.selectedModifiers as {[key: string]: ModifierOption}).map(m => m.name).join(', ')}</p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-stone-400 transition-transform duration-300 flex-shrink-0 ${swipedFavouriteId === fav.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                 </div>
                             </div>
                         </div>
                    ))}
                </div>
            ) : (
                <p className="text-stone-500 dark:text-zinc-400">You haven't saved any favourite drinks yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar: Loyalty */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-white">Your Loyalty Status</h2>
            <p className="text-6xl font-bold text-stone-700 dark:text-zinc-300">
                {currentUser.loyaltyPoints}
                <span className="text-2xl text-stone-500 dark:text-zinc-400">/5</span>
            </p>
            <p className="text-stone-600 dark:text-zinc-400 -mt-2">Points</p>
            <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2.5 mt-4">
                <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${(currentUser.loyaltyPoints/5) * 100}%`}}></div>
            </div>
            <p className="mt-4 text-sm text-stone-600 dark:text-zinc-300">
                {hasReward
                    ? "You have a free drink! It will be applied to your next order." 
                    : `You're ${5 - currentUser.loyaltyPoints} point${5 - currentUser.loyaltyPoints > 1 ? 's' : ''} away from a free drink!`
                }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;