import React, { useState, useEffect, useCallback } from 'react';
import { fetchOrderHistory } from '../../firebase/firestoreService';
import { Order } from '../../types';
import { Loader2, ChevronDown, Search, Calendar } from 'lucide-react';

const OrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const PAGE_SIZE = 20;

    const loadOrders = useCallback(async (isInitial: boolean = false) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        try {
            const beforeTimestamp = isInitial ? undefined : orders[orders.length - 1]?.createdAt;
            const newOrders = await fetchOrderHistory(PAGE_SIZE, beforeTimestamp);
            
            if (isInitial) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }
            
            setHasMore(newOrders.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error loading order history:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [orders]);

    useEffect(() => {
        loadOrders(true);
    }, []);

    const filteredOrders = (orders || []).filter(order => {
        const matchesSearch = (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400 mb-2" />
                <p className="text-stone-500">Loading order history...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-stone-100 dark:border-zinc-800">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Order History</h2>
                    <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Review and manage past transactions with precision.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 dark:group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-4 focus:ring-stone-900/5 dark:focus:ring-white/5 focus:outline-none transition-all w-full sm:w-72 shadow-sm font-serif italic"
                        />
                    </div>
                    <div className="relative group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-6 pr-12 py-3.5 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl text-sm text-stone-900 dark:text-white focus:ring-4 focus:ring-stone-900/5 dark:focus:ring-white/5 focus:outline-none transition-all cursor-pointer appearance-none shadow-sm font-serif italic min-w-[180px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="payment-required">Payment Required</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                </div>
            </header>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em] bg-stone-50/50 dark:bg-zinc-800/30">
                            <tr>
                                <th className="px-8 py-5 font-bold">Date</th>
                                <th className="px-8 py-5 font-bold">Customer</th>
                                <th className="px-8 py-5 font-bold">Items</th>
                                <th className="px-8 py-5 font-bold">Total</th>
                                <th className="px-8 py-5 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50/30 dark:hover:bg-zinc-800/20 transition-all duration-300">
                                    <td className="px-8 py-6 whitespace-nowrap text-sm text-stone-500 dark:text-zinc-400">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 opacity-30" />
                                            <span className="font-serif italic">{formatDate(order.createdAt)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="text-base font-serif font-bold text-stone-900 dark:text-white tracking-tight">{order.customerName || 'Guest'}</div>
                                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">ID: {order.id?.slice(-8).toUpperCase() || 'N/A'}</div>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-stone-500 dark:text-zinc-400">
                                        <span className="font-serif font-bold text-stone-900 dark:text-white">{(order.items || []).length}</span> {(order.items || []).length === 1 ? 'item' : 'items'}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-xl font-serif font-bold text-stone-900 dark:text-white tracking-tighter">
                                        ${(order.finalTotal || 0).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                            order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                            order.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                            'bg-stone-50 text-stone-700 border-stone-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-stone-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Search className="w-8 h-8 text-stone-200" />
                        </div>
                        <p className="text-stone-400 dark:text-zinc-500 font-serif italic text-lg">"No orders found matching your criteria."</p>
                    </div>
                )}

                {hasMore && (
                    <div className="p-8 bg-stone-50/20 dark:bg-zinc-800/10 border-t border-stone-50 dark:border-zinc-800 flex justify-center">
                        <button
                            onClick={() => loadOrders(false)}
                            disabled={loadingMore}
                            className="flex items-center gap-3 px-10 py-4 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl text-xs font-bold uppercase tracking-widest text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all shadow-lg disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                            Load More Orders
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
