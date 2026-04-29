import React, { useContext, useState, useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { User, SundayRoster, CalendarNote, UserRole } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Trash2, Calendar as CalendarIcon, Users, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveCalendarNote, deleteCalendarNote } from '../../firebase/firestoreService';

const COLORS = [
    { id: 'stone', bg: 'bg-stone-500', text: 'text-stone-900', border: 'border-stone-200' },
    { id: 'amber', bg: 'bg-amber-500', text: 'text-amber-900', border: 'border-amber-200' },
    { id: 'blue', bg: 'bg-blue-500', text: 'text-blue-900', border: 'border-blue-200' },
    { id: 'green', bg: 'bg-green-500', text: 'text-green-900', border: 'border-green-200' },
    { id: 'red', bg: 'bg-red-500', text: 'text-red-900', border: 'border-red-200' }
] as const;

const STAFF_PALETTE = [
    'bg-blue-700 text-white border-blue-800 dark:bg-blue-600 dark:border-blue-700',
    'bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-600 dark:border-emerald-700',
    'bg-rose-700 text-white border-rose-800 dark:bg-rose-600 dark:border-rose-700',
    'bg-amber-700 text-white border-amber-800 dark:bg-amber-600 dark:border-amber-700',
    'bg-indigo-700 text-white border-indigo-800 dark:bg-indigo-600 dark:border-indigo-700',
    'bg-purple-700 text-white border-purple-800 dark:bg-purple-600 dark:border-purple-700',
    'bg-teal-700 text-white border-teal-800 dark:bg-teal-600 dark:border-teal-700',
    'bg-orange-700 text-white border-orange-800 dark:bg-orange-600 dark:border-orange-700',
];

const getStaffColorClass = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return STAFF_PALETTE[Math.abs(hash) % STAFF_PALETTE.length];
};

