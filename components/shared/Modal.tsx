import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col border border-stone-100 dark:border-zinc-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-6 border-b border-stone-50 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;