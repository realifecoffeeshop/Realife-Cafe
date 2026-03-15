
import React, { useState, useContext, useMemo, useEffect, useCallback, Suspense, lazy, memo } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Drink, CartItem, PaymentMethod, Discount, UserRole, Order, ModifierOption, Category, SelectedModifier } from '../../types';
import DrinkCard from './DrinkCard';
import DetailedDrinkCard from './DetailedDrinkCard';
import MenuSkeleton from './MenuSkeleton';
import Logo from '../shared/Logo';

const OrderModal = lazy(() => import('./OrderModal'));
const CartFlyout = lazy(() => import('./CartFlyout'));
const TutorialGuide = lazy(() => import('./TutorialGuide'));
const TutorialStep = lazy(() => import('./TutorialStep'));

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


const CategoryButton: React.FC<{ 
    id: string; 
    name: string; 
    imageUrl?: string;
    isSelected: boolean; 
    onClick: (id: string) => void 
}> = memo(({ id, name, imageUrl, isSelected, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 border ${
            isSelected
            ? 'bg-[#A58D79] text-white border-[#A58D79] shadow-md transform scale-105'
            : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:border-[#A58D79] hover:bg-stone-50 dark:hover:bg-zinc-700'
        }`}
    >
        {imageUrl && (
            <img src={imageUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
        )}
        {name}
    </button>
));

const MenuControls: React.FC<{
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    visibleCategories: Category[];
    viewMode: 'compact' | 'detailed';
    setViewMode: (mode: 'compact' | 'detailed') => void;
}> = memo(({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, visibleCategories, viewMode, setViewMode }) => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-3xl font-bold text-stone-800 dark:text-white">Our Menu</h2>
            <div className="flex items-center gap-4">
                <div className="flex bg-white dark:bg-zinc-800 rounded-lg p-1 border border-stone-200 dark:border-zinc-700 shadow-sm">
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'compact' ? 'bg-stone-100 dark:bg-zinc-700 text-[#A58D79] dark:text-white shadow-inner' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                        title="Compact View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('detailed')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'detailed' ? 'bg-stone-100 dark:bg-zinc-700 text-[#A58D79] dark:text-white shadow-inner' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                        title="Detailed View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <input 
                    type="text"
                    placeholder="Search for a drink..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white w-full md:w-64"
                    aria-label="Search menu"
                />
            </div>
        </div>
        <div id="menu-categories" className="flex flex-wrap items-center gap-2">
            <CategoryButton 
                id="all" 
                name="All" 
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
  const { state, dispatch, firebaseUser } = useContext(AppContext);
  const { addToast } = useToast();
  const { currentUser, cart, tutorialSteps } = state;
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [pickupOption, setPickupOption] = useState<'now' | 'later'>('now');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
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
      setCustomerName(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    // Check for fullscreen param
    const params = new URLSearchParams(window.location.search);
    if (params.get('fullscreen') === 'true') {
        setShowFullscreenPrompt(true);
    }

    const tutorialShown = sessionStorage.getItem('tutorial-shown');
    if (currentUser && currentUser.hasCompletedTutorial === false && !tutorialShown) {
        setIsFirstLogin(true);
        sessionStorage.setItem('tutorial-shown', 'true');
    } else {
        setIsFirstLogin(false);
    }
  }, [currentUser]);

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

  const startTutorial = () => {
    setTutorialStep(0);
    setIsTutorialActive(true);
    setIsFirstLogin(false);
  };

  const nextStep = useCallback(() => {
    setTutorialStep(prev => {
        if (prev < tutorialSteps.length - 1) {
            return prev + 1;
        } else {
            return prev; // Should handle exit elsewhere
        }
    });
    // Check if it was the last step in a separate effect or check index
    if (tutorialStep >= tutorialSteps.length - 1) {
         setIsTutorialActive(false);
         setTutorialStep(0);
         if (currentUser && !currentUser.hasCompletedTutorial) {
            dispatch({ type: 'COMPLETE_TUTORIAL' });
            addToast("Tutorial complete! You can access it again any time from the help button.", "success");
         }
    }
  }, [tutorialStep, tutorialSteps, currentUser, dispatch, addToast]);

  const exitTutorial = (completed = false) => {
    setIsTutorialActive(false);
    setTutorialStep(0);
    if (completed && currentUser && !currentUser.hasCompletedTutorial) {
        dispatch({ type: 'COMPLETE_TUTORIAL' });
        addToast("Tutorial complete! You can access it again any time from the help button.", "success");
    }
  };

  const weeklyJoke = useMemo(() => {
    const week = getWeekNumber(new Date());
    return COFFEE_JOKES[week % COFFEE_JOKES.length];
  }, []);
  
  const handleSelectDrink = useCallback((drink: Drink) => {
    if (isTutorialActive && tutorialSteps[tutorialStep]?.waitForAction) {
        // Simple logic for tutorial progression
        setTimeout(() => {
             setTutorialStep(prev => Math.min(prev + 1, tutorialSteps.length - 1));
        }, 300);
    }
    setSelectedDrink(drink);
  }, [isTutorialActive, tutorialStep, tutorialSteps]);

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

  const handleSaveCartItem = useCallback((item: CartItem) => {
    if (editingCartItem) {
        // Update existing item
        dispatch({ type: 'UPDATE_CART_ITEM', payload: { ...item, id: editingCartItem.id } });
    } else {
        // Add new item with a unique ID
        dispatch({ type: 'ADD_ITEM_TO_CART', payload: { ...item, id: `cart-item-${Date.now()}` } });
    }

    if (isTutorialActive && tutorialSteps[tutorialStep]?.waitForAction) {
        setTimeout(() => {
             setTutorialStep(prev => Math.min(prev + 1, tutorialSteps.length - 1));
        }, 300);
    }

    // Reset editing state
    setSelectedDrink(null);
    setEditingCartItem(null);
  }, [editingCartItem, dispatch, isTutorialActive, tutorialStep, tutorialSteps]);


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

  const handlePlaceOrder = useCallback(async () => {
    if (isSubmitting) return;

    if (cart.length === 0) {
      addToast('Your cart is empty. Please add items to your order first.', 'error');
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
        const date = new Date(pickupDate);
        date.setHours(hour, minute, 0, 0);
        pickupTimestamp = date.getTime();

        if (pickupTimestamp < Date.now()) {
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
    const newStatus = isAdmin ? (pickupTimestamp ? 'scheduled' : 'pending') : 'payment-required';
    
    const newOrder: Omit<Order, 'id'> = {
        customerName: orderCustomerName,
        customerId: firebaseUser.uid, // Use the authenticated Firebase User ID
        items: cart,
        total: subtotal,
        totalCost: totalCost,
        discountApplied: appliedDiscount,
        finalTotal,
        paymentMethod,
        status: newStatus,
        createdAt: Date.now(),
        ...(pickupTimestamp && { pickupTime: pickupTimestamp }),
    };

    try {
        await addOrder(newOrder);
        
        // Dispatch action to update local state (clear cart, update loyalty, etc.)
        dispatch({
          type: 'PLACE_ORDER',
          payload: {
            customerName: orderCustomerName,
            customerId: firebaseUser.uid,
            total: subtotal,
            discountApplied: appliedDiscount,
            finalTotal,
            paymentMethod,
            pickupTime: pickupTimestamp,
          },
        });

        // Reset UI state
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
    } finally {
        setIsSubmitting(false);
    }
  }, [isSubmitting, cart, customerName, firebaseUser, pickupOption, pickupTime, pickupDate, currentUser, subtotal, appliedDiscount, finalTotal, paymentMethod, dispatch, addToast]);
  
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
       const matchesSearch = drink.name.toLowerCase().includes(searchTerm.toLowerCase());
       const matchesCategory = selectedCategory === 'all' || drink.category === selectedCategory;
       return matchesSearch && matchesCategory;
    });
  }, [state.drinks, searchTerm, selectedCategory]);
  
  const handleModalClose = () => {
      setSelectedDrink(null);
      setEditingCartItem(null);
  }

  const handleCartOpen = () => {
    if (isTutorialActive && tutorialSteps[tutorialStep]?.waitForAction) {
        setTimeout(() => {
             setTutorialStep(prev => Math.min(prev + 1, tutorialSteps.length - 1));
        }, 300);
    }
    setIsCartOpen(true);
  }

  const currentStepConfig = isTutorialActive ? tutorialSteps[tutorialStep] : null;

  return (
    <div className="bg-[#F5F3EF] dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 transition-colors duration-300 min-h-screen w-full">
        <div className="w-full px-4 md:px-8 py-4 md:py-8">
            <div className="text-center mb-8">
                <h1 id="customer-view-heading" className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">Welcome to Realife Cafe</h1>
                <p className="mt-3 text-lg text-stone-600 dark:text-zinc-300">Your weekly dose of happiness, one cup at a time.</p>
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

             <div className="my-6 p-4 bg-white dark:bg-zinc-800 border-l-4 border-amber-500 text-stone-800 dark:text-zinc-200 rounded-r-lg shadow">
                <p className="font-semibold">Weekly Coffee Joke:</p>
                <p className="italic">"{weeklyJoke}"</p>
              </div>
            
            <div id="menu-grid">
                {state.drinks.length === 0 ? (
                    <MenuSkeleton />
                ) : (
                    <div className={viewMode === 'compact' 
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
                        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    }>
                        {filteredDrinks.map((drink, index) => (
                            <div key={drink.id} className={index === 0 ? 'first-drink-card' : ''}>
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
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Floating Cart Button */}
        <button
            id="cart-button"
            onClick={handleCartOpen}
            className={`fixed bottom-6 right-24 bg-[#A58D79] dark:bg-white text-white dark:text-zinc-800 w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-[#947D6A] dark:hover:bg-neutral-200 transition-transform hover:scale-110 z-30 ${cart.length > 0 ? 'animate-pulse-cart' : ''}`}
            aria-label={`Open cart with ${cartItemCount} items`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemCount}
                </span>
            )}
        </button>
        
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
                isLoggedIn={!!currentUser}
                pickupOption={pickupOption}
                onPickupOptionChange={setPickupOption}
                pickupDate={pickupDate}
                onPickupDateChange={setPickupDate}
                pickupTimeValue={pickupTime}
                onPickupTimeChange={setPickupTime}
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

        <Suspense fallback={null}>
            <TutorialGuide isPulsing={isFirstLogin && !isTutorialActive} onClick={startTutorial} />
            {isTutorialActive && currentStepConfig && (
                <TutorialStep
                    key={tutorialStep}
                    step={currentStepConfig}
                    isLastStep={tutorialStep === tutorialSteps.length - 1}
                    onNext={!currentStepConfig.waitForAction ? () => setTutorialStep(prev => prev + 1) : () => {}}
                    onExit={() => exitTutorial(false)}
                />
            )}
        </Suspense>
        
        {/* Fullscreen Trigger Modal */}
        {showFullscreenPrompt && (
            <div className="fixed inset-0 bg-[#A58D79] z-50 flex flex-col items-center justify-center text-white p-6">
                 <div className="mb-8 transform scale-150">
                    <Logo />
                 </div>
                 <h2 className="text-3xl font-bold mb-4 text-center">Ready to Order?</h2>
                 <p className="mb-8 text-center text-lg max-w-md">Tap below to enter full-screen mode for the best experience.</p>
                 <button 
                    onClick={enterFullscreen}
                    className="bg-white text-stone-900 px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-stone-100 transition-transform transform hover:scale-105"
                 >
                    Start Ordering
                 </button>
            </div>
        )}
    </div>
  );
};

export default CustomerView;
