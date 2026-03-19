import React, { useContext, useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const BirthdaysView: React.FC = () => {
    const { state } = useApp();
    const { users } = state;
    const [currentDate, setCurrentDate] = useState(new Date());

    const birthdays = useMemo(() => {
        return (users || []).filter(u => u.birthday && typeof u.birthday === 'string' && u.birthday.includes('-')).map(u => {
            const parts = u.birthday!.split('-');
            if (parts.length !== 3) return null;
            const [year, month, day] = parts.map(Number);
            if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
            return {
                ...u,
                bdayDate: new Date(year, month - 1, day)
            };
        }).filter((u): u is (User & { bdayDate: Date }) => u !== null);
    }, [users]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const calendarDays = useMemo(() => {
        const result = [];
        // Padding for first day
        for (let i = 0; i < firstDay; i++) {
            result.push(null);
        }
        // Days of the month
        for (let i = 1; i <= days; i++) {
            result.push(i);
        }
        return result;
    }, [days, firstDay]);

    const getBirthdaysForDay = (day: number) => {
        return birthdays.filter(u => {
            const bday = u.bdayDate;
            return bday.getMonth() === month && bday.getDate() === day;
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Birthday Calendar</h1>
                    <p className="text-stone-600 dark:text-zinc-400">Celebrating our community, one special day at a time.</p>
                </div>
                <div className="flex items-center bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-stone-200 dark:border-zinc-700 p-1">
                    <button 
                        onClick={prevMonth}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                        aria-label="Previous month"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-4 font-bold text-lg min-w-[140px] text-center">
                        {monthName} {year}
                    </span>
                    <button 
                        onClick={nextMonth}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                        aria-label="Next month"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-stone-200 dark:border-zinc-700">
                <div className="grid grid-cols-7 bg-stone-50 dark:bg-zinc-900/50 border-b border-stone-200 dark:border-zinc-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {calendarDays.map((day, index) => {
                        const dayBirthdays = day ? getBirthdaysForDay(day) : [];
                        const isToday = day && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                        
                        return (
                            <div 
                                key={index} 
                                className={`min-h-[100px] md:min-h-[140px] p-2 border-r border-b border-stone-100 dark:border-zinc-700/50 last:border-r-0 transition-colors ${day ? 'hover:bg-stone-50/50 dark:hover:bg-zinc-700/20' : 'bg-stone-50/30 dark:bg-zinc-900/20'}`}
                            >
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm font-semibold ${isToday ? 'bg-amber-500 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-stone-400 dark:text-zinc-500'}`}>
                                                {day}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {dayBirthdays.map(user => (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={user.id} 
                                                    className="text-[10px] md:text-xs p-1.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 flex items-center gap-1 shadow-sm"
                                                >
                                                    <span role="img" aria-label="cake">🎂</span>
                                                    <span className="truncate font-medium">{user.name}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center">
                        <span className="mr-2">🎉</span> Upcoming Birthdays
                    </h3>
                    <div className="space-y-3">
                        {birthdays
                            .filter(u => {
                                if (!u.bdayDate) return false;
                                const bday = u.bdayDate;
                                const today = new Date();
                                // Simple check for upcoming in next 30 days
                                const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                                if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
                                const diff = (bdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                                return diff >= 0 && diff <= 30;
                            })
                            .sort((a, b) => {
                                const today = new Date();
                                const bdayA = new Date(today.getFullYear(), a.bdayDate.getMonth(), a.bdayDate.getDate());
                                if (bdayA < today) bdayA.setFullYear(today.getFullYear() + 1);
                                const bdayB = new Date(today.getFullYear(), b.bdayDate.getMonth(), b.bdayDate.getDate());
                                if (bdayB < today) bdayB.setFullYear(today.getFullYear() + 1);
                                return bdayA.getTime() - bdayB.getTime();
                            })
                            .slice(0, 5)
                            .map(user => (
                                <div key={user.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-stone-800 dark:text-zinc-200">{user.name}</span>
                                    <span className="text-stone-500 dark:text-zinc-400">
                                        {user.bdayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))
                        }
                        {birthdays.length === 0 && <p className="text-sm text-stone-500 italic">No birthdays yet.</p>}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-xl border border-stone-200 dark:border-zinc-700 shadow-sm">
                    <h3 className="text-lg font-bold text-stone-800 dark:text-white mb-4 flex items-center">
                        <span className="mr-2">💡</span> Staff Note
                    </h3>
                    <p className="text-stone-600 dark:text-zinc-400 text-sm leading-relaxed">
                        This calendar helps us keep track of our regular customers' special days. 
                        Remember to offer a free drink to anyone celebrating their birthday today! 
                        The system automatically applies a 100% discount for logged-in users on their birthday.
                    </p>
                    <div className="mt-4 flex gap-4">
                        <div className="flex items-center text-xs text-stone-500">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                            Today
                        </div>
                        <div className="flex items-center text-xs text-stone-500">
                            <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 mr-2"></div>
                            Birthday
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BirthdaysView;
