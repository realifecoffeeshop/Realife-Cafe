
import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Drink, CartItem, PaymentMethod, Discount, UserRole, Order, ModifierOption } from '../../types';
import DrinkCard from './DrinkCard';
import OrderModal from './OrderModal';
import CartFlyout from './CartFlyout';
import { addOrder } from '../../firebase/firestoreService';
import { COFFEE_JOKES } from '../../constants';
import TutorialGuide from './TutorialGuide';
import TutorialStep from './TutorialStep';
import Logo from '../shared/Logo';

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate the number of days between the two dates and divide by 7
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};


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
  const [pickupOption, setPickupOption] = useState<'now' | 'later'>('now');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);


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
  
  const handleEditCartItem = (item: CartItem) => {
      setEditingCartItem(item);
      setSelectedDrink(item.drink);
      setIsCartOpen(false); // Close cart to open the order modal
  };

  const handleSaveCartItem = (item: CartItem) => {
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
  };


  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM_FROM_CART', payload: itemId });
  };
  
  const hasLoyaltyReward = useMemo(() => {
    if (currentUser) {
        return currentUser.loyaltyPoints === 0 && cart.length > 0 && currentUser.name.toLowerCase() === customerName.toLowerCase();
    }
    const guestLoyalty = state.loyaltyData[customerName.toLowerCase()];
    return guestLoyalty && guestLoyalty.drinkCount === 0 && cart.length > 0;
  }, [customerName, currentUser, state.loyaltyData, cart.length]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.finalPrice, 0), [cart]);

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const finalTotal = useMemo(() => {
    let total = subtotal;
    let loyaltyDiscount = 0;

    if (hasLoyaltyReward && cart.length > 0) {
        const cheapestItem = cart.reduce((cheapest, item) => (item.finalPrice/item.quantity < cheapest.finalPrice/cheapest.quantity ? item : cheapest));
        loyaltyDiscount = cheapestItem.finalPrice / cheapestItem.quantity;
        total -= loyaltyDiscount;
    }
    
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        total *= (100 - appliedDiscount.value) / 100;
      } else {
        total -= appliedDiscount.value;
      }
    }
    return Math.max(0, total);
  }, [subtotal, appliedDiscount, hasLoyaltyReward, cart]);

  const handleApplyDiscount = () => {
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
  };

  const handlePlaceOrder = async () => {
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
            return;
        }
    }

    const totalCost = cart.reduce((sum, item) => {
        const modifiersCost = Object.values(item.selectedModifiers).reduce((modSum: number, mod: ModifierOption) => modSum + (mod.cost || 0), 0);
        const itemCost = (item.drink.baseCost + modifiersCost) * item.quantity;
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
    }
  };
  
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
    <div className="bg-[#F5F3EF] dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 transition-colors duration-300">
        <div className="container mx-auto p-4 md:p-8">
            <div className="text-center mb-8">
                <h1 id="customer-view-heading" className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">Welcome to Realife Cafe</h1>
                <p className="mt-3 text-lg text-stone-600 dark:text-zinc-300">Your weekly dose of happiness, one cup at a time.</p>
            </div>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-white">Our Menu</h2>
                <div className="flex items-center gap-4">
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
             <div className="mb-6 p-4 bg-white dark:bg-zinc-800 border-l-4 border-amber-500 text-stone-800 dark:text-zinc-200 rounded-r-lg shadow">
                <p className="font-semibold">Weekly Coffee Joke:</p>
                <p className="italic">"{weeklyJoke}"</p>
              </div>
            <div id="menu-categories" className="flex flex-wrap items-center gap-2 mb-6">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                        selectedCategory === 'all'
                        ? 'bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800'
                        : 'bg-white dark:bg-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-600'
                    }`}
                >
                    All
                </button>
                {visibleCategories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                            selectedCategory === cat.id
                            ? 'bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800'
                            : 'bg-white dark:bg-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-600'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            <div id="menu-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {filteredDrinks.map((drink, index) => (
                <div key={drink.id} className={index === 0 ? 'first-drink-card' : ''}>
                    <DrinkCard drink={drink} onSelect={handleSelectDrink} />
                </div>
            ))}
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
        
        <CartFlyout
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            subtotal={subtotal}
            finalTotal={finalTotal}
            appliedDiscount={appliedDiscount}
            hasLoyaltyReward={hasLoyaltyReward}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            discountCode={discountCode}
            onDiscountCodeChange={setDiscountCode}
            onApplyDiscount={handleApplyDiscount}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            error={error}
            onPlaceOrder={handlePlaceOrder}
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

        <OrderModal
            isOpen={!!selectedDrink}
            drink={selectedDrink}
            onClose={handleModalClose}
            onSaveItem={handleSaveCartItem}
            cartItemToEdit={editingCartItem}
        />

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
