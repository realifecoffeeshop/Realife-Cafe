
import React, { useState, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { Order, ModifierOption, SelectedModifier } from '../../types';

interface OrderTicketProps {
  order: Order;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleItem: (orderId: string, itemId: string) => void;
  onUpdateName?: (id: string, newName: string) => void;
  isAdmin?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onUnmerge?: (id: string) => void;
}

const Timer = memo(({ createdAt, timeColourClass }: { createdAt: number; timeColourClass: (minutes: number) => string }) => {
  const [timeElapsed, setTimeElapsed] = useState('');
  const [minutesWaiting, setMinutesWaiting] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const start = createdAt || Date.now();
      const seconds = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      setMinutesWaiting(mins);
      setTimeElapsed(`${mins.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors duration-500 ${timeColourClass(minutesWaiting)}`}>
      {timeElapsed}
    </span>
  );
});

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onComplete, onDelete, onToggleItem, onUpdateName, isAdmin, isSelected, onSelect, onUnmerge }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(order.customerName || '');

  useEffect(() => {
    setEditedName(order.customerName || '');
  }, [order.customerName]);

  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editedName.trim() && editedName !== order.customerName) {
      onUpdateName?.(order.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const getMinutesWaiting = () => {
      const createdAt = order.createdAt || Date.now();
      return Math.floor((Date.now() - createdAt) / 60000);
  };
  
  const allItemsCompleted = order.items.every(item => item.isCompleted);

  const timeColourClass = (minutes: number) => {
      if (minutes >= 10) return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
      if (minutes >= 7) return 'bg-orange-500 text-white shadow-lg shadow-orange-500/20';
      if (minutes >= 5) return 'bg-yellow-400 text-black dark:bg-yellow-500 dark:text-black shadow-lg shadow-yellow-500/20';
      return 'bg-green-500 text-white shadow-lg shadow-green-500/20';
  }

  const ticketBorderClass = () => {
      const minutes = getMinutesWaiting();
      if (minutes >= 10) return 'border-red-500 animate-pulse-red';
      if (minutes >= 7) return 'border-orange-500 animate-pulse-orange';
      if (minutes >= 5) return 'border-stone-500 dark:border-neutral-400';
      return 'border-transparent';
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'payment-required': return 'Unpaid';
      case 'pending': return 'Pending';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div 
        className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md flex flex-col border-4 transition-all hover:shadow-lg cursor-pointer group relative ${ticketBorderClass()} ${isSelected ? 'scale-[1.02] shadow-xl z-20 !border-blue-600 ring-4 ring-blue-500/20' : ''}`}
        role="article"
        aria-labelledby={`order-heading-${order.id}`}
        onClick={() => onSelect ? onSelect(order.id) : onComplete(order.id)}
    >
      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-400/5 rounded-lg pointer-events-none z-[5]" />
      )}

      {/* Selection Indicator (Visible when onSelect is provided) */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-30">
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform ${isSelected ? 'bg-blue-600 border-blue-600 scale-110 shadow-lg' : 'bg-white/80 border-stone-300 dark:bg-zinc-800/80 dark:border-zinc-500'}`}>
            {isSelected ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-500" />
            )}
          </div>
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(order.id);
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-[30] hover:bg-red-600 active:scale-95"
        title="Delete Order"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <header 
          className={`p-2 bg-stone-100 dark:bg-zinc-700 rounded-t-lg sticky top-0 z-20 shadow-sm`}
      >
        <div className="flex justify-between items-start">
            <div id={`order-heading-${order.id}`} className={`flex-grow min-w-0 ${onSelect ? 'pl-10' : ''}`}>
              {isEditingName && isAdmin ? (
                <form onSubmit={handleNameSubmit} className="flex items-center gap-2 pr-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={() => handleNameSubmit()}
                    autoFocus
                    className="w-full px-2 py-1 text-lg font-bold border rounded bg-white dark:bg-zinc-800 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </form>
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <h3 
                    className={`font-bold text-xl text-stone-900 dark:text-white truncate ${isAdmin ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                    onClick={(e) => {
                      if (isAdmin) {
                        e.stopPropagation();
                        setIsEditingName(true);
                      }
                    }}
                  >
                    {order.customerName || 'Unknown'}
                  </h3>
                  {order.tableNumber && (
                    <div className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-lg px-3 py-1 text-sm font-bold tracking-wider uppercase shadow-sm">
                      T{order.tableNumber}
                    </div>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingName(true);
                      }}
                      className="opacity-0 group-hover/name:opacity-100 p-1 text-stone-400 hover:text-blue-600 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <div className={`flex items-center space-x-2 mt-1 ${onSelect ? 'pl-10' : ''}`}>
                <p className="text-xs text-stone-500 dark:text-zinc-400">ID: #{(order.id || '').slice(-6)}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-zinc-600 text-stone-600 dark:text-zinc-300 font-bold uppercase tracking-wider">
                  {getStatusLabel(order.status || '')}
                </span>
                {order.mergeId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                    </svg>
                    Grouped
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Timer createdAt={order.createdAt} timeColourClass={timeColourClass} />
              {order.mergeId && onUnmerge && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmerge(order.id);
                  }}
                  className="mt-1 text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold uppercase"
                >
                  Ungroup
                </button>
              )}
            </div>
        </div>
        {order.pickupTime && !isNaN(new Date(order.pickupTime).getTime()) && (
            <div className="mt-2 text-center bg-zinc-200 dark:bg-zinc-600 p-1 rounded-md">
                <p className="text-xs font-bold text-stone-800 dark:text-white">
                    Pickup at: {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        )}
      </header>
      <div className={`p-2.5 space-y-2 flex-grow overflow-y-auto ${onSelect ? 'pl-12' : ''}`}>
        {order.items.map(item => {
            const isComplete = !!item.isCompleted;
            return (
              <motion.div 
                key={item.id} 
                layout
                initial={false}
                animate={{ 
                  opacity: isComplete ? 0.6 : 1,
                  scale: isComplete ? 0.98 : 1,
                  x: isComplete ? 4 : 0
                }}
                className={`text-xs p-1 -m-1 rounded-md transition-colors duration-200 cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-700/50 ${isComplete ? 'line-through text-stone-400 dark:text-zinc-500' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleItem(order.id, item.id);
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isComplete}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onToggleItem(order.id, item.id);
                  }
                }}
                aria-label={`${isComplete ? 'Mark as incomplete' : 'Mark as complete'}: ${item.quantity}x ${item.drink?.name || 'Unknown Drink'}`}
              >
                <p className={`font-semibold text-base ${isComplete ? '' : 'text-stone-800 dark:text-zinc-200'}`}>
                  <span>{item.quantity}x </span>
                  {item.selectedVariantId && item.drink?.variants && (
                    <span className="uppercase mr-1">
                      {item.drink.variants.find(v => v.id === item.selectedVariantId)?.name}
                    </span>
                  )}
                  <span>{item.drink?.name || 'Unknown Drink'}</span>
                </p>
                {item.customName && <p className={`pl-4 font-bold italic text-sm ${isComplete ? '' : 'text-stone-700 dark:text-zinc-300'}`}>- {item.customName}</p>}
                <ul className={`pl-4 list-disc list-inside ${isComplete ? '' : 'text-stone-600 dark:text-zinc-400'}`}>
                  {Object.values(item.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => (
                    <li key={sm.option?.id || Math.random()} className="text-xs leading-tight font-medium">{sm.quantity > 1 ? `${sm.quantity}x ` : ''}{sm.option?.name || 'Unknown'}</li>
                  ))}
                </ul>
              </motion.div>
            )
        })}
      </div>
      <footer className={`p-2 border-t dark:border-zinc-700 ${onSelect ? 'pl-12' : ''}`}>
        <div className="text-center text-[9px] text-stone-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-bold">
          Click ticket to complete
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(order.id);
          }}
          className={`w-full py-1.5 rounded-md font-bold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 flex items-center justify-center leading-none ${allItemsCompleted ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' : 'bg-stone-200 dark:bg-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-600'}`}
          aria-label={!allItemsCompleted ? `Cannot complete order for ${order.customerName || 'Unknown'} yet` : `Complete order for ${order.customerName || 'Unknown'}`}
        >
          {allItemsCompleted ? 'Complete Order' : 'Force Complete'}
        </button>
      </footer>
    </div>
  );
};

export default memo(OrderTicket);
