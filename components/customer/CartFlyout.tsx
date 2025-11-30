
import React, { useContext } from 'react';
import { CartItem, PaymentMethod, Discount, ModifierOption } from '../../types';
import { AppContext } from '../../context/AppContext';

interface CartFlyoutProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    subtotal: number;
    finalTotal: number;
    appliedDiscount: Discount | null;
    hasLoyaltyReward: boolean;
    customerName: string;
    onCustomerNameChange: (name: string) => void;
    discountCode: string;
    onDiscountCodeChange: (code: string) => void;
    onApplyDiscount: () => void;
    paymentMethod: PaymentMethod;
    onPaymentMethodChange: (method: PaymentMethod) => void;
    error: string;
    onPlaceOrder: () => void;
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
    hasLoyaltyReward,
    customerName,
    onCustomerNameChange,
    discountCode,
    onDiscountCodeChange,
    onApplyDiscount,
    paymentMethod,
    onPaymentMethodChange,
    error,
    onPlaceOrder,
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
    const { dispatch } = useContext(AppContext);

    const handleHelpClick = () => {
        dispatch({ type: 'OPEN_KB_MODAL', payload: { articleId: 'kb-2' } });
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
                        <button
                          onClick={handleHelpClick}
                          className="p-1.5 rounded-full text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-600 hover:text-stone-700 dark:hover:text-white transition-colors"
                          aria-label="Get help for this section"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <h2 id="cart-heading" className="text-2xl font-bold text-stone-800 dark:text-white">Your Order</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-600 hover:text-stone-900 dark:hover:text-white rounded-lg text-sm p-1.5"
                        aria-label="Close cart"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <p className="text-stone-500 dark:text-zinc-400">Your cart is empty.</p>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex flex-col p-4 rounded-lg bg-stone-50 dark:bg-zinc-700/50 shadow-sm border border-stone-100 dark:border-zinc-700">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow pr-4">
                                            <p className="font-bold text-lg text-stone-800 dark:text-white">
                                                {item.quantity}x {item.drink.name}
                                            </p>
                                            {item.customName && <p className="text-sm font-medium text-stone-600 dark:text-zinc-300 italic">"{item.customName}"</p>}
                                            <div className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                                {Object.values(item.selectedModifiers).map((m: ModifierOption) => m.name).join(', ')}
                                            </div>
                                        </div>
                                        <span className="font-bold text-lg text-stone-800 dark:text-white">${item.finalPrice.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex justify-end items-center space-x-4 mt-4 pt-3 border-t border-stone-200 dark:border-zinc-600">
                                        <button 
                                            onClick={() => onEditItem(item)}
                                            className="flex items-center text-sm font-semibold text-stone-600 dark:text-zinc-300 hover:text-[#A58D79] dark:hover:text-white transition-colors"
                                            aria-label={`Edit ${item.drink.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </button>
                                        <div className="h-4 w-px bg-stone-300 dark:bg-zinc-500"></div>
                                        <button 
                                            onClick={() => onRemoveItem(item.id)}
                                            className="flex items-center text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                                            aria-label={`Remove ${item.drink.name}`}
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <footer className="p-6 border-t dark:border-zinc-700 space-y-4 overflow-y-auto cart-flyout-footer bg-stone-50 dark:bg-zinc-800">
                        <div className="flex justify-between font-semibold text-stone-800 dark:text-white">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>

                        {hasLoyaltyReward && (
                            <div className="flex justify-between text-green-700 dark:text-green-500 font-semibold">
                                <span>Loyalty Reward (1 Free Drink)</span>
                                <span>- ${(subtotal - finalTotal).toFixed(2)}</span>
                            </div>
                        )}

                        {appliedDiscount && (
                            <div className="flex justify-between text-green-700 dark:text-green-500 font-semibold">
                                <span>Discount ({appliedDiscount.code})</span>
                                <span>- ${ (subtotal - (appliedDiscount.type === 'percentage' ? subtotal * (1 - appliedDiscount.value/100) : subtotal - appliedDiscount.value) ).toFixed(2) }</span>
                            </div>
                        )}

                        <div className="flex justify-between text-xl font-bold text-stone-900 dark:text-white">
                            <span>Total</span>
                            <span>${finalTotal.toFixed(2)}</span>
                        </div>

                        <div className="space-y-4 pt-4 border-t dark:border-zinc-600">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">Pickup Time</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button
                                        onClick={() => onPickupOptionChange('now')}
                                        className={`px-4 py-2 text-sm font-medium flex-1 rounded-l-md border border-stone-300 dark:border-zinc-600 ${pickupOption === 'now' ? 'bg-[#A58D79] dark:bg-zinc-100 text-white dark:text-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                                    >
                                        Pickup Now
                                    </button>
                                    <button
                                        onClick={() => onPickupOptionChange('later')}
                                        className={`px-4 py-2 text-sm font-medium flex-1 rounded-r-md border-y border-r border-stone-300 dark:border-zinc-600 ${pickupOption === 'later' ? 'bg-[#A58D79] dark:bg-zinc-100 text-white dark:text-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                                    >
                                        Schedule for Later
                                    </button>
                                </div>
                            </div>
                            
                            {pickupOption === 'later' && (
                                <div className="grid grid-cols-2 gap-2 p-3 bg-stone-100 dark:bg-zinc-700/50 rounded-md">
                                    <div>
                                        <label htmlFor="pickup-date" className="sr-only">Date</label>
                                        <input
                                            id="pickup-date"
                                            type="date"
                                            value={pickupDate}
                                            onChange={(e) => onPickupDateChange(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="pickup-time" className="sr-only">Time</label>
                                        <input
                                            id="pickup-time"
                                            type="time"
                                            value={pickupTimeValue}
                                            onChange={(e) => onPickupTimeChange(e.target.value)}
                                            className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="customerName-input" className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Group Order Name (Required)</label>
                                <input id="customerName-input" type="text" value={customerName} onChange={e => onCustomerNameChange(e.target.value)} placeholder="e.g., Office Morning Run" className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" disabled={isLoggedIn}/>
                                {hasLoyaltyReward && <p className="text-sm text-green-700 dark:text-green-500">Loyalty Reward Applied! Your next drink is on us.</p>}
                            </div>

                            <div className="flex space-x-2">
                                <input type="text" value={discountCode} onChange={e => onDiscountCodeChange(e.target.value)} placeholder="Discount Code" className="flex-grow p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
                                <button onClick={onApplyDiscount} className="px-4 py-2 bg-stone-200 dark:bg-zinc-600 rounded-md hover:bg-stone-300 dark:hover:bg-zinc-500 text-sm font-medium">Apply</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Payment Method</label>
                                <select value={paymentMethod} onChange={e => onPaymentMethodChange(e.target.value as PaymentMethod)} className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white">
                                    {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
                                </select>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button id="place-order-button" onClick={onPlaceOrder} className="w-full mt-4 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-3 rounded-lg font-bold hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors text-lg">
                            {pickupOption === 'later' ? 'Schedule Order' : 'Place Order'}
                        </button>
                    </footer>
                )}
            </div>
        </>
    );
};

export default CartFlyout;
