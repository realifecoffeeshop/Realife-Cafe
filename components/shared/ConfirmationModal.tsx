import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
    : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 shadow-lg shadow-stone-900/20 dark:shadow-white/10';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-8">
        <p className="text-lg font-serif italic text-stone-600 dark:text-zinc-400 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-10 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 font-serif italic disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
          >
            {isLoading ? 'Processing...' : confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;