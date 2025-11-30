
import React, { useState, useEffect, memo } from 'react';
import { Order, ModifierOption } from '../../types';

interface OrderTicketProps {
  order: Order;
  onComplete: (id: string) => void;
  onToggleItem: (orderId: string, itemId: string) => void;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onComplete, onToggleItem }) => {
  const [timeElapsed, setTimeElapsed] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const seconds = Math.floor((Date.now() - order.createdAt) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setTimeElapsed(`${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);
  
  const getMinutesWaiting = () => Math.floor((Date.now() - order.createdAt) / 60000);
  
  const allItemsCompleted = order.items.every(item => item.isCompleted);

  const timeColourClass = () => {
      const minutes = getMinutesWaiting();
      if (minutes >= 10) return 'bg-red-500 text-white';
      if (minutes >= 7) return 'bg-orange-500 text-white';
      if (minutes >= 5) return 'bg-yellow-400 text-black dark:bg-yellow-500 dark:text-black';
      return 'bg-green-500 text-white';
  }

  const ticketBorderClass = () => {
      const minutes = getMinutesWaiting();
      if (minutes >= 10) return 'border-red-500 animate-pulse-red';
      if (minutes >= 7) return 'border-orange-500 animate-pulse-orange';
      if (minutes >= 5) return 'border-stone-500 dark:border-neutral-400';
      return 'border-transparent';
  }

  return (
    <div 
        className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md flex flex-col h-full border-4 ${ticketBorderClass()}`}
        role="article"
        aria-labelledby={`order-heading-${order.id}`}
    >
      <header 
          className={`p-3 bg-stone-100 dark:bg-zinc-700 rounded-t-lg ${allItemsCompleted ? 'cursor-pointer' : ''}`}
          onClick={() => allItemsCompleted && onComplete(order.id)}
          title={allItemsCompleted ? "Click to complete entire order" : "Complete all items to enable"}
      >
        <div className="flex justify-between items-start">
            <div id={`order-heading-${order.id}`}>
              <h3 className="font-bold text-xl text-stone-900 dark:text-white truncate">{order.customerName}</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">ID: #{order.id.slice(-6)}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${timeColourClass()}`}>
              {timeElapsed}
            </span>
        </div>
        {order.pickupTime && (
            <div className="mt-2 text-center bg-zinc-200 dark:bg-zinc-600 p-1 rounded-md">
                <p className="text-xs font-bold text-stone-800 dark:text-white">
                    Pickup at: {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        )}
      </header>
      <div className="p-4 space-y-3 flex-grow overflow-y-auto">
        {order.items.map(item => {
            const isComplete = !!item.isCompleted;
            return (
              <div 
                key={item.id} 
                className={`text-sm p-1 -m-1 rounded-md transition-all duration-200 cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-700/50 ${isComplete ? 'line-through text-stone-400 dark:text-zinc-500 opacity-70' : ''}`}
                onClick={() => onToggleItem(order.id, item.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isComplete}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleItem(order.id, item.id)}
                aria-label={`${isComplete ? 'Mark as incomplete' : 'Mark as complete'}: ${item.quantity}x ${item.drink.name}`}
              >
                <p className={`font-semibold text-base ${isComplete ? '' : 'text-stone-800 dark:text-zinc-200'}`}>{item.quantity}x {item.drink.name}</p>
                {item.customName && <p className={`pl-4 font-medium ${isComplete ? '' : 'text-stone-700 dark:text-zinc-300'}`}>- {item.customName}</p>}
                <ul className={`pl-4 list-disc list-inside ${isComplete ? '' : 'text-stone-600 dark:text-zinc-400'}`}>
                  {Object.values(item.selectedModifiers).map((mod: ModifierOption) => (
                    <li key={mod.id}>{mod.name}</li>
                  ))}
                </ul>
              </div>
            )
        })}
      </div>
      <footer className="p-3 border-t dark:border-zinc-700">
        <button
          onClick={() => onComplete(order.id)}
          disabled={!allItemsCompleted}
          className="w-full py-2 rounded-md font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-stone-400 disabled:dark:bg-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-stone-400"
          aria-label={!allItemsCompleted ? `Cannot complete order for ${order.customerName} yet` : `Complete order for ${order.customerName}`}
        >
          {allItemsCompleted ? 'Complete Order' : 'Waiting for items...'}
        </button>
      </footer>
    </div>
  );
};

export default memo(OrderTicket);
