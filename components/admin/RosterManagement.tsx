import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { UserRole, SundayRoster, RosterEntry, Availability } from '../../types';
import { saveRoster, saveAvailability, deleteRoster } from '../../firebase/firestoreService';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar, 
    Users, 
    UserPlus, 
    Clock, 
    Save, 
    Trash2, 
    Plus,
    Check,
    X,
    MoreHorizontal,
    Info,
    CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeamMemberLabelProps {
    name: string;
    role: UserRole;
}

const TeamMemberLabel: React.FC<TeamMemberLabelProps> = ({ name, role }) => {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' :
                role === UserRole.KITCHEN ? 'bg-blue-100 text-blue-700' :
                'bg-stone-100 text-stone-700'
            }`}>
                {name.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="font-serif font-bold text-stone-900 dark:text-white leading-tight">{name}</div>
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">{role}</div>
            </div>
        </div>
    );
};

interface RosterCellProps {
    date: string;
    isAssigned: boolean;
    avail?: Availability;
    onToggle: () => void;
    isDisabled?: boolean;
}

const RosterCell: React.FC<RosterCellProps> = ({ date, isAssigned, avail, onToggle, isDisabled }) => {
    return (
        <td className={`p-2 text-center align-middle transition-colors ${isDisabled ? 'opacity-40 grayscale' : ''}`}>
            <div className={`flex flex-row items-center justify-center gap-2 whitespace-nowrap ${isDisabled ? 'pointer-events-none' : ''}`}>
                {avail && (
                    <div 
                        className={`flex items-center justify-center w-6 h-6 rounded-lg ${
                            avail.status === 'available' ? 'bg-green-100 text-green-600' :
                            avail.status === 'unavailable' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                        }`}
                        title={avail.notes || avail.status}
                    >
                        {avail.status === 'available' ? <Check size={12} strokeWidth={3} /> :
                         avail.status === 'unavailable' ? <X size={12} strokeWidth={3} /> :
                         <Clock size={12} strokeWidth={3} />}
                    </div>
                )}
                <button
                    onClick={onToggle}
                    disabled={isDisabled}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                        isAssigned 
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-stone-900/10' 
                            : 'bg-white text-stone-300 hover:text-stone-500 border border-stone-100 hover:border-stone-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-600'
                    }`}
                >
                    <Calendar size={16} />
                </button>
            </div>
        </td>
    );
};

