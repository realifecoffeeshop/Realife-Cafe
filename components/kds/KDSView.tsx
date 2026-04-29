
import React, { useContext, useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { Drink, ModifierOption, Order, SelectedModifier, Customer, UserRole } from '../../types';
import { Loader2, Download } from 'lucide-react';
import { 
    updateOrder, 
    deleteOrder, 
    saveCustomer,
    mergeOrders as firestoreMergeOrders,
    unmergeOrder as firestoreUnmergeOrder,
    unmergeGroup as firestoreUnmergeGroup
} from '../../firebase/firestoreService';
import OrderTicket from './OrderTicket';
import ConfirmationModal from '../shared/ConfirmationModal';
import Modal from '../shared/Modal';
import GroupedItemCard, { AggregatedItem } from './GroupedItemCard';
import GroupedByTypeCard, { AggregatedByType } from './GroupedByTypeCard';

const PREPARATION_LEAD_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

const filterOrders = (orders: Order[], query: string): Order[] => {
    if (!query.trim()) return orders;
    const lowerCaseQuery = query.toLowerCase();
    return orders.filter(order => {
        const matchesCustomer = (order.customerName || '').toLowerCase().includes(lowerCaseQuery);
        const matchesId = (order.id || '').toLowerCase().includes(lowerCaseQuery);
        const matchesDrink = (order.items || []).some(item => 
            (item.drink?.name || '').toLowerCase().includes(lowerCaseQuery)
        );
        return matchesCustomer || matchesId || matchesDrink;
    });
};


const PaymentTicket = memo(({ order, onVerify, onDelete, onUpdateName, isAdmin }: { order: Order; onVerify: (id: string) => void; onDelete: (id: string) => void; onUpdateName?: (id: string, newName: string) => void; isAdmin?: boolean; }) => {
  const [timeElapsed, setTimeElapsed] = useState('');
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

  useEffect(() => {
    const updateTimer = () => {
      const createdAt = order.createdAt || Date.now();
      const seconds = Math.floor((Date.now() - createdAt) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setTimeElapsed(`${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);
  
  const getMinutesWaiting = () => {
      const createdAt = order.createdAt || Date.now();
      return Math.floor((Date.now() - createdAt) / 60000);
  };

  const ticketBorderClass = () => {
      const minutes = getMinutesWaiting();
      if (minutes >= 5) return 'border-orange-500 animate-pulse-orange';
      return 'border-blue-500';
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md flex flex-col border-4 group relative ${ticketBorderClass()}`}
        role="article"
        aria-labelledby={`order-heading-${order.id}`}
    >
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

      <header className="p-2 bg-stone-100 dark:bg-zinc-700 rounded-t-lg sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-start">
            <div id={`order-heading-${order.id}`} className="flex-grow min-w-0">
              {isEditingName && isAdmin ? (
                <form onSubmit={handleNameSubmit} className="flex items-center gap-2 pr-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={() => handleNameSubmit()}
                    autoFocus
                    className="w-full px-2 py-1 text-base font-bold border rounded bg-white dark:bg-zinc-800 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </form>
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <h3 
                    className={`font-bold text-lg text-stone-900 dark:text-white truncate ${isAdmin ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                    onClick={(e) => {
                      if (isAdmin) {
                        e.stopPropagation();
                        setIsEditingName(true);
                      }
                    }}
                  >
                    {order.customerName || 'Unknown'}
                  </h3>
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
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-stone-500 dark:text-zinc-400">ID: #{(order.id || '').slice(-6)}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold uppercase tracking-wider">
                  Unpaid
                </span>
              </div>
            </div>
            <span className="px-3 py-1 text-sm font-bold rounded-full bg-blue-500 text-white">
              {timeElapsed}
            </span>
        </div>
        <div className="mt-2 text-center bg-blue-100 dark:bg-blue-900/50 p-1 rounded-md">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                Total: ${(order.finalTotal || 0).toFixed(2)}
            </p>
        </div>
        {order.pickupTime && !isNaN(new Date(order.pickupTime).getTime()) && (
            <div className="mt-2 text-center bg-zinc-200 dark:bg-zinc-600 p-1 rounded-md">
                <p className="text-xs font-bold text-stone-800 dark:text-white">
                    Scheduled Pickup: {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        )}
      </header>
      <div className="p-2.5 flex-grow overflow-y-auto">
          <p className="text-[10px] text-stone-500 dark:text-zinc-400 mb-1 font-mono uppercase tracking-tighter">ID: #{(order.id || '').slice(-6)}</p>
          <div className="flex flex-col gap-2">
            {(order.items || []).map(item => (
              <div key={item.id} className="text-xs bg-stone-50/50 dark:bg-zinc-900/30 p-1.5 rounded border border-stone-200/50 dark:border-zinc-700/50">
                <p className="font-semibold text-stone-800 dark:text-zinc-200 leading-none mb-1">
                  <span className="text-blue-600 dark:text-blue-400">{item.quantity}x</span> {item.drink?.name || 'Unknown'}
                </p>
                {item.customName && <p className="text-[10px] text-stone-500 dark:text-zinc-400 italic">For: {item.customName}</p>}
              </div>
            ))}
          </div>
      </div>
      <footer className="p-2 border-t dark:border-zinc-700 bg-stone-50/30 dark:bg-zinc-900/10">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-tighter">
            Total: ${(order.finalTotal || 0).toFixed(2)}
          </div>
          <div className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold font-mono">
            {timeElapsed}
          </div>
        </div>
        <button
          onClick={() => onVerify(order.id)}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-bold text-xs uppercase tracking-widest shadow-sm active:scale-[0.98]"
        >
          Verify & Send
        </button>
      </footer>
    </motion.div>
  );
});
PaymentTicket.displayName = 'PaymentTicket';

const EditableNameCell = memo(({ order, onUpdateName, isAdmin }: { order: Order; onUpdateName: (id: string, newName: string) => void; isAdmin: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(order.customerName || '');

  useEffect(() => {
    setEditedName(order.customerName || '');
  }, [order.customerName]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editedName.trim() && editedName !== order.customerName) {
      onUpdateName(order.id, editedName.trim());
    }
    setIsEditing(false);
  };

  if (isEditing && isAdmin) {
    return (
      <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => handleSubmit()}
            autoFocus
            className="w-full px-2 py-1 text-sm font-bold border rounded bg-white dark:bg-zinc-800 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </td>
    );
  }

  return (
    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">
      <div className="flex items-center gap-2 group/name">
        <div className="flex flex-col">
          <div 
            className={`font-bold ${isAdmin ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
            onClick={() => isAdmin && setIsEditing(true)}
          >
            {order.customerName || 'Unknown'}
          </div>
          <div className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">#{(order.id || '').slice(-6).toUpperCase()}</div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover/name:opacity-100 p-1 text-stone-400 hover:text-blue-600 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>
    </td>
  );
});
EditableNameCell.displayName = 'EditableNameCell';

const TabButton = memo(({ tabId, count, children, panelId, activeTab, onTabChange }: {
  tabId: 'payment-required' | 'pending' | 'scheduled' | 'history';
  count: number;
  children: React.ReactNode;
  panelId: string;
  activeTab: string;
  onTabChange: (tab: any) => void;
}) => (
  <button
    role="tab"
    id={`tab-${tabId}`}
    aria-controls={panelId}
    aria-selected={activeTab === tabId}
    onClick={() => onTabChange(tabId)}
    className={`px-4 md:px-6 py-2 text-base md:text-lg font-semibold rounded-t-md transition-colors border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-900 flex-shrink-0 ${
      activeTab === tabId
        ? 'bg-white text-stone-700 border-stone-600 dark:bg-zinc-800 dark:text-white dark:border-white'
        : 'text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 border-transparent'
    }`}
  >
    {children} ({count})
  </button>
));
TabButton.displayName = 'TabButton';

const ViewModeToggle = memo(({ kdsViewMode, onModeChange }: {
  kdsViewMode: 'order' | 'item' | 'type';
  onModeChange: (mode: 'order' | 'item' | 'type') => void;
}) => (
  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
    <div className="flex-1">
      <h2 id="view-mode-label" className="sr-only">KDS View Mode</h2>
      <div role="radiogroup" aria-labelledby="view-mode-label" className="flex items-center bg-stone-200 dark:bg-zinc-700 rounded-lg p-1 max-w-sm">
        <button
          role="radio"
          aria-checked={kdsViewMode === 'order'}
          onClick={() => onModeChange('order')}
          className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-700 ${kdsViewMode === 'order' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
        >
          By Order
        </button>
        <button
          role="radio"
          aria-checked={kdsViewMode === 'item'}
          onClick={() => onModeChange('item')}
          className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-700 ${kdsViewMode === 'item' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
        >
          By Item
        </button>
        <button
          role="radio"
          aria-checked={kdsViewMode === 'type'}
          onClick={() => onModeChange('type')}
          className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-700 ${kdsViewMode === 'type' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
        >
          By Type
        </button>
      </div>
    </div>
  </div>
));
ViewModeToggle.displayName = 'ViewModeToggle';

const KDSView: React.FC = () => {
  const { state, dispatch, loadHistory } = useApp();
  const { addToast } = useToast();
  const [requeueCandidate, setRequeueCandidate] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [kdsViewMode, setKdsViewMode] = useState<'order' | 'item' | 'type'>('order');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [scrollDirection, setScrollDirection] = useState<'vertical' | 'horizontal'>('horizontal');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeTab, setActiveTab] = useState<'payment-required' | 'pending' | 'scheduled' | 'history'>('pending');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load history when tab is selected
  useEffect(() => {
    if (activeTab === 'history' && state.historicalOrders.length === 0) {
      setIsLoadingHistory(true);
      loadHistory(50).finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, state.historicalOrders.length, loadHistory]);

  const handleLoadMoreHistory = useCallback(async () => {
    if (state.historicalOrders.length === 0) return;
    const lastOrder = state.historicalOrders[state.historicalOrders.length - 1];
    if (lastOrder.completedAt) {
      setIsLoadingHistory(true);
      await loadHistory(50, lastOrder.completedAt);
      setIsLoadingHistory(false);
    }
  }, [state.historicalOrders, loadHistory]);

  const paymentRequiredOrdersUnfiltered = useMemo(() =>
    state.orders.filter(o => o.status === 'payment-required'),
    [state.orders]
  );
  
  // Set initial tab based on data
  useEffect(() => {
    if (paymentRequiredOrdersUnfiltered.length > 0 && activeTab === 'pending') {
      setActiveTab('payment-required');
    }
  }, [paymentRequiredOrdersUnfiltered.length]);

  const paymentRequiredOrders = useMemo(() =>
    filterOrders(paymentRequiredOrdersUnfiltered, debouncedSearchQuery)
        .sort((a,b) => a.createdAt - b.createdAt),
    [paymentRequiredOrdersUnfiltered, debouncedSearchQuery]
  );
  
  const pendingOrdersBase = useMemo(() => 
    state.orders.filter(order => order.status === 'pending'),
    [state.orders]
  );

  useEffect(() => {
    if (activeTab === 'payment-required' && paymentRequiredOrdersUnfiltered.length === 0 && pendingOrdersBase.length > 0) {
        setActiveTab('pending');
    }
  }, [paymentRequiredOrdersUnfiltered.length, pendingOrdersBase.length, activeTab]);

  const pendingOrders = useMemo(() => 
    filterOrders(pendingOrdersBase, debouncedSearchQuery)
      .sort((a, b) => a.createdAt - b.createdAt),
    [pendingOrdersBase, debouncedSearchQuery]
  );
  
  const scheduledOrders = useMemo(() => {
    const baseList = state.orders.filter(o => o.status === 'scheduled');
    return filterOrders(baseList, debouncedSearchQuery)
      .sort((a, b) => (a.pickupTime || 0) - (b.pickupTime || 0));
  },[state.orders, debouncedSearchQuery]);

  const completedOrders = useMemo(() => {
    return filterOrders(state.historicalOrders, debouncedSearchQuery);
  }, [state.historicalOrders, debouncedSearchQuery]);


  const aggregatedItems = useMemo((): AggregatedItem[] => {
    if (kdsViewMode !== 'item') return [];
    const itemsMap: Map<string, {
        drink: Drink;
        selectedModifiers: { [key: string]: SelectedModifier[] };
        selectedVariantId?: string;
        quantity: number;
        orders: Map<string, { name: string; quantity: number }>;
    }> = new Map();

    pendingOrdersBase.forEach(order => {
        order.items.forEach(item => {
            const modifierIds = Object.values(item.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => `${sm.option?.id || 'unknown'}:${sm.quantity}`).sort().join('_');
            const key = `${item.drink?.id || 'unknown'}_${item.selectedVariantId || 'no-variant'}_${modifierIds}`;

            if (!itemsMap.has(key)) {
                itemsMap.set(key, {
                    drink: item.drink,
                    selectedModifiers: item.selectedModifiers || {},
                    selectedVariantId: item.selectedVariantId,
                    quantity: 0,
                    orders: new Map(),
                });
            }
            const existingAggregatedItem = itemsMap.get(key)!;
            existingAggregatedItem.quantity += item.quantity;
            const customerName = order.customerName || 'Unknown';
            const orderInfo = existingAggregatedItem.orders.get(order.id) || { name: customerName, quantity: 0 };
            orderInfo.quantity += item.quantity;
            existingAggregatedItem.orders.set(order.id, orderInfo);
        });
    });

    let result: AggregatedItem[] = Array.from(itemsMap.values()).map(aggItem => ({
        ...aggItem,
        orders: Array.from(aggItem.orders.entries()).map(([id, info]) => ({ id, name: info.name || 'Unknown', quantity: info.quantity }))
    }));
    
    if (debouncedSearchQuery.trim()) {
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        result = result.filter(aggItem => {
            const matchesDrink = (aggItem.drink?.name || '').toLowerCase().includes(lowerCaseQuery);
            const matchesOrder = aggItem.orders.some(order => 
                (order.name || '').toLowerCase().includes(lowerCaseQuery) ||
                (order.id || '').toLowerCase().includes(lowerCaseQuery)
            );
            return matchesDrink || matchesOrder;
        });
    }

    return result.sort((a, b) => b.quantity - a.quantity);
  }, [pendingOrdersBase, debouncedSearchQuery, kdsViewMode]);

  const aggregatedByType = useMemo((): AggregatedByType[] => {
      if (kdsViewMode !== 'type') return [];
      const typeMap: Map<string, {
          drink: Drink;
          totalQuantity: number;
          variations: Map<string, {
              selectedModifiers: { [key: string]: SelectedModifier[] };
              selectedVariantId?: string;
              quantity: number;
          }>;
          sourceOrders: Map<string, { id: string, customerName: string, quantity: number }>;
      }> = new Map();

      pendingOrdersBase.forEach(order => {
          order.items.forEach(item => {
              const typeKey = item.drink?.id || 'unknown';
              if (!typeMap.has(typeKey)) {
                  typeMap.set(typeKey, { 
                    drink: item.drink || { 
                      id: 'unknown', 
                      name: 'Unknown Drink', 
                      basePrice: 0, 
                      baseCost: 0,
                      category: 'Uncategorized', 
                      description: '', 
                      imageUrl: '', 
                      modifierGroups: [] 
                    }, 
                    totalQuantity: 0, 
                    variations: new Map(), 
                    sourceOrders: new Map() 
                  });
              }
              const aggByType = typeMap.get(typeKey)!;
              aggByType.totalQuantity += item.quantity || 0;
              
              // Track source orders
              const sourceKey = order.id || 'unknown';
              const existingSource = aggByType.sourceOrders.get(sourceKey) || { id: order.id || 'unknown', customerName: order.customerName || 'Unknown', quantity: 0 };
              existingSource.quantity += item.quantity || 0;
              aggByType.sourceOrders.set(sourceKey, existingSource);

              const variationKey = `${item.selectedVariantId || 'no-variant'}_${Object.values(item.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => `${sm.option?.id || 'unknown'}:${sm.quantity}`).sort().join('_')}`;
              const variation = aggByType.variations.get(variationKey) || { selectedModifiers: item.selectedModifiers || {}, selectedVariantId: item.selectedVariantId, quantity: 0 };
              variation.quantity += item.quantity || 0;
              aggByType.variations.set(variationKey, variation);
          });
      });

      let finalResult = Array.from(typeMap.values()).map(agg => ({
          ...agg,
          variations: Array.from(agg.variations.values()).sort((a,b) => b.quantity - a.quantity),
          sourceOrders: Array.from(agg.sourceOrders.values()).sort((a,b) => b.quantity - a.quantity)
      }));
      
      if (debouncedSearchQuery.trim()) {
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        finalResult = finalResult.filter(aggType => 
            (aggType.drink?.name || '').toLowerCase().includes(lowerCaseQuery)
        );
      }
      
      return finalResult.sort((a, b) => b.totalQuantity - a.totalQuantity);

  }, [pendingOrdersBase, debouncedSearchQuery, kdsViewMode]);


  const handleCompleteOrder = useCallback(async (id: string) => {
    try {
      await updateOrder(id, { status: 'completed', completedAt: Date.now() });
    } catch (err) {
      console.error("Failed to complete order:", err);
      addToast('Failed to complete order', 'error');
    }
  }, [addToast]);

  const handleToggleItemCompletion = useCallback(async (orderId: string, itemId: string) => {
    try {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;
        const items = order.items.map(item => 
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        await updateOrder(orderId, { items });
    } catch (err) {
        console.error("Failed to toggle item completion:", err);
        addToast('Failed to update item', 'error');
    }
  }, [state.orders, addToast]);
  
  const handleVerifyPayment = useCallback(async (id: string) => {
      try {
        await updateOrder(id, { isVerified: true, status: 'pending' });
      } catch (err) {
        console.error("Failed to verify payment:", err);
        addToast('Failed to verify payment', 'error');
      }
  }, [addToast]);

  const handleGroupOrders = useCallback(async () => {
    if (selectedOrders.length < 2) {
        addToast('Please select at least 2 orders to group', 'error');
        return;
    }
    setIsProcessing(true);
    try {
      const mergeId = `group-${Date.now()}`;
      await firestoreMergeOrders(selectedOrders, mergeId);
      dispatch({ type: 'MERGE_ORDERS', payload: { orderIds: selectedOrders, mergeId } });
      setSelectedOrders([]);
      setIsMergeMode(false);
      addToast('Orders grouped successfully', 'success');
    } catch (err) {
      console.error("Failed to group orders:", err);
      addToast('Failed to group orders', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedOrders, dispatch, addToast]);

  const handleMergeOrdersPermanent = useCallback(async () => {
    if (selectedOrders.length < 2) {
        addToast('Please select at least 2 orders to merge', 'error');
        return;
    }
    setIsProcessing(true);
    try {
      const targetOrderId = selectedOrders[0];
      const sourceOrderIds = selectedOrders.slice(1);
      
      const targetOrder = state.orders.find(o => o.id === targetOrderId);
      if (!targetOrder) throw new Error("Target order not found");
      
      let mergedItems = [...targetOrder.items];
      for (const sourceId of sourceOrderIds) {
          const sourceOrder = state.orders.find(o => o.id === sourceId);
          if (sourceOrder) {
              mergedItems = [...mergedItems, ...sourceOrder.items];
              await deleteOrder(sourceId);
          }
      }
      
      await updateOrder(targetOrderId, { items: mergedItems });
      
      dispatch({ type: 'MERGE_ORDERS_PERMANENT', payload: { orderIds: selectedOrders, targetOrderId } });
      setSelectedOrders([]);
      setIsMergeMode(false);
      addToast('Orders merged permanently', 'success');
    } catch (err) {
      console.error("Failed to merge orders:", err);
      addToast('Failed to merge orders', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedOrders, dispatch, addToast, state.orders]);

  const handleUngroupOrder = useCallback(async (id: string) => {
    setIsProcessing(true);
    try {
      if (id.startsWith('group-')) {
          await firestoreUnmergeGroup(id);
          dispatch({ type: 'UNMERGE_GROUP', payload: id });
          addToast('Group unmerged', 'success');
      } else {
          await firestoreUnmergeOrder(id);
          dispatch({ type: 'UNMERGE_ORDER', payload: id });
          addToast('Order ungrouped', 'success');
      }
    } catch (err) {
      console.error("Failed to ungroup:", err);
      addToast('Failed to ungroup', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, addToast]);

  const handleExportHistory = useCallback(() => {
    if (completedOrders.length === 0) {
      addToast('No history to export', 'error');
      return;
    }

    const headers = [
      'Order ID',
      'Customer Name',
      'Completed At',
      'Items',
      'Total Amount ($)',
      'Payment Method'
    ];

    const csvRows = completedOrders.map(order => {
      const items = order.items.map(item => {
        const variant = item.selectedVariantId && item.drink?.variants 
          ? item.drink.variants.find(v => v.id === item.selectedVariantId)?.name 
          : '';
        const modifiers = Object.values(item.selectedModifiers || {})
          .flatMap(mods => mods || [])
          .map(sm => `${sm.quantity > 1 ? sm.quantity + 'x ' : ''}${sm.option?.name || 'Unknown'}`)
          .join('; ');
        
        return `${item.quantity}x ${variant ? variant + ' ' : ''}${item.drink?.name || 'Unknown'}${modifiers ? ' (' + modifiers + ')' : ''}`;
      }).join(' | ');

      return [
        order.id,
        `"${(order.customerName || 'Unknown').replace(/"/g, '""')}"`,
        order.completedAt ? new Date(order.completedAt).toLocaleString() : 'N/A',
        `"${items.replace(/"/g, '""')}"`,
        (order.finalTotal || 0).toFixed(2),
        order.paymentMethod
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    link.setAttribute('download', `order_history_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('History exported to CSV', 'success');
  }, [completedOrders, addToast]);

  const handleAddToDirectory = useCallback((order: Order) => {
    if (!order.customerName || order.customerName.toLowerCase() === 'guest') {
        addToast("Cannot add guest orders to directory.", "error");
        return;
    }

    // Check if customer already exists
    const existingCustomer = state.customers.find(c => 
        (c.id === order.customerId) || 
        (c.name.toLowerCase() === order.customerName.toLowerCase())
    );

    if (existingCustomer) {
        // Add items to favorites if they don't exist
        const currentFavs = existingCustomer.favouriteDrinks || [];
        const newFavs = [...currentFavs];
        
        order.items.forEach(item => {
            // Simple check for duplicate: same drink and same modifiers
            const isDuplicate = currentFavs.some(f => 
                f.drink?.id === item.drink?.id && 
                JSON.stringify(f.selectedModifiers) === JSON.stringify(item.selectedModifiers)
            );
            
            if (!isDuplicate) {
                newFavs.push({ ...item, id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
            }
        });

        const updatedCustomer = { ...existingCustomer, favouriteDrinks: newFavs };
        saveCustomer(updatedCustomer)
            .then(() => {
                dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
                addToast(`Updated favourites for ${order.customerName}`, 'success');
            })
            .catch(err => {
                console.error("Failed to update customer:", err);
                addToast("Failed to update directory", "error");
            });
    } else {
        // Create new customer
        const newCustomer: Customer = {
            id: order.customerId || `cust-${Date.now()}`,
            name: order.customerName,
            favouriteDrinks: order.items.map(item => ({ ...item, id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })),
            notes: '',
            loyaltyPoints: 0
        };
        saveCustomer(newCustomer)
            .then(() => {
                dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
                addToast(`Added ${order.customerName} to directory with ${order.items.length} favourite(s)`, 'success');
            })
            .catch(err => {
                console.error("Failed to add customer:", err);
                addToast("Failed to update directory", "error");
            });
    }
  }, [state.customers, dispatch, addToast]);

  const toggleOrderSelection = useCallback((id: string) => {
    setSelectedOrders(prev => 
        prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  }, []);

  const confirmRequeue = async () => {
    if (requeueCandidate) {
        setIsProcessing(true);
        try {
          dispatch({ type: 'REQUEUE_ORDER', payload: requeueCandidate });
          setRequeueCandidate(null);
        } finally {
          setIsProcessing(false);
        }
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidate) {
        setIsProcessing(true);
        try {
          // Persist deletion to Firebase
          await deleteOrder(deleteCandidate);
          
          dispatch({ type: 'DELETE_ORDER', payload: deleteCandidate });
          setDeleteCandidate(null);
          addToast('Order deleted successfully', 'success');
        } catch (err) {
          console.error("Failed to delete order:", err);
          addToast('Failed to delete order from server', 'error');
        } finally {
          setIsProcessing(false);
        }
    }
  };

  const containerClasses = scrollDirection === 'vertical' 
    ? 'columns-sm space-y-4 gap-4 h-full' 
    : 'flex flex-row gap-4 overflow-x-auto pb-4 items-start scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-zinc-600';

  const ticketWrapperClasses = scrollDirection === 'horizontal' ? 'w-80 flex-shrink-0' : 'break-inside-avoid mb-4';

  const renderPendingContent = () => {
    switch(kdsViewMode) {
        case 'order':
            // Group orders by mergeId
            const mergedGroups: { [key: string]: Order[] } = {};
            const standaloneOrders: Order[] = [];

            pendingOrders.forEach(order => {
                if (order.mergeId) {
                    if (!mergedGroups[order.mergeId]) mergedGroups[order.mergeId] = [];
                    mergedGroups[order.mergeId].push(order);
                } else {
                    standaloneOrders.push(order);
                }
            });

            return (
                <div className="space-y-8">
                    {/* Group Mode Controls */}
                    <div className="sticky top-0 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md p-4 rounded-lg shadow-md border border-stone-200 dark:border-zinc-700 mb-6 gap-4">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => {
                                    setIsMergeMode(!isMergeMode);
                                    setSelectedOrders([]);
                                }}
                                className={`px-4 py-2 rounded-md font-bold transition-all ${isMergeMode ? 'bg-stone-200 text-stone-800 dark:bg-zinc-700 dark:text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                            >
                                {isMergeMode ? 'Cancel Grouping' : 'Group Tickets'}
                            </button>
                            {isMergeMode && (
                                <span className="text-sm font-medium text-stone-600 dark:text-zinc-400">
                                    {selectedOrders.length} orders selected
                                </span>
                            )}
                        </div>
                        {isMergeMode && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleGroupOrders}
                                    disabled={selectedOrders.length < 2}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Group Visual
                                </button>
                                <button 
                                    onClick={handleMergeOrdersPermanent}
                                    disabled={selectedOrders.length < 2}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Merge Permanent
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={containerClasses}>
                        <AnimatePresence mode="popLayout">
                            {/* Standalone Orders */}
                            {standaloneOrders.map((order, index) => (
                                <motion.div 
                                    key={order.id} 
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    transition={{ 
                                        duration: 0.3, 
                                        delay: index * 0.05,
                                        layout: { duration: 0.3, ease: "easeInOut" }
                                    }}
                                    className={ticketWrapperClasses}
                                >
                                    <OrderTicket 
                                        order={order} 
                                        onComplete={handleCompleteOrder} 
                                        onDelete={setDeleteCandidate} 
                                        onToggleItem={handleToggleItemCompletion}
                                        onUpdateName={(id, newName) => dispatch({ type: 'UPDATE_ORDER', payload: { id, updates: { customerName: newName } } })}
                                        isAdmin={state.currentUser?.role === UserRole.ADMIN}
                                        isSelected={selectedOrders.includes(order.id)}
                                        onSelect={isMergeMode ? toggleOrderSelection : undefined}
                                        onUnmerge={handleUngroupOrder}
                                    />
                                </motion.div>
                            ))}

                            {/* Grouped Orders (Rendered as Combined Tickets) */}
                            {Object.entries(mergedGroups).map(([mergeId, orders]) => {
                                // Create a virtual combined order for the ticket
                                const combinedOrder: Order = {
                                    id: mergeId,
                                    customerId: 'grouped',
                                    customerName: orders.map(o => o.customerName).join(' + '),
                                    items: orders.flatMap(o => o.items),
                                    status: orders[0].status,
                                    createdAt: Math.min(...orders.map(o => o.createdAt)),
                                    total: orders.reduce((sum, o) => sum + o.total, 0),
                                    totalCost: orders.reduce((sum, o) => sum + o.totalCost, 0),
                                    finalTotal: orders.reduce((sum, o) => sum + o.finalTotal, 0),
                                    discountApplied: null,
                                    paymentMethod: orders[0].paymentMethod,
                                    mergeId: mergeId,
                                };

                                return (
                                    <motion.div 
                                        key={mergeId} 
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`${ticketWrapperClasses} border-2 border-dashed border-purple-400 dark:border-purple-600 rounded-xl p-1 bg-purple-50/30 dark:bg-purple-900/10`}
                                    >
                                        <OrderTicket 
                                            order={combinedOrder} 
                                            onComplete={(id) => {
                                                // Complete all orders in the group
                                                orders.forEach(o => handleCompleteOrder(o.id));
                                            }} 
                                            onDelete={(id) => {
                                                // For grouped tickets, we might want to delete individually or as a group.
                                                // For now, let's just allow deleting the whole group if they click delete on the combined ticket.
                                                orders.forEach(o => setDeleteCandidate(o.id));
                                            }} 
                                            onToggleItem={(combinedId, itemId) => {
                                                // Find which original order this item belongs to
                                                const originalOrder = orders.find(o => o.items.some(i => i.id === itemId));
                                                if (originalOrder) {
                                                    handleToggleItemCompletion(originalOrder.id, itemId);
                                                }
                                            }}
                                            onUpdateName={(id, newName) => {
                                                // Update all orders in the group with the same name
                                                orders.forEach(o => dispatch({ type: 'UPDATE_ORDER', payload: { id: o.id, updates: { customerName: newName } } }));
                                            }}
                                            isAdmin={state.currentUser?.role === UserRole.ADMIN}
                                            onUnmerge={handleUngroupOrder}
                                        />
                                        <div className="px-3 py-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase text-center">
                                            Combined Group Ticket
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            );
        case 'item':
            return aggregatedItems.length > 0 ? (
                <div className={containerClasses}>
                    <AnimatePresence mode="popLayout">
                        {aggregatedItems.map(item => (
                            <div key={`${item.drink?.id || 'unknown'}-${Object.values(item.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => `${sm.option?.id || 'unknown'}:${sm.quantity}`).join('-')}`} className={ticketWrapperClasses}>
                                <GroupedItemCard item={item} />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : null;
        case 'type':
            return aggregatedByType.length > 0 ? (
                <div className={containerClasses}>
                    <AnimatePresence mode="popLayout">
                        {aggregatedByType.map(item => (
                            <div key={item.drink?.id || Math.random()} className={ticketWrapperClasses}>
                                <GroupedByTypeCard item={item} />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : null;
        default:
            return null;
    }
  }

  const renderEmptyState = (message: string) => (
      <div className="flex items-center justify-center h-[50vh]">
          <p className="text-2xl text-stone-500 dark:text-zinc-400">{searchQuery ? `No matching orders found for "${searchQuery}"` : message}</p>
      </div>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-[#F5F3EF] dark:bg-zinc-900 min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-white tracking-tight">Kitchen Display</h1>
        <div className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 shadow-sm">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                id="kds-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 sm:py-2.5 border border-stone-300 dark:border-zinc-700 rounded-xl leading-5 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 placeholder-stone-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 text-sm"
                placeholder="Search orders..."
            />
        </div>
      </div>
      
      {!state.isOrdersLoaded && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-12 w-12 text-stone-400 animate-spin" />
          <p className="text-stone-500 dark:text-zinc-400 font-medium animate-pulse">Fetching active orders...</p>
        </div>
      )}

      {state.isOrdersLoaded && (
        <>
          <div role="tablist" aria-label="Order views" className="flex space-x-1 sm:space-x-2 border-b border-stone-300 dark:border-zinc-700 mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
        <TabButton tabId="payment-required" count={paymentRequiredOrders.length} panelId="tabpanel-payment-required" activeTab={activeTab} onTabChange={setActiveTab}>Unpaid</TabButton>
        <TabButton tabId="pending" count={pendingOrders.length} panelId="tabpanel-pending" activeTab={activeTab} onTabChange={setActiveTab}>Pending</TabButton>
        <TabButton tabId="scheduled" count={scheduledOrders.length} panelId="tabpanel-scheduled" activeTab={activeTab} onTabChange={setActiveTab}>Scheduled</TabButton>
        <TabButton tabId="history" count={completedOrders.length} panelId="tabpanel-history" activeTab={activeTab} onTabChange={setActiveTab}>History</TabButton>
      </div>
      
      <div id="tabpanel-payment-required" role="tabpanel" aria-labelledby="tab-payment-required" hidden={activeTab !== 'payment-required'} className="overflow-hidden">
        <AnimatePresence mode="popLayout">
          {activeTab === 'payment-required' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {paymentRequiredOrders.length > 0 ? (
                  <div className={containerClasses}>
                      <AnimatePresence mode="popLayout">
                          {paymentRequiredOrders.map(order => (
                              <div key={order.id} className={ticketWrapperClasses}>
                                  <PaymentTicket 
                                    order={order} 
                                    onVerify={handleVerifyPayment} 
                                    onDelete={setDeleteCandidate} 
                                    onUpdateName={(id, newName) => dispatch({ type: 'UPDATE_ORDER', payload: { id, updates: { customerName: newName } } })}
                                    isAdmin={state.currentUser?.role === UserRole.ADMIN}
                                  />
                              </div>
                          ))}
                      </AnimatePresence>
                  </div>
              ) : renderEmptyState('No orders awaiting payment.')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div id="tabpanel-pending" role="tabpanel" aria-labelledby="tab-pending" hidden={activeTab !== 'pending'} className="overflow-hidden">
        <AnimatePresence mode="popLayout">
          {activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <ViewModeToggle kdsViewMode={kdsViewMode} onModeChange={setKdsViewMode} />
                  
                  <div className="flex items-center space-x-2 bg-stone-200 dark:bg-zinc-700 p-1 rounded-lg">
                      <button 
                          onClick={() => setScrollDirection('vertical')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scrollDirection === 'vertical' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
                      >
                          Vertical
                      </button>
                      <button 
                          onClick={() => setScrollDirection('horizontal')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scrollDirection === 'horizontal' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
                      >
                          Horizontal
                      </button>
                  </div>
              </div>
              {pendingOrdersBase.length > 0 ? renderPendingContent() : renderEmptyState('No pending orders. Great job!')}
              {pendingOrdersBase.length > 0 && pendingOrders.length === 0 && aggregatedItems.length === 0 && aggregatedByType.length === 0 && renderEmptyState('')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div id="tabpanel-scheduled" role="tabpanel" aria-labelledby="tab-scheduled" hidden={activeTab !== 'scheduled'} className="overflow-hidden">
        <AnimatePresence mode="popLayout">
          {activeTab === 'scheduled' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden">
            <div className="hidden sm:block overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm text-left text-stone-600 dark:text-zinc-400 min-w-[700px]">
                <thead className="text-sm text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Customer</th>
                        <th scope="col" className="px-6 py-3">Pickup Time</th>
                        <th scope="col" className="px-6 py-3">Items</th>
                        <th scope="col" className="px-6 py-3">Total</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {scheduledOrders.map(order => (
                        <tr key={order.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700/50 transition-colors">
                            <EditableNameCell 
                                order={order} 
                                onUpdateName={(id, newName) => dispatch({ type: 'UPDATE_ORDER', payload: { id, updates: { customerName: newName } } })}
                                isAdmin={state.currentUser?.role === UserRole.ADMIN}
                            />
                            <td className="px-6 py-4">
                                <div className="font-semibold text-stone-800 dark:text-zinc-200">
                                    {order.pickupTime && !isNaN(new Date(order.pickupTime).getTime()) ? new Date(order.pickupTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                                <ul className="space-y-3">
                                    {(order.items || []).map(item => (
                                        <li key={item.id} className="border-l-2 border-stone-200 dark:border-zinc-600 pl-3">
                                            <div className="font-bold text-stone-900 dark:text-white">
                                                <span>{item.quantity}x </span>
                                                {item.selectedVariantId && item.drink?.variants && (
                                                    <span className="uppercase mr-1">
                                                        {item.drink.variants.find(v => v.id === item.selectedVariantId)?.name}
                                                    </span>
                                                )}
                                                <span>{item.drink?.name || 'Unknown Drink'}</span>
                                            </div>
                                            {item.customName && (
                                                <div className="text-xs font-medium text-stone-600 dark:text-zinc-400 mt-0.5 italic">
                                                    For: {item.customName}
                                                </div>
                                            )}
                                            <div className="text-[11px] text-stone-500 dark:text-zinc-500 mt-1 flex flex-wrap gap-1">
                                                {Object.values(item.selectedModifiers || {}).flatMap(mods => mods || []).filter(sm => sm).map((sm: SelectedModifier) => (
                                                    <span key={sm.option?.id || Math.random()} className="bg-white dark:bg-zinc-800 px-1 rounded border border-stone-100 dark:border-zinc-700">
                                                        {sm.quantity > 1 ? `${sm.quantity}x ` : ''}{sm.option?.name || 'Unknown'}
                                                    </span>
                                                ))}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-stone-900 dark:text-white">${(order.finalTotal || 0).toFixed(2)}</div>
                                <div className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-tighter">{order.paymentMethod}</div>
                            </td>
                            <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                                {!order.isVerified && (
                                    <button 
                                        onClick={() => dispatch({ type: 'VERIFY_PAYMENT', payload: order.id })} 
                                        className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
                                    >
                                        Verify
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleCompleteOrder(order.id)} 
                                    className="text-green-600 hover:text-green-800 dark:hover:text-green-400 font-medium"
                                >
                                    Complete
                                </button>
                                <button 
                                    onClick={() => setDeleteCandidate(order.id)} 
                                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-medium"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            {/* Mobile View for Scheduled */}
            <div className="block sm:hidden divide-y divide-stone-100 dark:divide-zinc-800">
                {scheduledOrders.map(order => (
                    <div key={order.id} className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-stone-900 dark:text-white">{order.customerName || 'Unknown'}</div>
                                <div className="text-[10px] text-stone-400 font-mono">#{(order.id || '').slice(-6).toUpperCase()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-blue-600">
                                    {order.pickupTime && !isNaN(new Date(order.pickupTime).getTime()) ? new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-2 bg-stone-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                            {(order.items || []).map(item => (
                                <li key={item.id} className="text-xs">
                                    <div className="font-bold text-stone-900 dark:text-white">
                                        {item.quantity}x {item.drink?.name}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <div className="text-stone-900 dark:text-white">${(order.finalTotal || 0).toFixed(2)}</div>
                            <div className="flex gap-4">
                                {!order.isVerified && (
                                    <button onClick={() => dispatch({ type: 'VERIFY_PAYMENT', payload: order.id })} className="text-blue-600 uppercase">Verify</button>
                                )}
                                <button onClick={() => handleCompleteOrder(order.id)} className="text-green-600 uppercase">Complete</button>
                                <button onClick={() => setDeleteCandidate(order.id)} className="text-red-600 uppercase">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {scheduledOrders.length === 0 && (
                <div className="p-6 text-center">
                    {renderEmptyState('No orders scheduled for the future.')}
                </div>
            )}
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history" hidden={activeTab !== 'history'} className="overflow-hidden">
        <AnimatePresence mode="popLayout">
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleExportHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white dark:bg-zinc-700 rounded-lg font-bold shadow-md hover:bg-stone-900 dark:hover:bg-zinc-600 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Export to CSV
                </button>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden">
                  <div className="hidden sm:block overflow-x-auto scrollbar-hide">
                      <table className="w-full text-sm text-left text-stone-600 dark:text-zinc-400 min-w-[700px]">
                          <thead className="text-sm text-stone-700 dark:text-zinc-300 uppercase bg-stone-100 dark:bg-zinc-700">
                              <tr>
                                  <th scope="col" className="px-6 py-3">Customer</th>
                                  <th scope="col" className="px-6 py-3">Completed At</th>
                                  <th scope="col" className="px-6 py-3">Items</th>
                                  <th scope="col" className="px-6 py-3">Total</th>
                                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {completedOrders.map(order => (
                                  <tr key={order.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700/50 transition-colors">
                                      <EditableNameCell 
                                          order={order} 
                                          onUpdateName={(id, newName) => dispatch({ type: 'UPDATE_ORDER', payload: { id, updates: { customerName: newName } } })}
                                          isAdmin={state.currentUser?.role === UserRole.ADMIN}
                                      />
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                              <span>{order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'N/A'}</span>
                                              <span className="text-[10px] text-stone-400 dark:text-zinc-500">{order.completedAt ? new Date(order.completedAt).toLocaleTimeString() : ''}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 align-top">
                                          <ul className="space-y-2 max-w-xs">
                                              {(order.items || []).map(item => (
                                                  <li key={item.id} className="border-l-2 border-stone-200 dark:border-zinc-700 pl-2">
                                                      <div className="font-semibold text-stone-900 dark:text-white text-xs">
                                                          {item.quantity}x 
                                                          {item.selectedVariantId && item.drink?.variants && (
                                                              <span className="uppercase mx-1 text-[10px] bg-stone-100 dark:bg-zinc-700 px-1 rounded">
                                                                  {item.drink.variants.find(v => v.id === item.selectedVariantId)?.name}
                                                              </span>
                                                          )}
                                                          {item.drink?.name || 'Unknown Drink'}
                                                      </div>
                                                      {item.customName && <div className="text-[10px] text-stone-500 dark:text-zinc-400 italic">For: {item.customName}</div>}
                                                      <div className="text-[10px] text-stone-500 dark:text-zinc-500 flex flex-wrap gap-1 mt-0.5">
                                                          {Object.values(item.selectedModifiers || {}).flatMap(mods => mods || []).filter(sm => sm).map((sm: SelectedModifier) => 
                                                              <span key={sm.option?.id || Math.random()} className="bg-stone-50 dark:bg-zinc-800/50 px-1 rounded border border-stone-100 dark:border-zinc-700">
                                                                  {sm.quantity > 1 ? `${sm.quantity}x ` : ''}{sm.option?.name || 'Unknown'}
                                                              </span>
                                                          )}
                                                      </div>
                                                  </li>
                                              ))}
                                          </ul>
                                      </td>
                                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-white whitespace-nowrap">${(order.finalTotal || 0).toFixed(2)}</td>
                                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                                          <button 
                                              onClick={() => handleAddToDirectory(order)} 
                                              className="text-green-600 hover:text-green-800 font-medium"
                                              title="Add Customer & Favourites to Directory"
                                          >
                                              Add
                                          </button>
                                          <button 
                                              onClick={() => setRequeueCandidate(order.id)} 
                                              className="text-blue-600 hover:text-blue-800 font-medium"
                                              title="Re-queue Order"
                                          >
                                              Re-queue
                                          </button>
                                          <button 
                                              onClick={() => setDeleteCandidate(order.id)} 
                                              className="text-red-600 hover:text-red-800 font-medium"
                                              title="Delete Permanently"
                                          >
                                              Delete
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Mobile View for History */}
                  <div className="block sm:hidden divide-y divide-stone-100 dark:divide-zinc-800">
                    {completedOrders.map(order => (
                        <div key={order.id} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-stone-900 dark:text-white">{order.customerName || 'Unknown'}</div>
                                    <div className="text-[10px] text-stone-400 font-mono">#{(order.id || '').slice(-6).toUpperCase()}</div>
                                </div>
                                <div className="text-right text-[10px] text-stone-400">
                                    <div>{order.completedAt ? new Date(order.completedAt).toLocaleDateString() : ''}</div>
                                </div>
                            </div>

                            <ul className="space-y-1 bg-stone-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                                {(order.items || []).map(item => (
                                    <li key={item.id} className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                                        {item.quantity}x {item.drink?.name}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-wrap gap-3 pt-1">
                                <button onClick={() => handleAddToDirectory(order)} className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Add Directory</button>
                                <button onClick={() => setRequeueCandidate(order.id)} className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Re-queue</button>
                                <button onClick={() => setDeleteCandidate(order.id)} className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Delete</button>
                            </div>
                        </div>
                    ))}
                  </div>

                  {completedOrders.length > 0 && (
                      <div className="flex justify-center py-6 border-t dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/50">
                          <button
                              onClick={handleLoadMoreHistory}
                              disabled={isLoadingHistory}
                              className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-full font-bold shadow-sm border border-stone-200 dark:border-zinc-600 hover:bg-stone-50 dark:hover:bg-zinc-600 transition-all disabled:opacity-50"
                          >
                              {isLoadingHistory ? (
                                  <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-600 dark:border-zinc-300"></div>
                                      Loading...
                                  </>
                              ) : (
                                  'Load More History'
                              )}
                          </button>
                      </div>
                  )}

                  {completedOrders.length === 0 && !isLoadingHistory && (
                      <div className="text-center py-20 text-stone-400 dark:text-zinc-500">
                          No completed orders found.
                      </div>
                  )}
                  
                  {isLoadingHistory && completedOrders.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 dark:border-zinc-400"></div>
                          <span className="text-stone-500 dark:text-zinc-400 animate-pulse">Fetching historical records...</span>
                      </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmationModal
        isOpen={!!requeueCandidate}
        onClose={() => setRequeueCandidate(null)}
        onConfirm={confirmRequeue}
        title="Re-queue Order"
        message="Are you sure you want to move this completed order back to the pending queue?"
        confirmButtonText="Yes, Re-queue"
      />

      <ConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
        title="Delete Order"
        message="Are you sure you want to permanently delete this order? This action cannot be undone."
        confirmButtonText="Delete"
        variant="danger"
      />

      {isProcessing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-stone-900 dark:text-white animate-spin" />
            <p className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-widest">Processing...</p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default KDSView;
