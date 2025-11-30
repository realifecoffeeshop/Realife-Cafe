import React, { useState, useContext } from 'react';
import Modal from './Modal';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const Star: React.FC<{ filled: boolean; onClick: () => void; onMouseEnter: () => void; onMouseLeave: () => void; }> = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
    <svg 
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`w-8 h-8 cursor-pointer transition-colors ${filled ? 'text-yellow-400' : 'text-stone-300 dark:text-zinc-600'}`}
        fill="currentColor" 
        viewBox="0 0 20 20" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const Feedback: React.FC = () => {
    const { dispatch } = useContext(AppContext);
    const { addToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            addToast('Please select a rating before submitting.', 'error');
            return;
        }
        dispatch({ type: 'SUBMIT_FEEDBACK', payload: { rating, message } });
        setIsOpen(false);
        setRating(0);
        setMessage('');
        addToast('Thank you for your feedback!', 'success');
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Share Feedback"
                className="fixed bottom-6 right-6 bg-[#A58D79] dark:bg-white text-white dark:text-zinc-800 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-[#947D6A] dark:hover:bg-neutral-200 transition-transform hover:scale-110"
                aria-label="Open feedback form"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Share Your Feedback" helpArticleId="kb-11">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">How was your experience?</label>
                        <div className="flex items-center space-x-1" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                    key={star}
                                    filled={(hoverRating || rating) >= star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="feedbackMessage" className="block text-sm font-medium text-stone-700 dark:text-zinc-300">Your message (optional)</label>
                        <textarea
                            id="feedbackMessage"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Tell us what you think..."
                            className="mt-1 w-full p-2 border rounded-md border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 dark:text-white"
                        />
                    </div>
                    <button type="submit" className="w-full bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors font-semibold">
                        Submit Feedback
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default Feedback;