// Helper to get Sundays of a given month and year
const getSundaysInMonth = (year: number, month: number) => {
    const sundays = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        if (date.getDay() === 0) {
            sundays.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
    }
    return sundays;
};

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const RosterManagement: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const { users, rosters, availabilities, currentUser } = state;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSundays, setSelectedSundays] = useState<string[]>([]);
    const [isSavingBulk, setIsSavingBulk] = useState(false);
    
    const monthSundays = useMemo(() => {
        return getSundaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    }, [currentDate]);

    const activeMonthRosters = useMemo(() => {
        const sundayDates = monthSundays.map(d => formatDate(d));
        return (rosters || []).filter(r => sundayDates.includes(r.date));
    }, [rosters, monthSundays]);

    const isMonthPublished = useMemo(() => {
        return activeMonthRosters.some(r => r.isMonthPublished);
    }, [activeMonthRosters]);

    const monthAvailabilities = useMemo(() => {
        const sundayDates = monthSundays.map(d => formatDate(d));
        return availabilities.filter(a => sundayDates.includes(a.date));
    }, [availabilities, monthSundays]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddAssignment = async (date: string, userId: string, role: UserRole) => {
        if (isMonthPublished) {
            addToast("This month is published and locked. Unpublish to make changes.", "error");
            return;
        }
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const roster = rosters.find(r => r.date === date) || {
            id: '',
            date,
            assignments: [],
            isPublished: false
        };

        if ((roster.assignments || []).some(a => a.userId === userId)) {
            addToast(`${user.name} is already assigned to this Sunday.`, 'error');
            return;
        }

        const updatedRoster: SundayRoster = {
            ...roster,
            assignments: [...(roster.assignments || []), { userId, userName: user.name, role }]
        };

        try {
            await saveRoster(updatedRoster);
            dispatch({ type: 'UPDATE_ROSTER', payload: updatedRoster });
            addToast(`Assigned ${user.name} for ${date}`, 'success');
        } catch (err) {
            console.error("Failed to add assignment:", err);
            addToast("Failed to update roster", "error");
        }
    };

    const handleRemoveAssignment = async (date: string, userId: string) => {
        if (isMonthPublished) {
            addToast("This month is published and locked. Unpublish to make changes.", "error");
            return;
        }
        const roster = rosters.find(r => r.date === date);
        if (!roster) return;

        const updatedRoster: SundayRoster = {
            ...roster,
            assignments: (roster.assignments || []).filter(a => a.userId !== userId)
        };

        try {
            await saveRoster(updatedRoster);
            dispatch({ type: 'UPDATE_ROSTER', payload: updatedRoster });
        } catch (err) {
            console.error("Failed to remove assignment:", err);
            addToast("Failed to update roster", "error");
        }
    };

    const handleTogglePublish = async (rosterId: string) => {
        if (isMonthPublished) {
            addToast("Month status overrides individual rosters. Unpublish month first.", "error");
            return;
        }
        const roster = rosters.find(r => r.id === rosterId);
        if (!roster) return;

        const updatedRoster = { ...roster, isPublished: !roster.isPublished };
        try {
            await saveRoster(updatedRoster);
            dispatch({
                type: 'UPDATE_ROSTER',
                payload: updatedRoster
            });
            addToast(`Roster ${!roster.isPublished ? 'published' : 'unpublished'}`, 'success');
        } catch (err) {
            console.error("Failed to toggle publish:", err);
            addToast("Failed to update status", "error");
        }
    };

    const handleToggleMonthPublish = async () => {
        setIsSavingBulk(true);
        try {
            const newStatus = !isMonthPublished;
            const sundayDates = monthSundays.map(d => formatDate(d));
            
            // Set isMonthPublished on all roster entries for this month (even if empty)
            const promises = sundayDates.map(async (date) => {
                const existing = rosters.find(r => r.date === date);
                if (existing) {
                    await saveRoster({ ...existing, isMonthPublished: newStatus });
                } else {
                    await saveRoster({
                        id: '',
                        date,
                        assignments: [],
                        isPublished: false,
                        isMonthPublished: newStatus
                    });
                }
            });

            await Promise.all(promises);
            addToast(`Month ${newStatus ? 'Published' : 'Unpublished'} - Changes ${newStatus ? 'Locked' : 'Unlocked'}`, 'success');
        } catch (err) {
            console.error("Failed to toggle month publish", err);
            addToast("Error updating month status", "error");
        } finally {
            setIsSavingBulk(false);
        }
    };
    const [myStatus, setMyStatus] = useState<'available' | 'unavailable' | 'preference'>('available');
    const [availabilityNote, setAvailabilityNote] = useState('');

    const handleUpdateMyAvailability = async (date: string) => {
        if (!currentUser) return;
        
        const existing = availabilities.find(a => a.date === date && a.userId === currentUser.id);
        
        const newAvailability: Availability = {
            id: existing?.id || '',
            userId: currentUser.id,
            userName: currentUser.name,
            date,
            status: myStatus,
            notes: availabilityNote
        };

        try {
            await saveAvailability(newAvailability);
            dispatch({ type: 'UPDATE_AVAILABILITY', payload: newAvailability });
            if (!isSavingBulk) addToast("Your availability updated.", 'success');
        } catch (err) {
            console.error("Failed to update availability:", err);
            if (!isSavingBulk) addToast("Failed to save availability", "error");
            throw err;
        }
    };


    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Monthly Sunday Roster & Availability</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-4 font-serif font-bold text-stone-900 dark:text-white">
                        {currentDate.toLocaleString('default', { month: 'short' })}
                    </div>
                    <button 
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {/* Quick Summary View (Table) */}
            <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white">Monthly Summary</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest bg-stone-50 dark:bg-zinc-800/50 px-4 py-2 rounded-full hidden md:flex">
                            <Info size={12} />
                            Assigned Days are highlighted.
                        </div>
                        <button
                            onClick={handleToggleMonthPublish}
                            disabled={isSavingBulk}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                                isMonthPublished 
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400' 
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/10'
                            }`}
                        >
                            {isSavingBulk ? (
                                <Clock size={14} className="animate-spin" />
                            ) : isMonthPublished ? (
                                <>Unpublish Month</>
                            ) : (
                                <>Publish Month</>
                            )}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50/50 dark:bg-zinc-800/30">
                                <th className="px-8 py-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest border-r border-stone-100 dark:border-zinc-800 sticky left-0 bg-stone-50 dark:bg-zinc-800 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Team</th>
                                {monthSundays.map(sunday => (
                                    <th key={formatDate(sunday)} className="px-4 py-4 text-center min-w-[80px]">
                                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{currentDate.toLocaleString('default', { month: 'short' })}</div>
                                        <div className="text-xl font-serif font-bold text-stone-900 dark:text-white leading-none">{sunday.getDate()}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                            {users.filter(u => u.role !== UserRole.CUSTOMER).map(staff => (
                                <tr key={staff.id} className="hover:bg-stone-50/10 dark:hover:bg-zinc-800/10 group">
                                    <td className="px-8 py-4 border-r border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 sticky left-0 z-10 group-hover:bg-stone-100 dark:group-hover:bg-zinc-800 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                        <TeamMemberLabel name={staff.name} role={staff.role} />
                                    </td>
                                    {monthSundays.map(sunday => {
                                        const dateStr = formatDate(sunday);
                                        const roster = activeMonthRosters.find(r => r.date === dateStr);
                                        const isAssigned = (roster?.assignments || []).some(a => a.userId === staff.id);
                                        const avail = monthAvailabilities.find(a => a.date === dateStr && a.userId === staff.id);

                                        return (
                                            <RosterCell 
                                                key={`${staff.id}-${dateStr}`}
                                                date={dateStr}
                                                isAssigned={isAssigned}
                                                avail={avail}
                                                isDisabled={isMonthPublished}
                                                onToggle={() => {
                                                    if (isAssigned) handleRemoveAssignment(dateStr, staff.id);
                                                    else handleAddAssignment(dateStr, staff.id, staff.role);
                                                }}
                                            />
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Availability Input for Current Admin */}
            <section className="bg-stone-900 dark:bg-zinc-800 rounded-[2.5rem] p-10 border border-stone-800 dark:border-zinc-700 shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#A58D79]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                
                <div className="relative flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/5 dark:bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/10">
                            <CalendarCheck className="text-[#A58D79]" size={36} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-serif font-bold text-white tracking-tight">Your Availability</h3>
                            <p className="text-stone-400 mt-2 font-medium">Set your availability icons manually or for all Sundays.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest pl-2">Select Sundays</label>
                            <div className="flex flex-wrap gap-2 bg-zinc-800 dark:bg-zinc-900 p-2 rounded-2xl border border-white/10 min-h-[60px] min-w-[240px]">
                                {monthSundays.map(s => {
                                    const dStr = formatDate(s);
                                    const isSelected = selectedSundays.includes(dStr);
                                    return (
                                        <button
                                            key={dStr}
                                            onClick={() => {
                                                setSelectedSundays(prev => 
                                                    prev.includes(dStr) ? prev.filter(d => d !== dStr) : [...prev, dStr]
                                                );
                                            }}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold text-sm transition-all border ${
                                                isSelected 
                                                    ? 'bg-[#A58D79] border-[#A58D79] text-white shadow-lg' 
                                                    : 'bg-zinc-800/50 border-white/5 text-stone-500 hover:text-stone-300'
                                            }`}
                                        >
                                            {s.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest pl-2">Status</label>
                            <div className="flex bg-zinc-800 dark:bg-zinc-900 p-1.5 rounded-2xl border border-white/10 h-[60px]">
                                {[
                                    { id: 'available', icon: Check, color: 'bg-green-500 text-white', label: 'Available' },
                                    { id: 'unavailable', icon: X, color: 'bg-red-500 text-white', label: 'Away' },
                                    { id: 'preference', icon: Clock, color: 'bg-yellow-500 text-white', label: 'Tentative' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setMyStatus(item.id as any)}
                                        className={`flex items-center gap-2 px-4 rounded-xl transition-all ${
                                            myStatus === item.id 
                                                ? `${item.color} shadow-lg scale-105 z-10 font-bold` 
                                                : 'text-stone-500 hover:text-stone-300'
                                        }`}
                                        title={item.label}
                                    >
                                        <item.icon size={18} strokeWidth={3} />
                                        {myStatus === item.id && <span className="text-[10px] uppercase tracking-widest">{item.label}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest pl-2">Context</label>
                            <input 
                                type="text"
                                placeholder="Any details?"
                                value={availabilityNote}
                                onChange={(e) => setAvailabilityNote(e.target.value)}
                                className="px-6 py-4 bg-zinc-800 dark:bg-zinc-900 border border-white/10 rounded-2xl outline-none font-serif italic text-white focus:ring-4 focus:ring-[#A58D79]/10 transition-all w-48"
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-6">
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (selectedSundays.length === 0) return;
                                        setIsSavingBulk(true);
                                        try {
                                            await Promise.all(selectedSundays.map(date => handleUpdateMyAvailability(date)));
                                            addToast(`Availability updated for ${selectedSundays.length} days!`, 'success');
                                            setSelectedSundays([]);
                                        } catch (err) {
                                            addToast("Failed to update availability", "error");
                                        } finally {
                                            setIsSavingBulk(false);
                                        }
                                    }}
                                    disabled={selectedSundays.length === 0 || isSavingBulk}
                                    className="bg-[#A58D79] text-white px-8 py-4 rounded-2xl font-serif font-bold shadow-xl hover:bg-[#947D6A] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    Save Selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Weekly Detailed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {monthSundays.map(sunday => {
                    const dateStr = formatDate(sunday);
                    const roster = activeMonthRosters.find(r => r.date === dateStr);
                    const weekNum = Math.ceil(sunday.getDate() / 7);
                    
                    return (
                        <div key={dateStr} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 p-8 space-y-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start border-b border-stone-50 dark:border-zinc-800 pb-6">
                                <div>
                                    <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">Week {weekNum}</h4>
                                    <div className="text-3xl font-serif font-bold text-stone-900 dark:text-white leading-tight">
                                        {sunday.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => roster?.id && handleTogglePublish(roster.id)}
                                        disabled={isMonthPublished}
                                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                                            roster?.isPublished || roster?.isMonthPublished 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                                                : 'bg-stone-50 text-stone-400'
                                        }`}
                                    >
                                        {roster?.isPublished || roster?.isMonthPublished ? 'Live Roster' : 'Draft Mode'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-3xl p-8 min-h-[160px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3 text-stone-400">
                                        <Users size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Allocated Team</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {Array.from(new Set((roster?.assignments || []).map(a => a.role))).map(role => (
                                            <span key={role} className="px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-xl text-[9px] font-bold text-stone-500 dark:text-zinc-500 border border-stone-100 dark:border-zinc-800 shadow-sm">
                                                {(roster?.assignments || []).filter(a => a.role === role).length} {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {roster && (roster.assignments?.length || 0) > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {(roster.assignments || []).map(assignment => (
                                            <div 
                                                key={assignment.userId}
                                                className="group relative flex items-center gap-3 pl-4 pr-1.5 py-2 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm hover:border-red-100 transition-all"
                                            >
                                                <span className="text-xs font-serif font-bold text-stone-700 dark:text-zinc-300">{assignment.userName}</span>
                                                <button 
                                                    onClick={() => handleRemoveAssignment(dateStr, assignment.userId)}
                                                    className="p-1.5 bg-stone-50 dark:bg-zinc-800 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-stone-100 dark:border-zinc-800 rounded-[2.5rem]">
                                        <Users className="text-stone-200 mb-2" size={32} />
                                        <p className="text-xs italic text-stone-400 font-serif">No team members allocated</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RosterManagement;
