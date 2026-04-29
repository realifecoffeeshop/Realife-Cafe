import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

const Modal = ({ isOpen, onClose, title, children, footer, noPadding = false }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-stone-100 dark:border-zinc-800 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-10 py-5 sm:py-7 border-b border-stone-50 dark:border-zinc-800/50">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-stone-900 dark:hover:text-white transition-all transform hover:scale-110 p-2 rounded-full hover:bg-stone-50 dark:hover:bg-zinc-800"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${noPadding ? '' : 'p-6 sm:p-10'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 sm:p-8 bg-stone-50/50 dark:bg-zinc-800/30 border-t border-stone-100 dark:border-zinc-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
