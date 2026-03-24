import React, { useEffect, useState, useRef } from 'react';

interface TutorialStepProps {
    step: {
        title: string;
        content: string;
        target: string; // CSS selector for the element to highlight
        position?: 'top' | 'bottom' | 'left' | 'right';
        waitForAction?: boolean;
    };
    isLastStep: boolean;
    onNext: () => void;
    onExit: () => void;
}

const TutorialStep: React.FC<TutorialStepProps> = ({ step, isLastStep, onNext, onExit }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const targetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        let intervalId: number;

        const updatePosition = () => {
            if (targetRef.current) {
                const rect = targetRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                });
            }
        };

        const findAndSetTarget = () => {
            const targetElement = document.querySelector(step.target) as HTMLElement;
            if (targetElement) {
                targetRef.current = targetElement;
                
                // We've found the target, so we can stop searching.
                clearInterval(intervalId);

                // Set initial position. This is crucial for when the element is already in view
                // and scrollIntoView doesn't trigger a scroll event.
                updatePosition();

                // Smoothly scroll the element into view.
                // The event listeners below will handle updating the position during the scroll.
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        // Initially, try to find the element.
        findAndSetTarget();
        // If it's not found immediately (e.g., due to rendering delays), keep trying for a bit.
        intervalId = window.setInterval(findAndSetTarget, 100);

        // Add listeners to keep the highlight in sync with the page.
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // Use capture: true to catch all scroll events.

        return () => {
            // Clean up listeners and interval.
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            clearInterval(intervalId);
        };
    }, [step.target]);

    const getTooltipPosition = () => {
        if (!position.width) return { opacity: 0 }; 
        
        const offset = 10;
        const tooltipStyle: React.CSSProperties = {
            position: 'fixed',
            transform: 'translate(-50%, -50%)',
            zIndex: 1002,
        };

        switch (step.position) {
            case 'top':
                tooltipStyle.top = position.top - offset;
                tooltipStyle.left = position.left + position.width / 2;
                tooltipStyle.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                tooltipStyle.top = position.top + position.height + offset;
                tooltipStyle.left = position.left + position.width / 2;
                tooltipStyle.transform = 'translate(-50%, 0)';
                break;
            case 'left':
                tooltipStyle.top = position.top + position.height / 2;
                tooltipStyle.left = position.left - offset;
                tooltipStyle.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                tooltipStyle.top = position.top + position.height / 2;
                tooltipStyle.left = position.left + position.width + offset;
                tooltipStyle.transform = 'translate(0, -50%)';
                break;
            default:
                 tooltipStyle.top = position.top + position.height + offset;
                 tooltipStyle.left = position.left + position.width / 2;
                 tooltipStyle.transform = 'translate(-50%, 0)';
        }
        return tooltipStyle;
    };
    
    if (!position.width) return null;

    return (
        <div className="fixed inset-0 z-[1000]" aria-live="polite">
            <div className="fixed inset-0 bg-black/60" onClick={onExit}></div>
            
            <div
                className="fixed bg-transparent rounded-2xl transition-all duration-500 border-2 border-white/50 dark:border-zinc-500/50"
                style={{
                    top: position.top - 8,
                    left: position.left - 8,
                    width: position.width + 16,
                    height: position.height + 16,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                    zIndex: 1001,
                }}
            ></div>
            
            <div
                style={getTooltipPosition()}
                className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-80 text-stone-900 dark:text-white border border-stone-100 dark:border-zinc-800"
            >
                <h3 className="font-serif font-bold text-xl mb-3 tracking-tight">{step.title}</h3>
                <p className="text-sm text-stone-600 dark:text-zinc-400 mb-6 leading-relaxed">{step.content}</p>
                <div className="flex justify-between items-center">
                    <button 
                        onClick={onExit} 
                        className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white uppercase tracking-widest transition-colors"
                    >
                        Exit Tutorial
                    </button>
                    {!step.waitForAction && (
                        <button
                            onClick={onNext}
                            className="px-6 py-2 bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-full text-sm font-bold shadow-md hover:bg-stone-800 dark:hover:bg-stone-100 transition-all transform hover:scale-105"
                        >
                            {isLastStep ? 'Finish' : 'Next Step'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TutorialStep;