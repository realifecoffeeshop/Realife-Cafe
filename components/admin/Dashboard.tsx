import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PaymentMethod } from '../../types';

const Dashboard: React.FC = () => {
  const { state, theme } = useContext(AppContext);
  const { orders } = state;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const filteredOrders = useMemo(() => {
    // Ensure start date is not after end date
    if (new Date(startDate) > new Date(endDate)) return [];
      
    const startTimestamp = new Date(startDate).getTime();
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = endOfDay.getTime();

    return orders.filter(o =>
        o.status === 'completed' &&
        o.createdAt >= startTimestamp &&
        o.createdAt <= endTimestamp
    );
  }, [orders, startDate, endDate]);

  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.finalTotal, 0), [filteredOrders]);
  const totalCost = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0), [filteredOrders]);
  const totalProfit = totalRevenue - totalCost;
  
  const drinksProcessed = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0), [filteredOrders]);

  const avgProcessingTime = useMemo(() => {
    const ordersWithCompletion = filteredOrders.filter(o => o.completedAt);
    if (ordersWithCompletion.length === 0) return 0;
    const totalTime = ordersWithCompletion.reduce((sum, o) => sum + (o.completedAt! - o.createdAt), 0);
    return (totalTime / ordersWithCompletion.length) / 1000 / 60; // in minutes
  }, [filteredOrders]);
  
  const isSingleDay = startDate === endDate;

  const chartData = useMemo(() => {
    if (isSingleDay) {
        const data: { [hour: number]: { revenue: number, profit: number } } = {};
        for (let i = 0; i < 24; i++) data[i] = { revenue: 0, profit: 0 };
        
        filteredOrders.forEach(order => {
          const hour = new Date(order.createdAt).getHours();
          data[hour].revenue += order.finalTotal;
          data[hour].profit += (order.finalTotal - (order.totalCost || 0));
        });
        
        return Object.entries(data).map(([hour, values]) => ({
          hour: `${parseInt(hour).toString().padStart(2, '0')}:00`,
          Revenue: values.revenue,
          Profit: values.profit,
        }));
    } else {
        const data: { [date: string]: { revenue: number, profit: number } } = {};
        filteredOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            if (!data[dateStr]) {
                data[dateStr] = { revenue: 0, profit: 0 };
            }
            data[dateStr].revenue += order.finalTotal;
            data[dateStr].profit += (order.finalTotal - (order.totalCost || 0));
        });

        return Object.entries(data).map(([date, values]) => ({
            date: new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
            Revenue: values.revenue,
            Profit: values.profit,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }, [filteredOrders, isSingleDay]);
  
  const paymentMethodData = useMemo(() => {
    const counts = filteredOrders.reduce((acc, order) => {
      const method = order.paymentMethod || PaymentMethod.CARD;
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as { [key in PaymentMethod]?: number });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const COLORS = ['#78716c', '#a8a29e', '#d6d3d1'];
  
  const tickColor = theme === 'dark' ? '#a1a1aa' : '#57534e';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5' }
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb' };


  const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
      <h3 className="text-sm font-medium text-stone-500 dark:text-zinc-400 uppercase">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-stone-900 dark:text-white">{value}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Dashboard</h2>
      
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-white flex-shrink-0">Reporting Period</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div>
                <label htmlFor="startDate" className="sr-only">Start Date</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                    aria-label="Start Date"
                />
            </div>
            <span className="text-stone-500 dark:text-zinc-400">to</span>
            <div>
                <label htmlFor="endDate" className="sr-only">End Date</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                    aria-label="End Date"
                />
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard title="Total Profit" value={`$${totalProfit.toFixed(2)}`} />
        <StatCard title="Drinks Processed" value={drinksProcessed.toString()} />
        <StatCard title="Avg. Processing Time" value={`${avgProcessingTime.toFixed(1)} min`} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">Performance Overview</h3>
          <div style={{ width: '100%', height: 300 }}>
            {filteredOrders.length > 0 ? (
                <ResponsiveContainer>
                    <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey={isSingleDay ? "hour" : "date"} tick={{ fill: tickColor }} />
                    <YAxis tick={{ fill: tickColor }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: 'rgba(113, 128, 150, 0.1)' }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{color: tickColor}} />
                    <Bar dataKey="Revenue" fill="#78716c" />
                    <Bar dataKey="Profit" fill="#a8a29e" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-stone-500 dark:text-zinc-400">
                    <p>No sales data for this period.</p>
                </div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">Payment Methods</h3>
            <div style={{ width: '100%', height: 300 }}>
                {paymentMethodData.length > 0 ? (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={paymentMethodData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                            >
                                {paymentMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: number, name: string) => [`${value} orders`, name]}
                            />
                            <Legend wrapperStyle={{color: tickColor}} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-stone-500 dark:text-zinc-400">
                        <p>No payment data for this period.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
