import React, { useContext, useMemo, useState, memo, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PaymentMethod, Order } from '../../types';
import { fetchOrdersByDateRange } from '../../firebase/firestoreService';
import { Loader2 } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; }> = memo(({ title, value }) => (
  <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    <h3 className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">{title}</h3>
    <p className="text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">{value}</p>
    <div className="mt-4 h-1 w-8 bg-stone-100 dark:bg-zinc-800 rounded-full group-hover:w-16 group-hover:bg-stone-900 dark:group-hover:bg-white transition-all duration-500"></div>
  </div>
));

const ChartPlaceholder: React.FC<{ message: string; isError?: boolean }> = memo(({ message, isError }) => (
  <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${isError ? 'text-red-500 dark:text-red-400' : 'text-stone-400 dark:text-zinc-500'}`}>
    {isError ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )}
    <p className="text-sm font-medium italic font-serif">{message}</p>
  </div>
));

const PerformanceChart: React.FC<{ 
  data: any[]; 
  isSingleDay: boolean; 
  tickColor: string; 
  tooltipStyle: any;
  dateError: string | null;
  hasOrders: boolean;
}> = memo(({ data, isSingleDay, tickColor, tooltipStyle, dateError, hasOrders }) => (
  <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-700/50">
    <h3 className="text-lg font-serif font-bold mb-6 text-stone-900 dark:text-white">Performance Overview</h3>
    <div style={{ width: '100%', height: 320 }}>
      {dateError ? (
          <ChartPlaceholder message={dateError} isError />
      ) : hasOrders ? (
          <ResponsiveContainer>
              <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.1)" />
              <XAxis dataKey={isSingleDay ? "hour" : "date"} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
              <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(113, 128, 150, 0.05)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
              <Bar dataKey="Revenue" fill="#78716c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#a8a29e" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
      ) : (
          <ChartPlaceholder message="No sales data available for the selected period." />
      )}
    </div>
  </div>
));

const PaymentMethodsChart: React.FC<{ 
  data: any[]; 
  tickColor: string; 
  tooltipStyle: any;
  dateError: string | null;
  colors: string[];
}> = memo(({ data, tickColor, tooltipStyle, dateError, colors }) => (
  <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-700/50">
      <h3 className="text-lg font-serif font-bold mb-6 text-stone-900 dark:text-white">Payment Methods</h3>
      <div style={{ width: '100%', height: 320 }}>
          {dateError ? (
              <ChartPlaceholder message={dateError} isError />
          ) : data.length > 0 ? (
              <ResponsiveContainer>
                  <PieChart>
                      <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={8}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                      >
                          {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                      </Pie>
                      <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value: number, name: string) => [`${value} orders`, name]}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
              </ResponsiveContainer>
          ) : (
              <ChartPlaceholder message="No payment data available for the selected period." />
          )}
      </div>
  </div>
));

const TopItemsChart: React.FC<{ 
  data: any[]; 
  tickColor: string; 
  tooltipStyle: any;
  dateError: string | null;
}> = memo(({ data, tickColor, tooltipStyle, dateError }) => (
  <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-700/50">
    <h3 className="text-lg font-serif font-bold mb-6 text-stone-900 dark:text-white">Top 10 Items by Revenue</h3>
    <div style={{ width: '100%', height: 400 }}>
      {dateError ? (
          <ChartPlaceholder message={dateError} isError />
      ) : data.length > 0 ? (
          <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(128, 128, 128, 0.1)" />
              <XAxis type="number" tick={{ fill: tickColor, fontSize: 11 }} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: tickColor, fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
              <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#78716c" radius={[0, 4, 4, 0]} />
              </BarChart>
          </ResponsiveContainer>
      ) : (
          <ChartPlaceholder message="No item sales data available." />
      )}
    </div>
  </div>
));

const CategorySalesChart: React.FC<{ 
  data: any[]; 
  tickColor: string; 
  tooltipStyle: any;
  dateError: string | null;
}> = memo(({ data, tickColor, tooltipStyle, dateError }) => (
  <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-zinc-700/50">
    <h3 className="text-lg font-serif font-bold mb-6 text-stone-900 dark:text-white">Sales by Category</h3>
    <div style={{ width: '100%', height: 400 }}>
      {dateError ? (
          <ChartPlaceholder message={dateError} isError />
      ) : data.length > 0 ? (
          <ResponsiveContainer>
              <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.1)" />
              <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
              <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#a8a29e" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
      ) : (
          <ChartPlaceholder message="No category sales data available." />
      )}
    </div>
  </div>
));

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const { theme } = state;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const dateError = useMemo(() => {
    if (new Date(startDate) > new Date(endDate)) {
      return "Start date cannot be after end date.";
    }
    return null;
  }, [startDate, endDate]);

  // Fetch orders for the selected date range
  useEffect(() => {
    const loadRangeData = async () => {
      if (dateError) return;
      
      setIsLoading(true);
      setFetchError(null);
      
      try {
        const startTimestamp = new Date(startDate).getTime();
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        const endTimestamp = endOfDay.getTime();
        
        const data = await fetchOrdersByDateRange(startTimestamp, endTimestamp);
        setFetchedOrders(data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setFetchError("Failed to load data for the selected range.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRangeData();
  }, [startDate, endDate, dateError]);

  const filteredOrders = useMemo(() => {
    if (dateError) return [];
    return fetchedOrders.filter(o => o.status === 'completed');
  }, [fetchedOrders, dateError]);

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
        if (!order) return;
        (order.items || []).forEach(item => {
          if (!item) return;
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
        if (!order) return;
        (order.items || []).forEach(item => {
          if (!item) return;
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
  
  const tickColor = theme === 'dark' ? '#52525b' : '#d6d3d1';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '24px', color: '#f4f4f5', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(12px)' }
    : { backgroundColor: '#ffffff', border: '1px solid #f5f5f4', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '20px' };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Business Insights</h2>
          <p className="text-stone-500 dark:text-zinc-400 mt-1">Real-time performance metrics and sales data.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-zinc-700/50">
          {isLoading && (
            <div className="flex items-center gap-2 px-2">
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            </div>
          )}
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Period</span>
          </div>
          <div className="flex items-center gap-2">
            <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`text-sm p-2 bg-stone-50 dark:bg-zinc-900 border-none rounded-lg dark:text-white focus:ring-1 focus:ring-stone-200 ${dateError ? 'text-red-500' : ''}`}
                aria-label="Start Date"
            />
            <span className="text-stone-300 dark:text-zinc-600">—</span>
            <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className={`text-sm p-2 bg-stone-50 dark:bg-zinc-900 border-none rounded-lg dark:text-white focus:ring-1 focus:ring-stone-200 ${dateError ? 'text-red-500' : ''}`}
                aria-label="End Date"
            />
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {fetchError}
        </div>
      )}

      {dateError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {dateError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard title="Total Profit" value={`$${totalProfit.toFixed(2)}`} />
        <StatCard title="Drinks Processed" value={drinksProcessed.toString()} />
        <StatCard title="Avg. Time" value={`${avgProcessingTime.toFixed(1)}m`} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart 
          data={chartData} 
          isSingleDay={isSingleDay} 
          tickColor={tickColor} 
          tooltipStyle={tooltipStyle} 
          dateError={dateError}
          hasOrders={filteredOrders.length > 0}
        />
        <PaymentMethodsChart 
          data={paymentMethodData} 
          tickColor={tickColor} 
          tooltipStyle={tooltipStyle} 
          dateError={dateError}
          colors={COLORS}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopItemsChart 
          data={salesByItemData} 
          tickColor={tickColor} 
          tooltipStyle={tooltipStyle} 
          dateError={dateError}
        />
        <CategorySalesChart 
          data={salesByCategoryData} 
          tickColor={tickColor} 
          tooltipStyle={tooltipStyle} 
          dateError={dateError}
        />
      </div>
    </div>
  );
};

export default memo(Dashboard);

