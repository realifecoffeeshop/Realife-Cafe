import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PaymentMethod } from '../../types';

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
  <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
    <h3 className="text-sm font-medium text-stone-500 dark:text-zinc-400 uppercase">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-stone-900 dark:text-white">{value}</p>
  </div>
);

const ChartPlaceholder: React.FC<{ message: string; isError?: boolean }> = ({ message, isError }) => (
  <div className={`flex flex-col items-center justify-center h-full p-4 text-center ${isError ? 'text-red-500 dark:text-red-400' : 'text-stone-500 dark:text-zinc-400'}`}>
    {isError ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )}
    <p className="text-sm font-medium">{message}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const { state, theme } = useContext(AppContext);
  const { orders } = state;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const dateError = useMemo(() => {
    if (new Date(startDate) > new Date(endDate)) {
      return "Start date cannot be after end date.";
    }
    return null;
  }, [startDate, endDate]);

  const filteredOrders = useMemo(() => {
    if (dateError) return [];
      
    const startTimestamp = new Date(startDate).getTime();
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = endOfDay.getTime();

    return (orders || []).filter(o =>
        o.status === 'completed' &&
        o.createdAt >= startTimestamp &&
        o.createdAt <= endTimestamp
    );
  }, [orders, startDate, endDate, dateError]);

  const totalRevenue = useMemo(() => (filteredOrders || []).reduce((sum, o) => sum + (o.finalTotal || 0), 0), [filteredOrders]);
  const totalCost = useMemo(() => (filteredOrders || []).reduce((sum, o) => sum + (o.totalCost || 0), 0), [filteredOrders]);
  const totalProfit = totalRevenue - totalCost;
  
  const drinksProcessed = useMemo(() => (filteredOrders || []).reduce((sum, o) => sum + (o.items || []).reduce((itemSum, i) => itemSum + (i.quantity || 0), 0), 0), [filteredOrders]);

  const avgProcessingTime = useMemo(() => {
    try {
      const ordersWithCompletion = (filteredOrders || []).filter(o => o.completedAt);
      if (ordersWithCompletion.length === 0) return 0;
      const totalTime = ordersWithCompletion.reduce((sum, o) => sum + (o.completedAt! - o.createdAt), 0);
      return (totalTime / ordersWithCompletion.length) / 1000 / 60; // in minutes
    } catch (e) {
      console.error("Error calculating avg processing time:", e);
      return 0;
    }
  }, [filteredOrders]);
  
  const isSingleDay = startDate === endDate;

  const chartData = useMemo(() => {
    try {
      if (isSingleDay) {
          const data: { [hour: number]: { revenue: number, profit: number } } = {};
          for (let i = 0; i < 24; i++) data[i] = { revenue: 0, profit: 0 };
          
          (filteredOrders || []).forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            data[hour].revenue += (order.finalTotal || 0);
            data[hour].profit += ((order.finalTotal || 0) - (order.totalCost || 0));
          });
          
          return Object.entries(data).map(([hour, values]) => ({
            hour: `${parseInt(hour).toString().padStart(2, '0')}:00`,
            Revenue: values.revenue,
            Profit: values.profit,
          }));
      } else {
          const data: { [date: string]: { revenue: number, profit: number } } = {};
          (filteredOrders || []).forEach(order => {
              const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
              if (!data[dateStr]) {
                  data[dateStr] = { revenue: 0, profit: 0 };
              }
              data[dateStr].revenue += (order.finalTotal || 0);
              data[dateStr].profit += ((order.finalTotal || 0) - (order.totalCost || 0));
          });

          return Object.entries(data).map(([date, values]) => ({
              date: new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
              Revenue: values.revenue,
              Profit: values.profit,
          })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    } catch (e) {
      console.error("Error generating chart data:", e);
      return [];
    }
  }, [filteredOrders, isSingleDay]);
  
  const paymentMethodData = useMemo(() => {
    try {
      const counts = (filteredOrders || []).reduce((acc, order) => {
        const method = order.paymentMethod || PaymentMethod.CARD;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as { [key in PaymentMethod]?: number });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } catch (e) {
      console.error("Error generating payment method data:", e);
      return [];
    }
  }, [filteredOrders]);

  const salesByItemData = useMemo(() => {
    try {
      const itemStats: { [name: string]: { revenue: number, quantity: number } } = {};
      (filteredOrders || []).forEach(order => {
        (order.items || []).forEach(item => {
          const name = item.drink?.name || 'Unknown Item';
          if (!itemStats[name]) {
            itemStats[name] = { revenue: 0, quantity: 0 };
          }
          itemStats[name].revenue += (item.finalPrice || 0);
          itemStats[name].quantity += (item.quantity || 0);
        });
      });
      return Object.entries(itemStats)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 items
    } catch (e) {
      console.error("Error generating sales by item data:", e);
      return [];
    }
  }, [filteredOrders]);

  const salesByCategoryData = useMemo(() => {
    try {
      const categoryStats: { [category: string]: { revenue: number, quantity: number } } = {};
      (filteredOrders || []).forEach(order => {
        (order.items || []).forEach(item => {
          const category = item.drink?.category || 'Uncategorized';
          if (!categoryStats[category]) {
            categoryStats[category] = { revenue: 0, quantity: 0 };
          }
          categoryStats[category].revenue += (item.finalPrice || 0);
          categoryStats[category].quantity += (item.quantity || 0);
        });
      });
      return Object.entries(categoryStats)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.revenue - a.revenue);
    } catch (e) {
      console.error("Error generating sales by category data:", e);
      return [];
    }
  }, [filteredOrders]);

  const COLORS = ['#78716c', '#a8a29e', '#d6d3d1', '#57534e', '#44403c', '#292524'];
  
  const tickColor = theme === 'dark' ? '#a1a1aa' : '#57534e';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5' }
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb' };

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
                    className={`p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white ${dateError ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                    className={`p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white ${dateError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    aria-label="End Date"
                />
            </div>
          </div>
          {dateError && <p className="text-red-500 text-sm font-medium">{dateError}</p>}
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
            {dateError ? (
                <ChartPlaceholder message={dateError} isError />
            ) : filteredOrders.length > 0 ? (
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
                <ChartPlaceholder message="No sales data available for the selected period." />
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">Payment Methods</h3>
            <div style={{ width: '100%', height: 300 }}>
                {dateError ? (
                    <ChartPlaceholder message={dateError} isError />
                ) : paymentMethodData.length > 0 ? (
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
                    <ChartPlaceholder message="No payment data available for the selected period." />
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">Top 10 Items by Revenue</h3>
          <div style={{ width: '100%', height: 400 }}>
            {dateError ? (
                <ChartPlaceholder message={dateError} isError />
            ) : salesByItemData.length > 0 ? (
                <ResponsiveContainer>
                    <BarChart data={salesByItemData} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis type="number" tick={{ fill: tickColor }} tickFormatter={(value) => `$${value}`} />
                    <YAxis dataKey="name" type="category" tick={{ fill: tickColor }} width={100} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#78716c" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <ChartPlaceholder message="No item sales data available." />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">Sales by Category</h3>
          <div style={{ width: '100%', height: 400 }}>
            {dateError ? (
                <ChartPlaceholder message={dateError} isError />
            ) : salesByCategoryData.length > 0 ? (
                <ResponsiveContainer>
                    <BarChart data={salesByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" tick={{ fill: tickColor }} />
                    <YAxis tick={{ fill: tickColor }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#a8a29e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <ChartPlaceholder message="No category sales data available." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
