
import React, { memo, useState, useEffect } from 'react';
import { CartItem, PaymentMethod, Discount, ModifierOption, SelectedModifier } from '../../types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CreditCard, Terminal, HelpCircle, ArrowRight } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';
import { useToast } from '../../context/ToastContext';

// Robust check for the publishable key
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const IS_STRIPE_CONFIGURED = !!(STRIPE_KEY && typeof STRIPE_KEY === 'string' && STRIPE_KEY.startsWith('pk_'));

interface CartFlyoutProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    subtotal: number;
    finalTotal: number;
    appliedDiscount: Discount | null;
    customerName: string;
    onCustomerNameChange: (name: string) => void;
    discountCode: string;
    onDiscountCodeChange: (code: string) => void;
    onApplyDiscount: () => void;
    paymentMethod: PaymentMethod;
    onPaymentMethodChange: (method: PaymentMethod) => void;
    error: string;
    onPlaceOrder: () => void;
    isSubmitting: boolean;
    onRemoveItem: (id: string) => void;
    onEditItem: (item: CartItem) => void;
    onUpdateQuantity: (id: string, newQuantity: number) => void;
    isLoggedIn: boolean;
    isAdmin?: boolean;
    pickupOption: 'now' | 'later';
    onPickupOptionChange: (option: 'now' | 'later') => void;
    pickupDate: string;
    onPickupDateChange: (date: string) => void;
    pickupTimeValue: string;
    onPickupTimeChange: (time: string) => void;
    tableNumber: string | null;
    onTableNumberChange: (table: string) => void;
}

