import React, { useContext, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-stone-300 dark:text-zinc-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const FeedbackView: React.FC = () => {
    const { state } = useApp();
    
    const sortedFeedback = useMemo(() => {
        return [...(state.feedback || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [state.feedback]);

    return (
        <div className="p-8 space-y-10">
            <header className="pb-10 border-b border-stone-100 dark:border-zinc-800">
                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Customer Feedback</h2>
                <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Listen to the heartbeat of your cafe through customer voices.</p>
            </header>
            
            <div>
                {sortedFeedback.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 p-20 rounded-3xl shadow-2xl border border-stone-100 dark:border-zinc-800 text-center">
                        <div className="w-20 h-20 bg-stone-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <svg className="w-8 h-8 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                        </div>
                        <p className="text-stone-400 dark:text-zinc-500 font-serif italic text-lg">"No feedback has been submitted yet."</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {sortedFeedback.map(fb => (
                            <div key={fb.id} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <svg className="w-24 h-24 text-stone-900 dark:text-white" fill="currentColor" viewBox="0 0 32 32"><path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z"/></svg>
                                </div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <StarDisplay rating={fb.rating} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 bg-stone-50 dark:bg-zinc-800 px-3 py-1 rounded-full border border-stone-100 dark:border-zinc-700">{new Date(fb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-stone-800 dark:text-zinc-200 font-serif italic text-xl leading-relaxed tracking-tight">
                                        "{fb.message || 'No message provided.'}"
                                    </p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-stone-50 dark:border-zinc-800/50 flex justify-between items-center relative z-10">
                                    <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Customer Review</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-stone-900 dark:text-white uppercase tracking-[0.2em]">Verified</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackView;