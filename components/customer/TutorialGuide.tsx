import React from 'react';

interface TutorialGuideProps {
    isPulsing: boolean;
    onClick: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ isPulsing, onClick }) => {
    return (
        <button
            onClick={onClick}
            title="Start Tutorial"
            className={`fixed bottom-24 right-6 bg-stone-900 text-white dark:bg-white dark:text-stone-900 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-stone-800 dark:hover:bg-stone-100 transition-all duration-300 hover:scale-110 z-30 ${isPulsing ? 'animate-pulse-cart' : ''}`}
            aria-label="Start interactive tutorial"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
    );
};

export default TutorialGuide;
