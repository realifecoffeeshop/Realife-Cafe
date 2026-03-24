
import React, { useContext, useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { Drink, ModifierOption, Order, SelectedModifier } from '../../types';
import OrderTicket from './OrderTicket';
import ConfirmationModal from '../shared/ConfirmationModal';
import Modal from '../shared/Modal';
import GroupedItemCard, { AggregatedItem } from './GroupedItemCard';
import GroupedByTypeCard, { AggregatedByType } from './GroupedByTypeCard';
import CustomerDirectory from './CustomerDirectory';

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


const PaymentTicket = memo(({ order, onVerify, onDelete }: { order: Order; onVerify: (id: string) => void; onDelete: (id: string) => void; }) => {
  const [timeElapsed, setTimeElapsed] = useState('');

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
        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
        title="Delete Order"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <header className="p-3 bg-stone-100 dark:bg-zinc-700 rounded-t-lg sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-start">
            <div id={`order-heading-${order.id}`}>
              <h3 className="font-bold text-xl text-stone-900 dark:text-white truncate">{order.customerName}</h3>
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
      <div className="p-4 space-y-3 flex-grow overflow-y-auto">
        {order.items.map(item => (
          <div key={item.id} className="text-sm">
            <p className="font-semibold text-base text-stone-800 dark:text-zinc-200">
              {item.quantity}x {item.drink?.name || 'Unknown Drink'}
              {item.selectedVariantId && item.drink?.variants && (
                <span className="text-sm font-bold text-stone-400 dark:text-zinc-500 ml-2 italic">
                  ({item.drink.variants.find(v => v.id === item.selectedVariantId)?.name})
                </span>
              )}
            </p>
            {item.customName && <p className="pl-4 font-medium text-stone-700 dark:text-zinc-300">- {item.customName}</p>}
            <ul className="pl-4 list-disc list-inside text-stone-600 dark:text-zinc-400">
              {Object.values(item.selectedModifiers || {}).flatMap(mods => mods || []).filter(sm => sm).map((sm: SelectedModifier) => (
                <li key={sm.option?.id || Math.random()}>{sm.quantity > 1 ? `${sm.quantity}x ` : ''}{sm.option?.name || 'Unknown'}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <footer className="p-3 border-t dark:border-zinc-700">
        <button
          onClick={() => onVerify(order.id)}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-800"
          aria-label={`Verify payment for ${order.customerName || 'Customer'}'s order`}
        >
          Verify Payment & Send to Kitchen
        </button>
      </footer>
    </motion.div>
  );
});
PaymentTicket.displayName = 'PaymentTicket';

const TabButton: React.FC<{
  tabId: 'payment-required' | 'pending' | 'scheduled' | 'history' | 'customers';
  count: number;
  children: React.ReactNode;
  panelId: string;
  activeTab: string;
  onTabChange: (tab: any) => void;
}> = ({ tabId, count, children, panelId, activeTab, onTabChange }) => (
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
);

const ViewModeToggle: React.FC<{
  kdsViewMode: 'order' | 'item' | 'type';
  onModeChange: (mode: 'order' | 'item' | 'type') => void;
}> = ({ kdsViewMode, onModeChange }) => (
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
);

const KDSView: React.FC = () => {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const [requeueCandidate, setRequeueCandidate] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [kdsViewMode, setKdsViewMode] = useState<'order' | 'item' | 'type'>('order');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollDirection, setScrollDirection] = useState<'vertical' | 'horizontal'>('vertical');

  const paymentRequiredOrdersUnfiltered = useMemo(() =>
    state.orders.filter(o => o.status === 'payment-required'),
    [state.orders]
  );
  
  const paymentRequiredOrders = useMemo(() =>
    filterOrders(paymentRequiredOrdersUnfiltered, searchQuery)
        .sort((a,b) => a.createdAt - b.createdAt),
    [paymentRequiredOrdersUnfiltered, searchQuery]
  );
  
  const pendingOrdersBase = useMemo(() => 
    state.orders.filter(order => order.status === 'pending'),
    [state.orders]
  );

  const [activeTab, setActiveTab] = useState<'payment-required' | 'pending' | 'scheduled' | 'history' | 'customers'>(
      paymentRequiredOrdersUnfiltered.length > 0 ? 'payment-required' : 'pending'
  );

  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        state.orders.forEach(order => {
            if (order.status === 'scheduled' && order.pickupTime && (order.pickupTime - now) <= PREPARATION_LEAD_TIME) {
                dispatch({ type: 'ACTIVATE_SCHEDULED_ORDER', payload: order.id });
            }
        });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [state.orders, dispatch]);

  useEffect(() => {
    if (activeTab === 'payment-required' && paymentRequiredOrdersUnfiltered.length === 0 && pendingOrdersBase.length > 0) {
        setActiveTab('pending');
    }
  }, [paymentRequiredOrdersUnfiltered.length, pendingOrdersBase.length, activeTab]);

  const pendingOrders = useMemo(() => 
    filterOrders(pendingOrdersBase, searchQuery)
      .sort((a, b) => a.createdAt - b.createdAt),
    [pendingOrdersBase, searchQuery]
  );
  
  const scheduledOrders = useMemo(() => {
    const baseList = state.orders.filter(o => o.status === 'scheduled');
    return filterOrders(baseList, searchQuery)
      .sort((a, b) => (a.pickupTime || 0) - (b.pickupTime || 0));
  },[state.orders, searchQuery]);

  const completedOrders = useMemo(() => {
    const baseList = state.orders.filter(o => o.status === 'completed');
    return filterOrders(baseList, searchQuery)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [state.orders, searchQuery]);


  const aggregatedItems = useMemo((): AggregatedItem[] => {
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
    
    if (searchQuery.trim()) {
        const lowerCaseQuery = searchQuery.toLowerCase();
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
  }, [pendingOrdersBase, searchQuery]);

  const aggregatedByType = useMemo((): AggregatedByType[] => {
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
      
      if (searchQuery.trim()) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        finalResult = finalResult.filter(aggType => 
            (aggType.drink?.name || '').toLowerCase().includes(lowerCaseQuery)
        );
      }
      
      return finalResult.sort((a, b) => b.totalQuantity - a.totalQuantity);

  }, [pendingOrdersBase, searchQuery]);


  const handleCompleteOrder = useCallback((id: string) => {
    dispatch({ type: 'COMPLETE_ORDER', payload: id });
  }, [dispatch]);

  const handleToggleItemCompletion = useCallback((orderId: string, itemId: string) => {
    dispatch({ type: 'TOGGLE_ORDER_ITEM_COMPLETION', payload: { orderId, itemId } });
  }, [dispatch]);
  
  const handleVerifyPayment = useCallback((id: string) => {
      dispatch({ type: 'VERIFY_PAYMENT', payload: id });
  }, [dispatch]);

  const handleGroupOrders = () => {
    if (selectedOrders.length < 2) {
        addToast('Please select at least 2 orders to group', 'error');
        return;
    }
    const mergeId = `group-${Date.now()}`;
    dispatch({ type: 'MERGE_ORDERS', payload: { orderIds: selectedOrders, mergeId } });
    setSelectedOrders([]);
    setIsMergeMode(false);
    addToast('Orders grouped successfully', 'success');
  };

  const handleMergeOrdersPermanent = () => {
    if (selectedOrders.length < 2) {
        addToast('Please select at least 2 orders to merge', 'error');
        return;
    }
    const targetOrderId = selectedOrders[0];
    dispatch({ type: 'MERGE_ORDERS_PERMANENT', payload: { orderIds: selectedOrders, targetOrderId } });
    setSelectedOrders([]);
    setIsMergeMode(false);
    addToast('Orders merged permanently', 'success');
  };

  const handleUngroupOrder = (id: string) => {
    if (id.startsWith('group-')) {
        dispatch({ type: 'UNMERGE_GROUP', payload: id });
        addToast('Group unmerged', 'success');
    } else {
        dispatch({ type: 'UNMERGE_ORDER', payload: id });
        addToast('Order ungrouped', 'success');
    }
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => 
        prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const confirmRequeue = () => {
    if (requeueCandidate) {
        dispatch({ type: 'REQUEUE_ORDER', payload: requeueCandidate });
        setRequeueCandidate(null);
    }
  };

  const confirmDelete = () => {
    if (deleteCandidate) {
        dispatch({ type: 'DELETE_ORDER', payload: deleteCandidate });
        setDeleteCandidate(null);
        addToast('Order deleted successfully', 'success');
    }
  };

  const containerClasses = scrollDirection === 'vertical' 
    ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4' 
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
                    <div className="flex items-center justify-between bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-zinc-700">
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
                            {standaloneOrders.map(order => (
                                <motion.div 
                                    key={order.id} 
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={ticketWrapperClasses}
                                >
                                    <OrderTicket 
                                        order={order} 
                                        onComplete={handleCompleteOrder} 
                                        onDelete={setDeleteCandidate} 
                                        onToggleItem={handleToggleItemCompletion}
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
    <div className="p-4 md:p-6 bg-[#F5F3EF] dark:bg-zinc-900 min-h-full">
      <h1 className="text-3xl font-bold mb-4 text-stone-800 dark:text-white">Kitchen Display Screen</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                id="kds-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md leading-5 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 placeholder-stone-500 dark:placeholder-zinc-400 focus:outline-none focus:placeholder-stone-400 dark:focus:placeholder-zinc-500 focus:ring-1 focus:ring-stone-500 focus:border-stone-500 sm:text-sm"
                placeholder="Search by name, drink, or order ID..."
            />
        </div>
      </div>
      
      <div role="tablist" aria-label="Order views" className="flex space-x-2 border-b border-stone-300 dark:border-zinc-700 mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0">
        <TabButton tabId="payment-required" count={paymentRequiredOrders.length} panelId="tabpanel-payment-required" activeTab={activeTab} onTabChange={setActiveTab}>Payment Required</TabButton>
        <TabButton tabId="pending" count={pendingOrders.length} panelId="tabpanel-pending" activeTab={activeTab} onTabChange={setActiveTab}>Pending</TabButton>
        <TabButton tabId="scheduled" count={scheduledOrders.length} panelId="tabpanel-scheduled" activeTab={activeTab} onTabChange={setActiveTab}>Scheduled</TabButton>
        <TabButton tabId="history" count={completedOrders.length} panelId="tabpanel-history" activeTab={activeTab} onTabChange={setActiveTab}>History</TabButton>
        <TabButton tabId="customers" count={state.customers.length} panelId="tabpanel-customers" activeTab={activeTab} onTabChange={setActiveTab}>Customers</TabButton>
      </div>
      
      <div id="tabpanel-payment-required" role="tabpanel" aria-labelledby="tab-payment-required" hidden={activeTab !== 'payment-required'}>
        {paymentRequiredOrders.length > 0 ? (
            <div className={containerClasses}>
                <AnimatePresence mode="popLayout">
                    {paymentRequiredOrders.map(order => (
                        <div key={order.id} className={ticketWrapperClasses}>
                            <PaymentTicket order={order} onVerify={handleVerifyPayment} onDelete={setDeleteCandidate} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        ) : renderEmptyState('No orders awaiting payment.')}
      </div>

      <div id="tabpanel-pending" role="tabpanel" aria-labelledby="tab-pending" hidden={activeTab !== 'pending'}>
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
      </div>

      <div id="tabpanel-scheduled" role="tabpanel" aria-labelledby="tab-scheduled" hidden={activeTab !== 'scheduled'}>
         <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-zinc-400">
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
                        <tr key={order.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{order.customerName || 'Unknown'}</td>
                            <td className="px-6 py-4">{order.pickupTime && !isNaN(new Date(order.pickupTime).getTime()) ? new Date(order.pickupTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                            <td className="px-6 py-4 align-top">
                                <ul className="space-y-2">
                                    {(order.items || []).map(item => (
                                        <li key={item.id}>
                                            <div className="font-semibold text-stone-900 dark:text-white">
                                                {item.quantity}x {item.drink?.name || 'Unknown Drink'}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4">${(order.finalTotal || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                                <button 
                                    onClick={() => handleCompleteOrder(order.id)} 
                                    className="text-green-600 hover:text-green-800 dark:hover:text-green-400 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-zinc-800 rounded"
                                    aria-label={`Complete scheduled order for ${order.customerName || 'Unknown'}`}
                                >
                                    Complete
                                </button>
                                <button 
                                    onClick={() => setDeleteCandidate(order.id)} 
                                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-zinc-800 rounded"
                                    aria-label={`Delete scheduled order for ${order.customerName || 'Unknown'}`}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {scheduledOrders.length === 0 && (
                <div className="p-6 text-center">
                    {renderEmptyState('No orders scheduled for the future.')}
                </div>
            )}
        </div>
      </div>
      
      <div id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history" hidden={activeTab !== 'history'}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-zinc-400">
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
                        <tr key={order.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{order.customerName || 'Unknown'}</td>
                            <td className="px-6 py-4">{order.completedAt ? new Date(order.completedAt).toLocaleString() : 'N/A'}</td>
                            <td className="px-6 py-4 align-top">
                                <ul className="space-y-2">
                                    {(order.items || []).map(item => (
                                        <li key={item.id}>
                                            <div className="font-semibold text-stone-900 dark:text-white">
                                                {item.quantity}x {item.drink?.name || 'Unknown Drink'}
                                                {item.selectedVariantId && item.drink?.variants && (
                                                    <span className="text-sm font-bold text-stone-400 dark:text-zinc-500 ml-2 italic">
                                                        ({item.drink.variants.find(v => v.id === item.selectedVariantId)?.name})
                                                    </span>
                                                )}
                                                {item.customName && <span className="font-normal text-stone-600 dark:text-zinc-400"> ({item.customName})</span>}
                                            </div>
                                            <div className="text-xs text-stone-500 dark:text-zinc-400 pl-2">
                                                {Object.values(item.selectedModifiers || {}).flatMap(mods => mods || []).filter(sm => sm).map((sm: SelectedModifier) => 
                                                    sm.quantity > 1 ? `${sm.quantity}x ${sm.option?.name || 'Unknown'}` : (sm.option?.name || 'Unknown')
                                                ).join(', ')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4">${(order.finalTotal || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                                <button 
                                    onClick={() => setRequeueCandidate(order.id)} 
                                    className="text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-800 rounded"
                                    aria-label={`Re-queue order for ${order.customerName || 'Unknown'}, completed at ${order.completedAt ? new Date(order.completedAt).toLocaleString() : 'N/A'}`}
                                >
                                    Re-queue
                                </button>
                                <button 
                                    onClick={() => setDeleteCandidate(order.id)} 
                                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-zinc-800 rounded"
                                    aria-label={`Delete completed order for ${order.customerName || 'Unknown'}`}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {completedOrders.length === 0 && (
                 <div className="p-6 text-center">
                    {renderEmptyState('No orders have been completed yet.')}
                </div>
            )}
        </div>
      </div>

      <div id="tabpanel-customers" role="tabpanel" aria-labelledby="tab-customers" hidden={activeTab !== 'customers'}>
        <CustomerDirectory />
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
    </div>
  );
};

export default KDSView;
