
import React, { memo } from 'react';
import CustomerDirectory from '../kds/CustomerDirectory';
import { X } from 'lucide-react';

import { Customer } from '../../types';

interface CustomerDirectoryFlyoutProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCustomer?: (customer: Customer) => void;
}

const CustomerDirectoryFlyout: React.FC<CustomerDirectoryFlyoutProps> = ({
    isOpen,
    onClose,
    onSelectCustomer,
}) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-stone-900/20 backdrop-blur-md z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Flyout Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:max-w-4xl bg-white dark:bg-zinc-800 shadow-xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="directory-heading"
            >
                <header className="flex items-center justify-between p-4 md:p-6 border-b dark:border-zinc-700 bg-white dark:bg-zinc-800 sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                        <h2 id="directory-heading" className="text-xl md:text-3xl font-serif font-bold text-stone-900 dark:text-white">Customer Directory</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white rounded-full p-2 transition-all"
                        aria-label="Close directory"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-4 md:p-8 scrollbar-hide">
                    <CustomerDirectory onSelectCustomer={onSelectCustomer} />
                </div>
            </div>
        </>
    );
};

export default memo(CustomerDirectoryFlyout);
