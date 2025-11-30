import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';

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
    const { state } = useContext(AppContext);
    
    const sortedFeedback = useMemo(() => {
        return [...state.feedback].sort((a, b) => b.createdAt - a.createdAt);
    }, [state.feedback]);

    return (
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Customer Feedback</h2>
                
                {sortedFeedback.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md text-center">
                        <p className="text-stone-500 dark:text-zinc-400">No feedback has been submitted yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedFeedback.map(fb => (
                            <div key={fb.id} className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md">
                                <div className="flex justify-between items-start">
                                    <StarDisplay rating={fb.rating} />
                                    <span className="text-xs text-stone-500 dark:text-zinc-400">{new Date(fb.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="mt-2 text-stone-700 dark:text-zinc-300 italic">"{fb.message || 'No message provided.'}"</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackView;