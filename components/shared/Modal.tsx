import React, { ReactNode, useContext } from 'react';
import { AppContext } from '../../context/AppContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  helpArticleId?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, helpArticleId }) => {
  const { dispatch } = useContext(AppContext);

  if (!isOpen) return null;

  const handleHelpClick = () => {
    if (helpArticleId) {
      dispatch({ type: 'OPEN_KB_MODAL', payload: { articleId: helpArticleId } });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-zinc-700">
          <div className="flex items-center space-x-2">
            {helpArticleId && (
              <button
                onClick={handleHelpClick}
                className="p-1.5 rounded-full text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-600 hover:text-stone-700 dark:hover:text-white transition-colors"
                aria-label="Get help for this section"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold text-stone-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-600 hover:text-stone-900 dark:hover:text-white rounded-lg text-sm p-1.5"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;