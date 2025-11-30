import React, { useEffect } from 'react';
import { ToastMessage } from '../../context/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    // Fix: Use the provided duration for the toast, or default to 3000ms.
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 3000); // Auto-dismiss after custom duration or 3 seconds

    return () => {
      clearTimeout(timer);
    };
    // Fix: Add toast.duration to the dependency array.
  }, [toast.id, onClose, toast.duration]);

  const typeClasses = {
    success: 'bg-green-100 dark:bg-green-800 border-green-500 dark:border-green-600 text-green-700 dark:text-green-200',
    error: 'bg-red-100 dark:bg-red-800 border-red-500 dark:border-red-600 text-red-700 dark:text-red-200',
    info: 'bg-blue-100 dark:bg-blue-800 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-200',
  };
  
  const Icon = ({ type }: { type: 'success' | 'error' | 'info' }) => {
    switch (type) {
      case 'success':
        return <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
      case 'error':
        return <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
      case 'info':
        return <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center p-4 mb-4 rounded-lg shadow-lg border-l-4 ${typeClasses[toast.type]}`} role="alert">
      <Icon type={toast.type} />
      <div className="ml-3 text-sm font-medium">
        {toast.message}
      </div>
      <button 
        onClick={() => onClose(toast.id)} 
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-xs">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
