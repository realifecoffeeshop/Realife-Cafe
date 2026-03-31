import * as React from 'react';
import ToastContainer from '../components/shared/Toast';

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  // Fix: Add optional duration property to support custom toast timeouts.
  duration?: number;
}

interface ToastContextType {
  // Fix: Update addToast signature to accept an optional options object for duration.
  addToast: (message: string, type: ToastType, options?: { duration?: number }) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Add a safety check for the React dispatcher to help diagnose issues.
  if (typeof React.useState !== 'function') {
    throw new Error('useState is not a function. This usually means multiple React instances are present.');
  }

  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  // Fix: Update addToast implementation to handle the optional duration.
  const addToast = React.useCallback((message: string, type: ToastType, options?: { duration?: number }) => {
    setToasts((prevToasts) => [...prevToasts, { id: toastId++, message, type, duration: options?.duration }]);
  }, []);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
