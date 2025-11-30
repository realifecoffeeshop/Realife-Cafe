
import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Drink, ModifierOption, Order } from '../../types';
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
        const matchesCustomer = order.customerName.toLowerCase().includes(lowerCaseQuery);
        const matchesId = order.id.toLowerCase().includes(lowerCaseQuery);
        const matchesDrink = order.items.some(item => 
            item.drink.name.toLowerCase().includes(lowerCaseQuery)
        );
        return matchesCustomer || matchesId || matchesDrink;
    });
};


const PaymentTicket: React.FC<{ order: Order; onVerify: (id: string) => void; }> = ({ order, onVerify }) => {
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

  const ticketBorderClass = () => {
      const minutes = getMinutesWaiting();
      if (minutes >= 5) return 'border-orange-500 animate-pulse-orange';
      return 'border-blue-500';
  }

  return (
    <div 
        className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md flex flex-col h-full border-4 ${ticketBorderClass()}`}
        role="article"
        aria-labelledby={`order-heading-${order.id}`}
    >
      <header className="p-3 bg-stone-100 dark:bg-zinc-700 rounded-t-lg">
        <div className="flex justify-between items-start">
            <div id={`order-heading-${order.id}`}>
              <h3 className="font-bold text-xl text-stone-900 dark:text-white truncate">{order.customerName}</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">ID: #{order.id.slice(-6)}</p>
            </div>
            <span className="px-3 py-1 text-sm font-bold rounded-full bg-blue-500 text-white">
              {timeElapsed}
            </span>
        </div>
        <div className="mt-2 text-center bg-blue-100 dark:bg-blue-900/50 p-1 rounded-md">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                Total: ${order.finalTotal.toFixed(2)}
            </p>
        </div>
        {order.pickupTime && (
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
            <p className="font-semibold text-base text-stone-800 dark:text-zinc-200">{item.quantity}x {item.drink.name}</p>
            {item.customName && <p className="pl-4 font-medium text-stone-700 dark:text-zinc-300">- {item.customName}</p>}
            <ul className="pl-4 list-disc list-inside text-stone-600 dark:text-zinc-400">
              {Object.values(item.selectedModifiers).map((mod: ModifierOption) => (
                <li key={mod.id}>{mod.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <footer className="p-3 border-t dark:border-zinc-700">
        <button
          onClick={() => onVerify(order.id)}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-800"
          aria-label={`Verify payment for ${order.customerName}'s order`}
        >
          Verify Payment & Send to Kitchen
        </button>
      </footer>
    </div>
  );
};

