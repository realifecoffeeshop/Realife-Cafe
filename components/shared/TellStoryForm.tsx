import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { submitStory } from '../../firebase/firestoreService';
import { useToast } from '../../context/ToastContext';

interface TellStoryFormProps {
    onSuccess: () => void;
}

const TellStoryForm: React.FC<TellStoryFormProps> = ({ onSuccess }) => {
    const [story, setStory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async () => {
        if (!story.trim()) {
            addToast('Please write something first', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const authorName = auth?.currentUser?.displayName || 'Anonymous';
            const authorId = auth?.currentUser?.uid || 'anonymous';
            
            await submitStory({
                text: story.trim(),
                authorName,
                authorId
            });
            
            addToast('Story shared successfully!', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error sharing story:', error);
            addToast('Failed to share story. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-stone-600 dark:text-zinc-300">
                Every cup has a story. What's yours? Share a memory, a moment of joy, or a kind word.
            </p>
            <textarea 
                rows={5} 
                placeholder="Your story here..." 
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" 
                disabled={isSubmitting}
            />
            <button 
                onClick={handleSubmit}
                disabled={!story.trim() || isSubmitting}
                className={`w-full py-2 rounded-md font-semibold transition-colors ${
                    isSubmitting 
                    ? 'bg-stone-300 cursor-not-allowed' 
                    : 'bg-[#A58D79] hover:bg-[#947D6A] text-white dark:bg-zinc-100 dark:text-zinc-800 dark:hover:bg-zinc-200'
                }`}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Story'}
            </button>
        </div>
    );
};

export default TellStoryForm;
