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
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Order History</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-md bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-md bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="payment-required">Payment Required</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-stone-200 dark:border-zinc-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 dark:bg-zinc-900/50 text-stone-500 dark:text-zinc-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Items</th>
                                <th className="px-6 py-4 font-semibold">Total</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-zinc-700">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-zinc-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                                            {formatDate(order.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-stone-900 dark:text-white">{order.customerName || 'Unknown'}</div>
                                        <div className="text-xs text-stone-400 font-mono">#{order.id?.slice(-6) || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-zinc-300">
                                        {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900 dark:text-white">
                                        ${(order.finalTotal || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            order.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-stone-100 text-stone-700 dark:bg-zinc-700 dark:text-zinc-400'
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
                    <div className="p-12 text-center">
                        <p className="text-stone-500 dark:text-zinc-400">No orders found matching your criteria.</p>
                    </div>
                )}

                {hasMore && (
                    <div className="p-4 bg-stone-50/50 dark:bg-zinc-900/30 border-t border-stone-100 dark:border-zinc-700 flex justify-center">
                        <button
                            onClick={() => loadOrders(false)}
                            disabled={loadingMore}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white transition-colors disabled:opacity-50"
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