const KDSView: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { addToast } = useToast();
  const [requeueCandidate, setRequeueCandidate] = useState<string | null>(null);
  const [kdsViewMode, setKdsViewMode] = useState<'order' | 'item' | 'type'>('order');
  const [searchQuery, setSearchQuery] = useState('');

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

  const [activeTab, setActiveTab] = useState<'payment-required' | 'pending' | 'scheduled' | 'history'>(
      paymentRequiredOrdersUnfiltered.length > 0 ? 'payment-required' : 'pending'
  );

  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        state.orders.forEach(order => {
            if (order.status === 'scheduled' && order.pickupTime && order.pickupTime - now <= PREPARATION_LEAD_TIME) {
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
        selectedModifiers: { [key: string]: ModifierOption };
        quantity: number;
        orders: Map<string, { name: string; quantity: number }>;
    }> = new Map();

    pendingOrdersBase.forEach(order => {
        order.items.forEach(item => {
            const modifierIds = Object.values(item.selectedModifiers).map((mod: ModifierOption) => mod.id).sort().join('_');
            const key = `${item.drink.id}_${modifierIds}`;

            if (!itemsMap.has(key)) {
                itemsMap.set(key, {
                    drink: item.drink,
                    selectedModifiers: item.selectedModifiers,
                    quantity: 0,
                    orders: new Map(),
                });
            }
            const existingAggregatedItem = itemsMap.get(key)!;
            existingAggregatedItem.quantity += item.quantity;
            const orderInfo = existingAggregatedItem.orders.get(order.id) || { name: order.customerName, quantity: 0 };
            orderInfo.quantity += item.quantity;
            existingAggregatedItem.orders.set(order.id, orderInfo);
        });
    });

    let result: AggregatedItem[] = Array.from(itemsMap.values()).map(aggItem => ({
        ...aggItem,
        orders: Array.from(aggItem.orders.entries()).map(([id, info]) => ({ id, name: info.name, quantity: info.quantity }))
    }));
    
    if (searchQuery.trim()) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        result = result.filter(aggItem => {
            const matchesDrink = aggItem.drink.name.toLowerCase().includes(lowerCaseQuery);
            const matchesOrder = aggItem.orders.some(order => 
                order.name.toLowerCase().includes(lowerCaseQuery) ||
                order.id.toLowerCase().includes(lowerCaseQuery)
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
              selectedModifiers: { [key: string]: ModifierOption };
              quantity: number;
          }>;
      }> = new Map();

      pendingOrdersBase.forEach(order => {
          order.items.forEach(item => {
              const typeKey = item.drink.id;
              if (!typeMap.has(typeKey)) {
                  typeMap.set(typeKey, { drink: item.drink, totalQuantity: 0, variations: new Map() });
              }
              const aggByType = typeMap.get(typeKey)!;
              aggByType.totalQuantity += item.quantity;
              const variationKey = Object.values(item.selectedModifiers).map((mod: ModifierOption) => mod.id).sort().join('_');
              const variation = aggByType.variations.get(variationKey) || { selectedModifiers: item.selectedModifiers, quantity: 0 };
              variation.quantity += item.quantity;
              aggByType.variations.set(variationKey, variation);
          });
      });

      let finalResult = Array.from(typeMap.values()).map(agg => ({
          ...agg,
          variations: Array.from(agg.variations.values()).sort((a,b) => b.quantity - a.quantity)
      }));
      
      if (searchQuery.trim()) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        finalResult = finalResult.filter(aggType => 
            aggType.drink.name.toLowerCase().includes(lowerCaseQuery)
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

  const confirmRequeue = () => {
    if (requeueCandidate) {
        dispatch({ type: 'REQUEUE_ORDER', payload: requeueCandidate });
        setRequeueCandidate(null);
    }
  };

  const TabButton: React.FC<{tabId: 'payment-required' | 'pending' | 'scheduled' | 'history', count: number, children: React.ReactNode, panelId: string}> = ({tabId, count, children, panelId}) => (
      <button 
        role="tab"
        id={`tab-${tabId}`}
        aria-controls={panelId}
        aria-selected={activeTab === tabId}
        onClick={() => setActiveTab(tabId)} 
        className={`px-6 py-2 text-lg font-semibold rounded-t-md transition-colors border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-900 ${
          activeTab === tabId 
            ? 'bg-white text-stone-700 border-stone-600 dark:bg-zinc-800 dark:text-white dark:border-white' 
            : 'text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 border-transparent'
        }`}
      >
          {children} ({count})
      </button>
  );

  const ViewModeToggle: React.FC = () => (
      <>
          <h2 id="view-mode-label" className="sr-only">KDS View Mode</h2>
          <div role="radiogroup" aria-labelledby="view-mode-label" className="flex items-center bg-stone-200 dark:bg-zinc-700 rounded-lg p-1 mb-6 max-w-sm mx-auto md:mx-0">
              <button 
                role="radio"
                aria-checked={kdsViewMode === 'order'}
                onClick={() => setKdsViewMode('order')}
                className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-700 ${kdsViewMode === 'order' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
              >
                By Order
              </button>
              <button 
                role="radio"
                aria-checked={kdsViewMode === 'item'}
                onClick={() => setKdsViewMode('item')}
                className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-700 ${kdsViewMode === 'item' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
              >
                By Item
              </button>
              <button 
                role="radio"
                aria-checked={kdsViewMode === 'type'}
                onClick={() => setKdsViewMode('type')}
                className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-700 ${kdsViewMode === 'type' ? 'bg-white text-stone-800 shadow dark:bg-zinc-600 dark:text-white' : 'text-stone-600 dark:text-zinc-300'}`}
              >
                By Type
              </button>
          </div>
      </>
  );

  const renderPendingContent = () => {
    switch(kdsViewMode) {
        case 'order':
            return pendingOrders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {pendingOrders.map(order => (
                        <OrderTicket key={order.id} order={order} onComplete={handleCompleteOrder} onToggleItem={handleToggleItemCompletion} />
                    ))}
                </div>
            ) : null;
        case 'item':
            return aggregatedItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {aggregatedItems.map(item => (
                        <GroupedItemCard key={`${item.drink.id}-${Object.values(item.selectedModifiers).map((m: ModifierOption) => m.id).join('-')}`} item={item} />
                    ))}
                </div>
            ) : null;
        case 'type':
            return aggregatedByType.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {aggregatedByType.map(item => (
                        <GroupedByTypeCard key={item.drink.id} item={item} />
                    ))}
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
    <div className="p-4 md:p-6 bg-[#F5F3EF] dark:bg-zinc-900 min-h-screen">
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
      
      <div role="tablist" aria-label="Order views" className="flex space-x-2 border-b border-stone-300 dark:border-zinc-700 mb-6">
        <TabButton tabId="payment-required" count={paymentRequiredOrders.length} panelId="tabpanel-payment-required">Payment Required</TabButton>
        <TabButton tabId="pending" count={pendingOrders.length} panelId="tabpanel-pending">Pending</TabButton>
        <TabButton tabId="scheduled" count={scheduledOrders.length} panelId="tabpanel-scheduled">Scheduled</TabButton>
        <TabButton tabId="history" count={completedOrders.length} panelId="tabpanel-history">History</TabButton>
      </div>
      
      <div id="tabpanel-payment-required" role="tabpanel" aria-labelledby="tab-payment-required" hidden={activeTab !== 'payment-required'}>
        {paymentRequiredOrders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paymentRequiredOrders.map(order => (
                    <PaymentTicket key={order.id} order={order} onVerify={handleVerifyPayment} />
                ))}
            </div>
        ) : renderEmptyState('No orders awaiting payment.')}
      </div>

      <div id="tabpanel-pending" role="tabpanel" aria-labelledby="tab-pending" hidden={activeTab !== 'pending'}>
            <ViewModeToggle />
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
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {scheduledOrders.map(order => (
                        <tr key={order.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{order.customerName}</td>
                            <td className="px-6 py-4">{new Date(order.pickupTime!).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-6 py-4 align-top">
                                <ul className="space-y-2">
                                    {order.items.map(item => (
                                        <li key={item.id}>
                                            <div className="font-semibold text-stone-900 dark:text-white">
                                                {item.quantity}x {item.drink.name}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4">${order.finalTotal.toFixed(2)}</td>
                            <td className="px-6 py-4">
                                <button 
                                    onClick={() => handleCompleteOrder(order.id)} 
                                    className="text-green-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-zinc-800 rounded"
                                    aria-label={`Complete scheduled order for ${order.customerName}`}
                                >
                                    Complete
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
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {completedOrders.map(order => (
                        <tr key={order.id} className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700">
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white whitespace-nowrap">{order.customerName}</td>
                            <td className="px-6 py-4">{new Date(order.completedAt!).toLocaleString()}</td>
                            <td className="px-6 py-4 align-top">
                                <ul className="space-y-2">
                                    {order.items.map(item => (
                                        <li key={item.id}>
                                            <div className="font-semibold text-stone-900 dark:text-white">
                                                {item.quantity}x {item.drink.name}
                                                {item.customName && <span className="font-normal text-stone-600 dark:text-zinc-400"> ({item.customName})</span>}
                                            </div>
                                            <div className="text-xs text-stone-500 dark:text-zinc-400 pl-2">
                                                {Object.values(item.selectedModifiers).map((mod: ModifierOption) => mod.name).join(', ')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4">${order.finalTotal.toFixed(2)}</td>
                            <td className="px-6 py-4">
                                <button 
                                    onClick={() => setRequeueCandidate(order.id)} 
                                    className="text-stone-700 dark:text-zinc-300 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-zinc-800 rounded"
                                    aria-label={`Re-queue order for ${order.customerName}, completed at ${new Date(order.completedAt!).toLocaleString()}`}
                                >
                                    Re-queue
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

      <ConfirmationModal
        isOpen={!!requeueCandidate}
        onClose={() => setRequeueCandidate(null)}
        onConfirm={confirmRequeue}
        title="Re-queue Order"
        message="Are you sure you want to move this completed order back to the pending queue?"
        confirmButtonText="Yes, Re-queue"
      />
    </div>
  );
};

export default KDSView;
