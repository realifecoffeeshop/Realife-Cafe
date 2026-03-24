
import React, { memo } from 'react';
import { CartItem, PaymentMethod, Discount, ModifierOption, SelectedModifier } from '../../types';

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
    isLoggedIn: boolean;
    pickupOption: 'now' | 'later';
    onPickupOptionChange: (option: 'now' | 'later') => void;
    pickupDate: string;
    onPickupDateChange: (date: string) => void;
    pickupTimeValue: string;
    onPickupTimeChange: (time: string) => void;
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
    isLoggedIn,
    pickupOption,
    onPickupOptionChange,
    pickupDate,
    onPickupDateChange,
    pickupTimeValue,
    onPickupTimeChange,
}) => {
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
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-heading"
            >
                <header className="flex items-center justify-between p-4 border-b dark:border-zinc-700">
                    <div className="flex items-center space-x-2">
                        <h2 id="cart-heading" className="text-3xl font-serif font-bold text-stone-900 dark:text-white">Your Order</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white rounded-full p-2 transition-all"
                        aria-label="Close cart"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-6 scrollbar-hide">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-20 h-20 bg-stone-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <p className="text-stone-500 dark:text-zinc-400 font-serif italic text-lg">"Your cart is waiting for something delicious."</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex flex-col p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 group transition-all hover:shadow-2xl hover:-translate-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow pr-4">
                                            <p className="font-serif font-bold text-2xl text-stone-900 dark:text-white leading-tight">
                                                {item.quantity}x {item.drink?.name || 'Unknown Drink'}
                                                {item.selectedVariantId && item.drink?.variants && (
                                                    <span className="text-sm font-bold text-stone-400 dark:text-zinc-500 ml-2 italic">
                                                        ({item.drink.variants.find(v => v.id === item.selectedVariantId)?.name})
                                                    </span>
                                                )}
                                            </p>
                                            {item.customName && <p className="text-sm font-bold text-stone-400 dark:text-zinc-500 italic mt-2 tracking-wide">"{item.customName}"</p>}
                                            <div className="text-xs text-stone-400 dark:text-zinc-500 mt-3 leading-relaxed font-medium uppercase tracking-widest">
                                                {Object.values(item.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => 
                                                    sm.quantity > 1 ? `${sm.quantity}x ${sm.option?.name || 'Unknown'}` : (sm.option?.name || 'Unknown')
                                                ).join(' • ')}
                                            </div>
                                        </div>
                                        <span className="font-serif font-bold text-2xl text-stone-900 dark:text-white tracking-tighter">${item.finalPrice.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex justify-end items-center space-x-8 mt-6 pt-5 border-t border-stone-50 dark:border-zinc-800/50">
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
                    <footer className="p-10 border-t border-stone-100 dark:border-zinc-800 space-y-8 overflow-y-auto cart-flyout-footer bg-stone-50/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                        <div className="space-y-4">
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

                            <div className="flex justify-between text-4xl font-serif font-bold text-stone-900 dark:text-white pt-4 border-t border-stone-100 dark:border-zinc-800">
                                <span>Total</span>
                                <span className="tracking-tighter">${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-8 pt-8 border-t border-stone-100 dark:border-zinc-800">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Pickup Preference</label>
                                <div className="flex p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                                    <button
                                        onClick={() => onPickupOptionChange('now')}
                                        className={`px-6 py-3 text-xs font-bold flex-1 rounded-xl transition-all duration-500 ${pickupOption === 'now' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        Now
                                    </button>
                                    <button
                                        onClick={() => onPickupOptionChange('later')}
                                        className={`px-6 py-3 text-xs font-bold flex-1 rounded-xl transition-all duration-500 ${pickupOption === 'later' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </div>
                            
                            {pickupOption === 'later' && (
                                <div className="grid grid-cols-2 gap-4 p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 shadow-inner">
                                    <div className="space-y-1">
                                        <label htmlFor="pickup-date" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">Date</label>
                                        <input
                                            id="pickup-date"
                                            type="date"
                                            value={pickupDate}
                                            onChange={(e) => onPickupDateChange(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full p-0 text-sm bg-transparent border-none focus:ring-0 dark:text-white font-serif italic"
                                        />
                                    </div>
                                    <div className="border-l border-stone-50 dark:border-zinc-800 pl-4 space-y-1">
                                        <label htmlFor="pickup-time" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">Time</label>
                                        <input
                                            id="pickup-time"
                                            type="time"
                                            value={pickupTimeValue}
                                            onChange={(e) => onPickupTimeChange(e.target.value)}
                                            className="w-full p-0 text-sm bg-transparent border-none focus:ring-0 dark:text-white font-serif italic"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label htmlFor="customerName-input" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Group Order Name</label>
                                <input id="customerName-input" type="text" value={customerName} onChange={e => onCustomerNameChange(e.target.value)} placeholder="e.g., Office Morning Run" className="w-full p-4 border rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all font-serif italic" disabled={isLoggedIn}/>
                            </div>

                            <div className="flex gap-3">
                                <input type="text" value={discountCode} onChange={e => onDiscountCodeChange(e.target.value)} placeholder="Promo Code" className="flex-grow p-4 border rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all font-serif italic"/>
                                <button onClick={onApplyDiscount} className="px-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-lg">Apply</button>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 ml-1">Payment</label>
                                <div className="relative">
                                    <select value={paymentMethod} onChange={e => onPaymentMethodChange(e.target.value as PaymentMethod)} className="w-full p-4 border rounded-2xl bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all appearance-none font-serif italic">
                                        {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">{error}</p>}

                        <button 
                            id="place-order-button" 
                            onClick={onPlaceOrder} 
                            disabled={isSubmitting}
                            className={`w-full mt-6 bg-stone-900 text-white dark:bg-white dark:text-stone-900 py-6 rounded-full font-bold text-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-2xl transform active:scale-95 flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white dark:text-stone-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                pickupOption === 'later' ? 'Schedule Order' : 'Complete Order'
                            )}
                        </button>
                    </footer>
                )}
            </div>
        </>
    );
};

export default memo(CartFlyout);