const CalendarView: React.FC = () => {
    const { state } = useApp();
    const { users, rosters, calendarNotes, currentUser } = state;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showNoteModal, setShowNoteModal] = useState<number | null>(null);
    const [selectedDayDetail, setSelectedDayDetail] = useState<number | null>(null);
    const [noteText, setNoteText] = useState('');
    const [noteColor, setNoteColor] = useState<CalendarNote['color']>('stone');
    const [isSavingNote, setIsSavingNote] = useState(false);

    const isAdmin = currentUser?.role === UserRole.ADMIN;

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

    const getNotesForDay = (day: number) => {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarNotes.filter(n => n.date === dStr);
    };

    const getRosterForDay = (day: number) => {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return rosters.find(r => r.date === dStr && (r.isPublished || r.isMonthPublished));
    };

    const handleSaveNote = async () => {
        if (!showNoteModal || !noteText.trim()) return;
        setIsSavingNote(true);
        try {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(showNoteModal).padStart(2, '0')}`;
            await saveCalendarNote({
                date: dStr,
                text: noteText,
                color: noteColor,
                createdBy: currentUser?.name || 'Unknown',
                createdAt: Date.now()
            });
            setNoteText('');
            setShowNoteModal(null);
        } catch (err) {
            console.error("Failed to save note", err);
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return;
        try {
            await deleteCalendarNote(id);
        } catch (err) {
            console.error("Failed to delete note", err);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-6xl space-y-8 sm:space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-stone-100 dark:border-zinc-800">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight text-shadow-sm">Calendar</h1>
                    <p className="text-sm sm:text-base text-stone-400 dark:text-zinc-500 mt-1 sm:mt-2 font-medium">Schedule events, notes, and team roster.</p>
                </div>
                <div className="flex items-center justify-between w-full md:w-auto bg-stone-50/50 dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800 p-1.5 sm:p-2 shadow-inner backdrop-blur-sm">
                    <button 
                        onClick={prevMonth}
                        className="p-2 sm:p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all text-stone-400 hover:text-stone-900 dark:hover:text-white shadow-sm"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="px-4 sm:px-10 font-serif font-bold text-lg sm:text-2xl min-w-[140px] sm:min-w-[220px] text-center text-stone-900 dark:text-white tracking-tight italic">
                        {monthName} {year}
                    </span>
                    <button 
                        onClick={nextMonth}
                        className="p-2 sm:p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all text-stone-400 hover:text-stone-900 dark:hover:text-white shadow-sm"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-[3rem] shadow-xl overflow-hidden border border-stone-100 dark:border-zinc-800 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-stone-900 to-amber-200 dark:from-amber-900 dark:via-white dark:to-amber-900"></div>
                <div className="grid grid-cols-7 bg-stone-50/50 dark:bg-zinc-950/50 border-b border-stone-100 dark:border-zinc-800 backdrop-blur-md">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                        <div key={index} className="py-3 sm:py-6 text-center text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-stone-400 dark:text-zinc-500">
                            <span className="sm:hidden">{day.charAt(0)}</span>
                            <span className="hidden sm:inline">{day}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {calendarDays.map((day, index) => {
                        const dayBirthdays = day ? getBirthdaysForDay(day) : [];
                        const dayNotes = day ? getNotesForDay(day) : [];
                        const dayRoster = day ? getRosterForDay(day) : null;
                        const isToday = day && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                        
                        return (
                            <div 
                                key={index} 
                                onClick={() => day && setSelectedDayDetail(day)}
                                className={`min-h-[90px] sm:min-h-[140px] md:min-h-[200px] p-1.5 sm:p-4 border-r border-b border-stone-50 dark:border-zinc-800/50 last:border-r-0 transition-all duration-300 relative group cursor-pointer ${day ? 'hover:bg-stone-50/50 dark:hover:bg-zinc-800/20' : 'bg-stone-50/10 dark:bg-zinc-950/20'}`}
                            >
                                {day && (
                                    <>
                                        <div className="flex justify-between items-center mb-1 sm:mb-4">
                                            <span className={`text-[10px] sm:text-sm font-bold transition-all duration-300 ${isToday ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-2xl shadow-lg scale-110' : 'text-stone-300 dark:text-zinc-700 group-hover:text-stone-900 dark:group-hover:text-white'}`}>
                                                {day}
                                            </span>
                                            {isAdmin && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowNoteModal(day); }}
                                                    className="p-1 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md transition-all text-stone-300 hover:text-stone-900 opacity-0 group-hover:opacity-100 hidden sm:block"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-0.5 sm:space-y-1 overflow-visible">
                                            {/* Indicators for mobile if many items */}
                                            {dayRoster && (
                                                <div className="flex flex-col gap-0.5">
                                                    {dayRoster.assignments.map((assignment) => (
                                                        <div 
                                                            key={assignment.userId}
                                                            className={`px-1 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[7px] sm:text-[10px] font-bold border truncate shadow-sm transition-transform hover:scale-[1.02] ${getStaffColorClass(assignment.userId)}`}
                                                            title={assignment.userName}
                                                        >
                                                            <span className="font-serif italic">{assignment.userName.split(' ')[0]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {dayNotes.length > 0 && (
                                                <div className="flex flex-col gap-1">
                                                    {dayNotes.slice(0, 2).map(note => (
                                                        <div key={note.id} className={`p-1 sm:p-2 rounded-lg sm:rounded-xl border shadow-sm ${
                                                            note.color === 'stone' ? 'bg-stone-100 dark:bg-stone-900/50 border-stone-200' :
                                                            'bg-amber-100 dark:bg-amber-900/50 border-amber-200'
                                                        }`}>
                                                            <div className="hidden sm:block text-[9px] leading-tight truncate">{note.text}</div>
                                                            <div className="sm:hidden flex justify-center">
                                                                <MessageSquare size={8} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {dayNotes.length > 2 && <div className="text-[8px] text-center text-stone-400 hidden sm:block">+{dayNotes.length - 2} more</div>}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {selectedDayDetail && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
                        onClick={() => setSelectedDayDetail(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-white leading-tight">
                                        {monthName} {selectedDayDetail}
                                    </h3>
                                    <p className="text-sm text-stone-400 dark:text-zinc-500 font-medium">{year}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedDayDetail(null)}
                                    className="p-3 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                                {/* Roster Section */}
                                {getRosterForDay(selectedDayDetail) && (
                                    <section className="space-y-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                            <Users size={12} /> Team Roster
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {getRosterForDay(selectedDayDetail)!.assignments.map(a => (
                                                <div key={a.userId} className={`p-4 rounded-2xl border flex flex-col shadow-sm ${getStaffColorClass(a.userId)}`}>
                                                  <span className="text-xs font-bold font-serif italic mb-1">{a.userName}</span>
                                                  <span className="text-[10px] uppercase tracking-widest opacity-80">{a.role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Notes Section */}
                                {getNotesForDay(selectedDayDetail).length > 0 && (
                                    <section className="space-y-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                            <MessageSquare size={12} /> Calendar Notes
                                        </h4>
                                        <div className="space-y-2">
                                            {getNotesForDay(selectedDayDetail).map(note => (
                                                <div key={note.id} className={`p-5 rounded-2xl border shadow-sm relative group ${
                                                    note.color === 'stone' ? 'bg-stone-50 dark:bg-stone-900/50 border-stone-200' :
                                                    note.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/50 border-amber-200' :
                                                    note.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-200' :
                                                    note.color === 'green' ? 'bg-green-50 dark:bg-green-900/50 border-green-200' :
                                                    'bg-red-50 dark:bg-red-900/50 border-red-200'
                                                }`}>
                                                    <p className="text-stone-800 dark:text-zinc-200 font-serif italic text-base leading-relaxed pr-8">{note.text}</p>
                                                    <div className="mt-3 flex justify-between items-center">
                                                        <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Posted by {note.createdBy}</span>
                                                        {isAdmin && (
                                                            <button 
                                                                onClick={(e) => handleDeleteNote(note.id, e)}
                                                                className="text-stone-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Birthdays Section */}
                                {getBirthdaysForDay(selectedDayDetail).length > 0 && (
                                    <section className="space-y-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                            🎂 Celebrate Today
                                        </h4>
                                        <div className="space-y-2">
                                            {getBirthdaysForDay(selectedDayDetail).map(user => (
                                                <div key={user.id} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex items-center justify-between shadow-sm">
                                                    <span className="font-serif font-bold text-amber-900 dark:text-amber-100 text-lg">{user.name}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-amber-100">Birthday</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {isAdmin && (
                                <div className="mt-8 pt-6 border-t border-stone-100 dark:border-zinc-800">
                                    <button 
                                        onClick={() => {
                                            setShowNoteModal(selectedDayDetail);
                                            setSelectedDayDetail(null);
                                        }}
                                        className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-5 rounded-[2rem] font-serif font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 px-8 whitespace-nowrap"
                                    >
                                        <Plus size={20} />
                                        <span>Pin to Calendar</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {showNoteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
                        onClick={() => setShowNoteModal(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Add Note</h3>
                                <button 
                                    onClick={() => setShowNoteModal(null)}
                                    className="p-2 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Message</label>
                                    <textarea 
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="What's happening on this day?"
                                        className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-3xl p-6 min-h-[120px] outline-none focus:ring-4 focus:ring-stone-200 dark:focus:ring-white/10 transition-all font-serif italic text-stone-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Banner Color</label>
                                    <div className="flex gap-4">
                                        {COLORS.map(color => (
                                            <button
                                                key={color.id}
                                                onClick={() => setNoteColor(color.id as any)}
                                                className={`w-10 h-10 rounded-2xl transition-all border-4 ${color.bg} ${noteColor === color.id ? 'border-[#A58D79] scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                    <button
                                    onClick={handleSaveNote}
                                    disabled={!noteText.trim() || isSavingNote}
                                    className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-5 px-8 rounded-[2rem] font-serif font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 tracking-tight whitespace-nowrap"
                                >
                                    {isSavingNote ? 'Saving...' : 'Pin to Calendar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-4 tracking-tight">Staff & Community</h3>
                            <p className="text-stone-400 dark:text-zinc-500 text-base leading-relaxed mb-8 font-medium italic">
                                This calendar tracks staff rosters, events, and customer milestones.
                                Rostered team members are highlighted with individual colored banners for clarity.
                                Remember to celebrate birthdays with a free drink!
                            </p>
                            <div className="flex flex-wrap gap-8">
                                <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                                    <div className="w-4 h-4 rounded-xl bg-stone-900 dark:bg-white mr-3 shadow-xl"></div>
                                    Current Day
                                </div>
                                <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                                    <div className="w-4 h-4 rounded-lg bg-indigo-600 mr-3 shadow-xl"></div>
                                    Team Roster
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

export default CalendarView;
