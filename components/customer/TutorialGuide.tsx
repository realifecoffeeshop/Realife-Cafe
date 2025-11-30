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
            className={`fixed bottom-24 right-6 bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-transform hover:scale-110 z-30 ${isPulsing ? 'animate-pulse-blue' : ''}`}
            aria-label="Start interactive tutorial"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
    );
};

export default TutorialGuide;
