
import React, { useState, useContext, useMemo, useEffect, useCallback, Suspense, lazy, memo } from 'react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { Drink, CartItem, PaymentMethod, Discount, UserRole, Order, ModifierOption, Category, SelectedModifier } from '../../types';
import DrinkCard from './DrinkCard';
import DetailedDrinkCard from './DetailedDrinkCard';
import MenuSkeleton from './MenuSkeleton';
import Logo from '../shared/Logo';
import { Users } from 'lucide-react';

import { lazyWithRetry } from '../../lib/utils';

const OrderModal = lazyWithRetry(() => import('./OrderModal'));
const CartFlyout = lazyWithRetry(() => import('./CartFlyout'));
const CustomerDirectoryFlyout = lazyWithRetry(() => import('./CustomerDirectoryFlyout'));

import { addOrder } from '../../firebase/firestoreService';
import { COFFEE_JOKES } from '../../constants';

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate the number of days between the two dates and divide by 7
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};


import { motion, AnimatePresence } from 'framer-motion';

const CategoryButton: React.FC<{ 
    id: string; 
    name: string; 
    imageUrl?: string;
    isSelected: boolean; 
    onClick: (id: string) => void 
}> = memo(({ id, name, imageUrl, isSelected, onClick }) => {
    // Optimization: Use smaller width for category icons if they are from Unsplash
    const optimizedIcon = imageUrl?.includes('unsplash.com') 
        ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?' }w=100&q=40`
        : imageUrl;

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-full transition-all duration-300 border ${
                isSelected
                ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white shadow-lg'
                : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-100 dark:border-zinc-700 hover:border-stone-300 dark:hover:border-zinc-500 hover:bg-stone-50 dark:hover:bg-zinc-700/50 shadow-sm'
            }`}
        >
            {optimizedIcon && (
                <img 
                    src={optimizedIcon} 
                    alt="" 
                    className="w-6 h-6 rounded-lg object-cover shadow-sm" 
                    loading="lazy"
                    decoding="async"
                />
            )}
            <span className="font-serif tracking-tight">{name}</span>
        </motion.button>
    );
});

const MenuControls: React.FC<{
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    visibleCategories: Category[];
    viewMode: 'compact' | 'detailed';
    setViewMode: (mode: 'compact' | 'detailed') => void;
}> = memo(({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, visibleCategories, viewMode, setViewMode }) => (
    <div className="space-y-8 mb-12">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-stone-100 dark:border-zinc-800 pb-8">
            <div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Our Menu</h2>
                <p className="text-stone-500 dark:text-zinc-400 mt-2 font-serif italic">Handcrafted with passion and precision.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex bg-white dark:bg-zinc-800 rounded-full p-1.5 border border-stone-100 dark:border-zinc-700 shadow-sm">
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`p-2.5 rounded-full transition-all duration-300 ${viewMode === 'compact' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                        title="Compact View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('detailed')}
                        className={`p-2.5 rounded-full transition-all duration-300 ${viewMode === 'detailed' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                        title="Detailed View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <div className="relative group">
                    <input 
                        type="text"
                        placeholder="Search our menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-6 py-3 border-none rounded-full bg-white dark:bg-zinc-800 text-stone-900 dark:text-white w-full md:w-56 focus:w-72 transition-all duration-500 shadow-sm focus:shadow-md outline-none ring-1 ring-stone-100 dark:ring-zinc-700 focus:ring-stone-200 dark:focus:ring-zinc-600"
                        aria-label="Search menu"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>
        <div id="menu-categories" className="flex flex-wrap items-center gap-4">
            <CategoryButton 
                id="all" 
                name="All Items" 
                isSelected={selectedCategory === 'all'} 
                onClick={setSelectedCategory} 
            />
            {visibleCategories.map((cat) => (
                <CategoryButton 
                    key={cat.id}
                    id={cat.id}
                    name={cat.name}
                    imageUrl={cat.imageUrl}
                    isSelected={selectedCategory === cat.id}
                    onClick={setSelectedCategory}
                />
            ))}
        </div>
    </div>
));

const CustomerView: React.FC = () => {
  const { state, dispatch, firebaseUser } = useApp();
  const { addToast } = useToast();
  const { currentUser, cart } = state;
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomerDirectoryOpen, setIsCustomerDirectoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [pickupOption, setPickupOption] = useState<'now' | 'later'>('now');
  const [pickupDate, setPickupDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [pickupTime, setPickupTime] = useState(() => {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 60 * 1000); // Default to 30 mins from now
    return `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;
  });
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBirthday = useMemo(() => {
    if (!currentUser?.birthday) return false;
    const bday = new Date(currentUser.birthday);
    const today = new Date();
    return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
  }, [currentUser]);

  useEffect(() => {
    if (isBirthday && cart.length > 0 && !appliedDiscount) {
      const birthdayDiscount: Discount = {
        id: 'birthday-free-drink',
        code: 'BIRTHDAY_FREE',
        type: 'percentage',
        value: 100
      };
      setAppliedDiscount(birthdayDiscount);
      addToast("Happy Birthday! Your order is on us today! 🎂", "success");
    }
  }, [isBirthday, cart.length, appliedDiscount, addToast]);


  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name || '');
    }
  }, [currentUser]);

  useEffect(() => {
    // Check for fullscreen param
    const params = new URLSearchParams(window.location.search);
    if (params.get('fullscreen') === 'true') {
        setShowFullscreenPrompt(true);
    }
    const tableParam = params.get('table');
    if (tableParam) {
        setTableNumber(tableParam);
    }
    if (params.get('cart') === 'open') {
        setIsCartOpen(true);
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete('cart');
        window.history.replaceState({}, '', url);
    }

    // OPTIMIZATION: Pre-fetch lazy components after initial render
    const prefetch = async () => {
        try {
            // These are lazy loaded, but we can pre-fetch them to avoid delay when needed
            import('./OrderModal');
            import('./CartFlyout');
        } catch (e) {
            console.warn("Pre-fetch failed", e);
        }
    };
    prefetch();
  }, []);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
    setShowFullscreenPrompt(false);
    // Remove query param to clean URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('fullscreen');
    window.history.replaceState({}, '', url);
  };

  const weeklyJoke = useMemo(() => {
    if (!state.isMenuLoaded) return null;
    const week = getWeekNumber(new Date());
    return COFFEE_JOKES[week % COFFEE_JOKES.length];
  }, [state.isMenuLoaded]);
  
  const handleSelectDrink = useCallback((drink: Drink) => {
    setSelectedDrink(drink);
  }, []);

  const handleQuickAdd = useCallback((drink: Drink) => {
    const initialSelections: { [groupId: string]: SelectedModifier[] } = {};
    drink.modifierGroups.forEach(groupId => {
      const group = state.modifierGroups.find(g => g.id === groupId);
      if (group && group.options.length > 0) {
        initialSelections[groupId] = [{ option: group.options[0], quantity: 1 }];
      }
    });

    const basePrice = typeof drink.basePrice === 'number' && !isNaN(drink.basePrice) ? drink.basePrice : 0;
    const modifiersPrice = Object.values(initialSelections).reduce((sum, mods) => {
        return sum + mods.reduce((modSum, sm) => {
            const price = typeof sm.option.price === 'number' && !isNaN(sm.option.price) ? sm.option.price : 0;
            return modSum + (price * sm.quantity);
        }, 0);
    }, 0);
    const finalPrice = basePrice + modifiersPrice;

    const newCartItem: CartItem = {
      id: `cart-item-${Date.now()}`,
      drink,
      quantity: 1,
      selectedModifiers: initialSelections,
      finalPrice,
    };

    dispatch({ type: 'ADD_ITEM_TO_CART', payload: newCartItem });
    addToast(`${drink.name} added to cart!`, 'success');
  }, [state.modifierGroups, dispatch, addToast]);
  
  const handleEditCartItem = useCallback((item: CartItem) => {
      setEditingCartItem(item);
      setSelectedDrink(item.drink);
      setIsCartOpen(false); // Close cart to open the order modal
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    // Calculate unit price based on current finalPrice and quantity
    const unitPrice = item.finalPrice / item.quantity;
    const newFinalPrice = unitPrice * newQuantity;
    
    dispatch({ 
        type: 'UPDATE_CART_ITEM', 
        payload: { ...item, quantity: newQuantity, finalPrice: newFinalPrice } 
    });
  }, [cart, dispatch]);

  const handleSaveCartItem = useCallback((item: CartItem) => {
    if (editingCartItem) {
        // Update existing item
        dispatch({ type: 'UPDATE_CART_ITEM', payload: { ...item, id: editingCartItem.id } });
    } else {
        // Add new item with a unique ID
        dispatch({ type: 'ADD_ITEM_TO_CART', payload: { ...item, id: `cart-item-${Date.now()}` } });
    }

    // Reset editing state
    setSelectedDrink(null);
    setEditingCartItem(null);
  }, [editingCartItem, dispatch]);


  const removeFromCart = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM_FROM_CART', payload: itemId });
  }, [dispatch]);
  
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.finalPrice, 0), [cart]);

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const finalTotal = useMemo(() => {
    let total = subtotal;
    
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        total *= (100 - appliedDiscount.value) / 100;
      } else {
        total -= appliedDiscount.value;
      }
    }
    return Math.max(0, total);
  }, [subtotal, appliedDiscount]);

  const handleApplyDiscount = useCallback(() => {
    const discount = state.discounts.find(d => d.code.toLowerCase() === discountCode.toLowerCase());
    if (discount) {
      setAppliedDiscount(discount);
      setError('');
      addToast(`Discount "${discount.code}" applied!`, 'success');
    } else {
      setAppliedDiscount(null);
      setError('Invalid discount code.');
      addToast('Invalid or expired discount code.', 'error');
    }
  }, [state.discounts, discountCode, addToast]);

  const validateSchedules = useCallback((items: CartItem[], dateStr: string, timeStr: string, option: 'now' | 'later') => {
    const now = new Date();
    const selectedDate = option === 'later' 
        ? new Date(`${dateStr}T${timeStr || '00:00'}`)
        : new Date();

    for (const item of items) {
        const sc = item.drink.schedulingConstraint;
        if (sc && sc.isEnabled) {
            if (sc.type === 'recurring') {
                if (selectedDate.getDay() !== sc.collectionDay) {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return { 
                        isValid: false, 
                        message: `${item.drink.name} is only available for collection on ${days[sc.collectionDay!]}.` 
                    };
                }

                const collectionDate = new Date(selectedDate);
                collectionDate.setHours(0, 0, 0, 0);
                
                const cutoffDate = new Date(collectionDate);
                let daysToCutoff = collectionDate.getDay() - sc.cutoffDay!;
                if (daysToCutoff < 0) daysToCutoff += 7;
                if (daysToCutoff === 0) daysToCutoff = 0; // Same day cutoff
                
                cutoffDate.setDate(cutoffDate.getDate() - daysToCutoff);
                const [hours, minutes] = (sc.cutoffTime || '23:59').split(':').map(Number);
                cutoffDate.setHours(hours, minutes, 0, 0);

                if (now > cutoffDate) {
                    return { 
                        isValid: false, 
                        message: `Pre-orders for ${item.drink.name} on ${collectionDate.toLocaleDateString()} closed on ${cutoffDate.toLocaleDateString()} at ${sc.cutoffTime}.` 
                    };
                }
            } else if (sc.type === 'fixed') {
                const targetDate = option === 'later' ? dateStr : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                if (targetDate !== sc.collectionDate) {
                    return { 
                        isValid: false, 
                        message: `${item.drink.name} is only available for collection on ${sc.collectionDate}.` 
                    };
                }
                const cutoffDateTime = new Date(`${sc.cutoffDate}T${sc.cutoffTime}`);
                if (now > cutoffDateTime) {
                    return { 
                        isValid: false, 
                        message: `Pre-orders for ${item.drink.name} closed on ${sc.cutoffDate} at ${sc.cutoffTime}.` 
                    };
                }
            }
        }
    }
    return { isValid: true };
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (isSubmitting) return;

    if (cart.length === 0) {
      addToast('Your cart is empty. Please add items to your order first.', 'error');
      return;
    }

    const scheduleValidation = validateSchedules(cart, pickupDate, pickupTime, pickupOption);
    if (!scheduleValidation.isValid) {
        setError(scheduleValidation.message || 'Invalid scheduling selection.');
        addToast(scheduleValidation.message || 'Invalid scheduling selection.', 'error');
        return;
    }

    if (!customerName.trim()) {
      setError('Group Order Name is required.');
      addToast('Group Order Name is required.', 'error');
      return;
    }
    if (!firebaseUser) {
        setError('Connecting to service... Please try again in a moment.');
        addToast('Connecting to service... Please try again in a moment.', 'error');
        return;
    }
    
    setIsSubmitting(true);
    let orderCustomerName = customerName.trim();
    
    let pickupTimestamp: number | undefined = undefined;
    if (pickupOption === 'later') {
        const [hour, minute] = pickupTime.split(':').map(Number);
        const [year, month, day] = pickupDate.split('-').map(Number);
        const date = new Date(year, month - 1, day, hour, minute, 0, 0);
        pickupTimestamp = date.getTime();

        // Add 1-minute buffer to avoid issues with exact time matches
        if (pickupTimestamp < (Date.now() - 60000)) {
            setError('Please select a pickup time in the future.');
            addToast('Please select a pickup time in the future.', 'error');
            setIsSubmitting(false);
            return;
        }
    }

    const totalCost = cart.reduce((sum, item) => {
        const modifiersCost = Object.values(item.selectedModifiers || {}).reduce((modSum: number, mods: SelectedModifier[]) => {
            return modSum + mods.reduce((innerSum, sm) => {
                const cost = typeof sm.option.cost === 'number' && !isNaN(sm.option.cost) ? sm.option.cost : 0;
                return innerSum + (cost * sm.quantity);
            }, 0);
        }, 0);
        const baseCost = typeof item.drink.baseCost === 'number' && !isNaN(item.drink.baseCost) ? item.drink.baseCost : 0;
        const itemCost = (baseCost + modifiersCost) * item.quantity;
        return sum + itemCost;
    }, 0);

    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const isPayOnCollection = paymentMethod === PaymentMethod.COLLECTION;
    const isCardPayment = paymentMethod === PaymentMethod.CARD;
    const isVerified = (isAdmin && !isPayOnCollection) || isCardPayment;
    const newStatus = pickupTimestamp ? 'scheduled' : (isVerified ? 'pending' : 'payment-required');
    
    const newOrder: Omit<Order, 'id'> = {
        customerName: orderCustomerName,
        customerId: currentUser?.id || firebaseUser.uid, // Use the logged-in user ID or fallback to anonymous ID
        items: cart,
        total: subtotal,
        totalCost: totalCost,
        discountApplied: appliedDiscount,
        finalTotal,
        paymentMethod,
        status: newStatus,
        isVerified,
        createdAt: Date.now(),
        ...(pickupTimestamp && { pickupTime: pickupTimestamp }),
        ...(tableNumber && { tableNumber }),
    };

    try {
        await addOrder(newOrder);
        
        // Dispatch action to update local state (clear cart, update loyalty, etc.)
        dispatch({
          type: 'PLACE_ORDER',
          payload: {
            customerName: orderCustomerName,
            customerId: currentUser?.id || firebaseUser.uid,
            total: subtotal,
            discountApplied: appliedDiscount,
            finalTotal,
            paymentMethod,
            isVerified,
            pickupTime: pickupTimestamp,
          },
        });

        // Reset UI state
        setIsSubmitting(false);
        if (!currentUser) {
            setCustomerName('');
        }
        setDiscountCode('');
        setAppliedDiscount(null);
        setError('');
        addToast(pickupTimestamp ? 'Order scheduled successfully!' : 'Order placed successfully!', 'success');
        setIsCartOpen(false);
    } catch (err) {
        console.error("Failed to place order:", err);
        setError('There was a problem placing your order. Please try again.');
        addToast('Could not place order. Please check connection and security rules.', 'error');
        setIsSubmitting(false);
    } finally {
        setIsSubmitting(false);
    }
  }, [isSubmitting, cart, customerName, firebaseUser, pickupOption, pickupTime, pickupDate, currentUser, subtotal, appliedDiscount, finalTotal, paymentMethod, dispatch, addToast, tableNumber]);
  
  const visibleCategories = useMemo(() => {
    const categoriesWithDrinks = new Set<string>();
    state.drinks.forEach(drink => {
        if (drink.category) {
            categoriesWithDrinks.add(drink.category);
        }
    });
    return state.categories.filter(cat => categoriesWithDrinks.has(cat.id));
  }, [state.drinks, state.categories]);

  const filteredDrinks = useMemo(() => {
    return state.drinks.filter(drink => {
       if (!drink || !drink.name || !drink.category) return false;
       const matchesSearch = (drink.name || '').toLowerCase().includes(deferredSearchTerm.toLowerCase());
       const matchesCategory = selectedCategory === 'all' || drink.category === selectedCategory;
       return matchesSearch && matchesCategory;
     });
  }, [state.drinks, deferredSearchTerm, selectedCategory]);
  
  const handleModalClose = () => {
      setSelectedDrink(null);
      setEditingCartItem(null);
  }

  const handleCartOpen = () => {
    setIsCartOpen(true);
  }

  return (
    <div className="bg-[#F5F3EF] dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 transition-colors duration-300 min-h-screen w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
            {/* Compact Header for Instant Menu Visibility */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 mb-8 md:mb-12">
                <div className="text-center md:text-left">
                    <h1 id="customer-view-heading" className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-zinc-100 tracking-tight mb-2">Realife Cafe</h1>
                    <p className="text-base sm:text-lg font-serif italic text-stone-500 dark:text-zinc-400">"Your weekly dose of happiness, one cup at a time."</p>
                </div>
                <div className="hidden md:block">
                    <div className="bg-white dark:bg-zinc-800 px-6 py-4 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-800">
                         <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Barista's Weekly Wit</p>
                         <p className="text-sm font-serif italic text-stone-900 dark:text-white leading-tight">"{weeklyJoke}"</p>
                    </div>
                </div>
            </div>

            {/* Mobile-only Weekly Wit - Compact */}
            <div className="md:hidden mb-8">
                <div className="bg-stone-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800/50">
                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-1">Weekly Wit</p>
                    <p className="text-xs font-serif italic text-stone-600 dark:text-zinc-400">"{weeklyJoke}"</p>
                </div>
            </div>
            
            <MenuControls 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                visibleCategories={visibleCategories}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />
            
            <div id="menu-grid" className="menu-grid-container min-h-[400px] transform-gpu">
                {state.drinks.length === 0 ? (
                    <MenuSkeleton viewMode={viewMode} />
                ) : (
                    <>
                        {!state.isMenuLoaded && (
                            <div className="flex items-center space-x-2 mb-4 text-stone-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                                <div className="w-1.5 h-1.5 bg-stone-400 dark:bg-zinc-500 rounded-full"></div>
                                <span>Updating Menu...</span>
                            </div>
                        )}
                        <motion.div 
                            layout
                            className={viewMode === 'compact' 
                                ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-6"
                                : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredDrinks.map((drink, index) => (
                                    <motion.div 
                                        key={drink.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2, delay: index * 0.02 }}
                                        className={index === 0 ? 'first-drink-card' : ''}
                                    >
                                        {viewMode === 'compact' ? (
                                            <DrinkCard 
                                                drink={drink} 
                                                onSelect={handleSelectDrink} 
                                                onQuickAdd={handleQuickAdd}
                                                priority={index < 6}
                                            />
                                        ) : (
                                            <DetailedDrinkCard 
                                                drink={drink} 
                                                onSelect={handleSelectDrink} 
                                                onQuickAdd={handleQuickAdd}
                                                priority={index < 4}
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </div>
        </div>

        {/* Floating Cart Button */}
        <motion.button
            id="cart-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCartOpen}
            className={`fixed bottom-6 right-6 bg-brand-primary text-white dark:bg-white dark:text-stone-900 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-stone-700 dark:hover:bg-stone-200 transition-all duration-300 z-30 ${cart.length > 0 ? 'animate-pulse-cart' : ''}`}
            aria-label={`Open cart with ${cartItemCount} items`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {cartItemCount > 0 && (
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
                >
                    {cartItemCount}
                </motion.span>
            )}
        </motion.button>

        {/* Admin Customer Directory Toggle */}
        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.KITCHEN) && (
            <motion.button
                id="directory-toggle"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCustomerDirectoryOpen(true)}
                className="fixed bottom-6 right-24 bg-amber-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-amber-700 transition-all duration-300 z-30"
                aria-label="Open customer directory"
            >
                <Users className="h-7 w-7" />
            </motion.button>
        )}
        
        <Suspense fallback={null}>
            <CartFlyout
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                subtotal={subtotal}
                finalTotal={finalTotal}
                appliedDiscount={appliedDiscount}
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                discountCode={discountCode}
                onDiscountCodeChange={setDiscountCode}
                onApplyDiscount={handleApplyDiscount}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                error={error}
                onPlaceOrder={handlePlaceOrder}
                isSubmitting={isSubmitting}
                onRemoveItem={removeFromCart}
                onEditItem={handleEditCartItem}
                onUpdateQuantity={handleUpdateQuantity}
                isLoggedIn={!!currentUser}
                isAdmin={currentUser?.role === UserRole.ADMIN}
                pickupOption={pickupOption}
                onPickupOptionChange={setPickupOption}
                pickupDate={pickupDate}
                onPickupDateChange={setPickupDate}
                pickupTimeValue={pickupTime}
                onPickupTimeChange={setPickupTime}
                tableNumber={tableNumber}
                onTableNumberChange={setTableNumber}
            />
        </Suspense>

        <Suspense fallback={null}>
            <CustomerDirectoryFlyout
                isOpen={isCustomerDirectoryOpen}
                onClose={() => setIsCustomerDirectoryOpen(false)}
                onSelectCustomer={(customer) => {
                    setCustomerName(customer.name);
                    setIsCustomerDirectoryOpen(false);
                    setIsCartOpen(true); // Open cart to show the name is set
                    addToast(`Selected customer: ${customer.name}`, 'success');
                }}
            />
        </Suspense>

        <Suspense fallback={null}>
            <OrderModal
                isOpen={!!selectedDrink}
                drink={selectedDrink}
                onClose={handleModalClose}
                onSaveItem={handleSaveCartItem}
                cartItemToEdit={editingCartItem}
            />
        </Suspense>
        
        {/* Fullscreen Trigger Modal */}
        <AnimatePresence>
            {showFullscreenPrompt && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#A58D79] z-50 flex flex-col items-center justify-center text-white p-6"
                >
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <Logo />
                    </motion.div>
                    <motion.h2 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold mb-4 text-center"
                    >
                        Ready to Order?
                    </motion.h2>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-8 text-center text-lg max-w-md"
                    >
                        Tap below to enter full-screen mode for the best experience.
                    </motion.p>
                    <motion.button 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={enterFullscreen}
                        className="bg-white text-stone-900 px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-stone-100 transition-all"
                    >
                        Start Ordering
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default CustomerView;