const CartFlyout: React.FC<CartFlyoutProps> = ({
    isOpen,
    onClose,
    cart,
    subtotal,
    finalTotal,
    appliedDiscount,
    customerName,
    onCustomerNameChange,
    discountCode,
    onDiscountCodeChange,
    onApplyDiscount,
    paymentMethod,
    onPaymentMethodChange,
    error,
    onPlaceOrder,
    isSubmitting,
    onRemoveItem,
    onEditItem,
    onUpdateQuantity,
    isLoggedIn,
    isAdmin,
    pickupOption,
    onPickupOptionChange,
    pickupDate,
    onPickupDateChange,
    pickupTimeValue,
    onPickupTimeChange,
    tableNumber,
    onTableNumberChange,
}) => {
    const { addToast } = useToast();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isStripeLoading, setIsStripeLoading] = useState(false);
    const [isStripeConfirming, setIsStripeConfirming] = useState(false);
    const [stripeLoaded, setStripeLoaded] = useState<boolean | null>(null);
    const [lazyStripePromise, setLazyStripePromise] = useState<any>(null);

    const handleSimulatePayment = () => {
        setIsStripeConfirming(true);
        setTimeout(() => {
            setIsStripeConfirming(false);
            onPlaceOrder();
        }, 1500);
    };

    // Lazy load Stripe ONLY when card payment is selected and the cart is open
    useEffect(() => {
        if (isOpen && paymentMethod === PaymentMethod.CARD && IS_STRIPE_CONFIGURED && !lazyStripePromise) {
            const load = async () => {
                try {
                    const promise = loadStripe(STRIPE_KEY as string);
                    setLazyStripePromise(promise);
                    const res = await promise;
                    if (!res) throw new Error("Stripe script loaded but failed to initialize.");
                    setStripeLoaded(true);
                } catch (err: any) {
                    console.error("[Stripe] Failed to initialize:", err);
                    setStripeLoaded(false);
                    if (err.message && err.message.includes('network')) {
                        addToast("Network blocked Stripe. Check privacy settings or browser extensions.", "error");
                    }
                }
            };
            load();
        } else if (!IS_STRIPE_CONFIGURED) {
            setStripeLoaded(false);
        }
    }, [isOpen, paymentMethod]);

    // Fetch PaymentIntent when CARD is selected and total > 0
    useEffect(() => {
        if (paymentMethod === PaymentMethod.CARD && finalTotal > 0 && isOpen) {
            const fetchPaymentIntent = async () => {
                setIsStripeLoading(true);
                try {
                    const response = await fetch('/api/create-payment-intent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: finalTotal }),
                    });
                    const data = await response.json();
                    if (data.clientSecret) {
                        setClientSecret(data.clientSecret);
                    } else {
                        console.error('Failed to get client secret:', data.error);
                    }
                } catch (err) {
                    console.error('Error fetching payment intent:', err);
                } finally {
                    setIsStripeLoading(false);
                }
            };
            fetchPaymentIntent();
        } else {
            setClientSecret(null);
        }
    }, [paymentMethod, finalTotal, isOpen]);

    const handleStripeSuccess = () => {
        onPlaceOrder();
    };

    const handleStripeError = (msg: string) => {
        // Error is handled in StripePaymentForm but we could also set it here if needed
    };

    const stripeOptions = React.useMemo(() => ({
        clientSecret: clientSecret || '',
        appearance: { theme: 'stripe' as const },
    }), [clientSecret]);

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-stone-900/20 backdrop-blur-md z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Flyout Panel */}
            <div
                className={`fixed top-0 right-0 h-[100dvh] w-full sm:max-w-md bg-white dark:bg-zinc-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col overscroll-none ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-heading"
            >
                <header className="flex items-center justify-between p-4 md:p-6 border-b dark:border-zinc-700">
                    <div className="flex items-center space-x-2">
                        <h2 id="cart-heading" className="text-xl md:text-3xl font-serif font-bold text-stone-900 dark:text-white">Your Order</h2>
                        <span className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">{cart.length}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white rounded-full p-2 transition-all"
                        aria-label="Close cart"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto scrollbar-hide overscroll-contain">
                    <div className="flex flex-col min-h-full">
                        <div className="flex-grow p-3 md:p-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20">
                                    <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <p className="text-stone-500 dark:text-zinc-400 font-serif italic text-base">"Your cart is waiting for something delicious."</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex flex-col p-3 md:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 group transition-all hover:shadow-2xl hover:-translate-y-1">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-grow pr-3">
                                                    <div className="flex flex-col gap-2">
                                                        <p className="font-serif font-bold text-lg md:text-2xl text-stone-900 dark:text-white leading-tight">
                                                            {item.drink?.name || 'Unknown Drink'}
                                                            {item.selectedVariantId && item.drink?.variants && (
                                                                <span className="text-xs font-bold text-stone-400 dark:text-zinc-500 ml-1 italic">
                                                                    ({item.drink.variants.find(v => v.id === item.selectedVariantId)?.name})
                                                                </span>
                                                            )}
                                                        </p>
                                                        
                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-3 bg-stone-50 dark:bg-zinc-800 p-1.5 rounded-2xl w-fit border border-stone-100 dark:border-zinc-700/50 shadow-sm">
                                                            <button 
                                                                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all border border-stone-100 dark:border-zinc-700 font-bold text-lg shadow-sm active:scale-95"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-sm font-bold min-w-[24px] text-center">{item.quantity}</span>
                                                            <button 
                                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all border border-stone-100 dark:border-zinc-700 font-bold text-lg shadow-sm active:scale-95"
                                                                aria-label="Increase quantity"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {item.customName && <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 italic mt-2 tracking-wide font-serif">"{item.customName}"</p>}
                                                    <div className="text-[10px] text-stone-400 dark:text-zinc-500 mt-2 leading-relaxed font-medium uppercase tracking-widest">
                                                        {Object.values(item.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => 
                                                            sm.quantity > 1 ? `${sm.quantity}x ${sm.option?.name || 'Unknown'}` : (sm.option?.name || 'Unknown')
                                                        ).join(' • ')}
                                                    </div>
                                                </div>
                                                <span className="font-serif font-bold text-xl text-stone-900 dark:text-white tracking-tighter">${item.finalPrice.toFixed(2)}</span>
                                            </div>
                                            
                                            <div className="flex justify-end items-center space-x-6 mt-4 pt-4 border-t border-stone-50 dark:border-zinc-800/50">
                                                <button 
                                                    onClick={() => onEditItem(item)}
                                                    className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                                                    aria-label={`Edit ${item.drink?.name || 'Item'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => onRemoveItem(item.id)}
                                                    className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-red-300 hover:text-red-600 transition-all"
                                                    aria-label={`Remove ${item.drink?.name || 'Item'}`}
                                                >
                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <footer className="p-4 md:p-8 border-t border-stone-100 dark:border-zinc-800 space-y-4 md:space-y-6 cart-flyout-footer bg-stone-50/50 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 mt-auto">
                        <div className="space-y-2 md:space-y-4">
                            <div className="flex justify-between text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>

                            {appliedDiscount && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-[0.1em] text-[10px]">
                                    <span>{appliedDiscount.id === 'birthday-free-drink' ? '🎂 Birthday Gift' : `Discount (${appliedDiscount.code})`}</span>
                                    <span>- ${ (subtotal - (appliedDiscount.type === 'percentage' ? subtotal * (1 - appliedDiscount.value/100) : subtotal - appliedDiscount.value) ).toFixed(2) }</span>
                                </div>
                            )}

                            <div className="flex justify-between text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-white pt-2 md:pt-4 border-t border-stone-100 dark:border-zinc-800">
                                <span>Total</span>
                                <span className="tracking-tighter">${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-stone-100 dark:border-zinc-800">
                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Pickup Preference</label>
                                <div className="flex p-1 bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                                    <button
                                        onClick={() => onPickupOptionChange('now')}
                                        className={`px-3 py-2 text-[10px] font-bold flex-1 rounded-lg md:rounded-xl transition-all duration-500 ${pickupOption === 'now' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        Now
                                    </button>
                                    <button
                                        onClick={() => onPickupOptionChange('later')}
                                        className={`px-3 py-2 text-[10px] font-bold flex-1 rounded-lg md:rounded-xl transition-all duration-500 ${pickupOption === 'later' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </div>
                            
                            {pickupOption === 'later' && (
                                <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-inner">
                                    <div className="space-y-0.5">
                                        <label htmlFor="pickup-date" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-0.5">Date</label>
                                        <input
                                            id="pickup-date"
                                            type="date"
                                            value={pickupDate}
                                            onChange={(e) => onPickupDateChange(e.target.value)}
                                            min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                                            className="w-full p-0 text-xs bg-transparent border-none focus:ring-0 dark:text-white font-serif italic"
                                        />
                                    </div>
                                    <div className="border-l border-stone-50 dark:border-zinc-800 pl-2 space-y-0.5">
                                        <label htmlFor="pickup-time" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-0.5">Time</label>
                                        <input
                                            id="pickup-time"
                                            type="time"
                                            value={pickupTimeValue}
                                            onChange={(e) => onPickupTimeChange(e.target.value)}
                                            className="w-full p-0 text-xs bg-transparent border-none focus:ring-0 dark:text-white font-serif italic"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 md:space-y-3">
                                    <label htmlFor="customerName-input" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Order Name</label>
                                    <input id="customerName-input" type="text" value={customerName} onChange={e => onCustomerNameChange(e.target.value)} placeholder="e.g., Sarah" className="w-full p-3 md:p-4 border rounded-xl md:rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all font-serif italic text-sm" disabled={isLoggedIn && !isAdmin}/>
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label htmlFor="tableNumber-input" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Table Number</label>
                                    <input id="tableNumber-input" type="text" value={tableNumber || ''} onChange={e => onTableNumberChange(e.target.value)} placeholder="None" className="w-full p-3 md:p-4 border rounded-xl md:rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all font-serif italic text-sm text-center font-bold"/>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input type="text" value={discountCode} onChange={e => onDiscountCodeChange(e.target.value)} placeholder="Promo Code" className="flex-grow p-3 md:p-4 border rounded-xl md:rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all font-serif italic text-sm"/>
                                <button onClick={onApplyDiscount} className="px-4 md:px-8 py-3 md:py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl md:rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-lg">Apply</button>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Payment</label>
                                <div className="relative">
                                    <select value={paymentMethod} onChange={e => onPaymentMethodChange(e.target.value as PaymentMethod)} className="w-full p-3 md:p-4 border rounded-xl md:rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all appearance-none font-serif italic text-sm">
                                        {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                             {paymentMethod === PaymentMethod.CARD && (
                                <div className="space-y-4 pt-2">
                                    {(stripeLoaded === false) ? (
                                        <div className="p-5 bg-stone-50 dark:bg-zinc-900/50 border border-stone-200 dark:border-zinc-800 rounded-3xl space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                                                    <HelpCircle className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-serif font-bold text-stone-900 dark:text-white">Stripe Not Configured</p>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                        Card payments require a <code className="px-1.5 py-0.5 bg-stone-200 dark:bg-zinc-800 rounded font-mono text-[10px]">VITE_STRIPE_PUBLISHABLE_KEY</code>.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2">
                                                <button 
                                                    onClick={handleSimulatePayment}
                                                    disabled={isStripeConfirming}
                                                    className="w-full flex items-center justify-between p-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl group transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Terminal className="w-4 h-4 opacity-50 transition-opacity group-hover:opacity-100" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Run Simulation</span>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
                                                </button>
                                                <p className="mt-3 text-[9px] text-center text-stone-400 dark:text-zinc-600 italic font-serif">
                                                    Testing? Use the button above to bypass payment processing.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (isStripeLoading || stripeLoaded === null) ? (
                                        <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
                                            <p className="text-[10px] uppercase tracking-widest text-stone-400">Initializing Secure Payment...</p>
                                        </div>
                                    ) : clientSecret ? (
                                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                                            <Elements stripe={lazyStripePromise} options={stripeOptions}>
                                                <StripePaymentForm 
                                                    amount={finalTotal} 
                                                    onSuccess={handleStripeSuccess}
                                                    onError={handleStripeError}
                                                    isProcessing={isStripeConfirming}
                                                    setIsProcessing={setIsStripeConfirming} 
                                                />
                                            </Elements>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-800 dark:text-red-200">
                                            <p>Failed to initialize payment. Please try again or choose another method.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl md:rounded-2xl border border-red-100 dark:border-red-900/30">{error}</p>}

                        <button 
                            id="place-order-button" 
                            type={paymentMethod === PaymentMethod.CARD ? "submit" : "button"}
                            form={paymentMethod === PaymentMethod.CARD ? "payment-form" : undefined}
                            onClick={paymentMethod === PaymentMethod.CARD ? undefined : onPlaceOrder} 
                            disabled={isSubmitting || isStripeConfirming || (paymentMethod === PaymentMethod.CARD && !clientSecret)}
                            className={`w-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 py-4 md:py-6 rounded-full font-bold text-base md:text-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl transform active:scale-95 flex items-center justify-center ${isSubmitting || isStripeConfirming || (paymentMethod === PaymentMethod.CARD && !clientSecret) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting || isStripeConfirming ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 md:h-6 md:w-6 text-white dark:text-stone-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                paymentMethod === PaymentMethod.CARD ? `Pay $${finalTotal.toFixed(2)}` : (pickupOption === 'later' ? 'Schedule Order' : 'Complete Order')
                            )}
                        </button>
                    </footer>
                )}
            </div>
        </div>
    </div>
    </>
    );
};

export default memo(CartFlyout);
