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
        <div className="container mx-auto p-8 md:p-12 max-w-6xl space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-10 border-b border-stone-100 dark:border-zinc-800">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Birthday Calendar</h1>
                    <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Celebrating our community, one special day at a time.</p>
                </div>
                <div className="flex items-center bg-stone-50/50 dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800 p-2 shadow-inner backdrop-blur-sm">
                    <button 
                        onClick={prevMonth}
                        className="p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all text-stone-400 hover:text-stone-900 dark:hover:text-white shadow-sm hover:shadow-xl active:scale-90"
                        aria-label="Previous month"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-10 font-serif font-bold text-2xl min-w-[220px] text-center text-stone-900 dark:text-white tracking-tight italic">
                        {monthName} {year}
                    </span>
                    <button 
                        onClick={nextMonth}
                        className="p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all text-stone-400 hover:text-stone-900 dark:hover:text-white shadow-sm hover:shadow-xl active:scale-90"
                        aria-label="Next month"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-stone-100 dark:border-zinc-800 relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-200 via-stone-900 to-amber-200 dark:from-amber-900 dark:via-white dark:to-amber-900"></div>
                <div className="grid grid-cols-7 bg-stone-50/50 dark:bg-zinc-950/50 border-b border-stone-100 dark:border-zinc-800 backdrop-blur-md">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-6 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 dark:text-zinc-500">
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
                                className={`min-h-[140px] md:min-h-[180px] p-6 border-r border-b border-stone-50 dark:border-zinc-800/50 last:border-r-0 transition-all duration-500 relative group ${day ? 'hover:bg-stone-50/30 dark:hover:bg-zinc-800/10' : 'bg-stone-50/20 dark:bg-zinc-950/20'}`}
                            >
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-sm font-bold transition-all duration-300 ${isToday ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 w-8 h-8 flex items-center justify-center rounded-2xl shadow-xl scale-110' : 'text-stone-300 dark:text-zinc-700 group-hover:text-stone-900 dark:group-hover:text-white'}`}>
                                                {day}
                                            </span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {dayBirthdays.map(user => (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={user.id} 
                                                    className="text-[10px] md:text-xs p-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border border-amber-100/50 dark:border-amber-800/30 flex items-center gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default group/item"
                                                >
                                                    <span className="text-base group-hover/item:scale-125 transition-transform">🎂</span>
                                                    <span className="truncate font-serif font-bold tracking-tight">{user.name}</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="bg-amber-50/30 dark:bg-amber-900/10 p-10 rounded-[2.5rem] border border-amber-100/50 dark:border-amber-800/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <h3 className="text-2xl font-serif font-bold text-amber-900 dark:text-amber-100 mb-8 flex items-center tracking-tight">
                        <span className="mr-4 text-3xl">🎉</span> Upcoming
                    </h3>
                    <div className="space-y-6">
                        {birthdays
                            .filter(u => {
                                if (!u.bdayDate) return false;
                                const bday = u.bdayDate;
                                const today = new Date();
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
                                <div key={user.id} className="flex justify-between items-center group/row">
                                    <span className="font-serif font-bold text-stone-800 dark:text-zinc-200 text-lg group-hover/row:translate-x-2 transition-transform tracking-tight">{user.name}</span>
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30 shadow-sm">
                                        {user.bdayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))
                        }
                        {birthdays.length === 0 && <p className="text-sm text-stone-400 italic font-serif">"No birthdays yet."</p>}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-stone-50/50 dark:bg-zinc-900/50 p-10 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 shadow-inner flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-stone-200/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className="flex items-start gap-8 relative z-10">
                        <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl border border-stone-100 dark:border-zinc-700 flex-shrink-0 group-hover:rotate-6 transition-transform">
                            <span className="text-4xl">💡</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-4 tracking-tight">Staff Note</h3>
                            <p className="text-stone-400 dark:text-zinc-500 text-base leading-relaxed mb-8 font-medium italic">
                                This calendar helps us keep track of our regular customers' special days. 
                                Remember to offer a free drink to anyone celebrating their birthday today! 
                                The system automatically applies a 100% discount for logged-in users on their birthday.
                            </p>
                            <div className="flex gap-10">
                                <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                                    <div className="w-4 h-4 rounded-xl bg-stone-900 dark:bg-white mr-3 shadow-xl"></div>
                                    Today
                                </div>
                                <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                                    <div className="w-4 h-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 mr-3 shadow-xl"></div>
                                    Birthday
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BirthdaysView;
