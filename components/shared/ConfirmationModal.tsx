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
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-stone-700 dark:text-zinc-300">
        <p>{message}</p>
        <div className="flex justify-end mt-6 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 text-stone-800 rounded-md hover:bg-stone-300 dark:bg-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-500 transition-colors"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#A58D79] text-white rounded-md hover:bg-[#947D6A] dark:bg-zinc-100 dark:text-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;