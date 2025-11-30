import React, { useRef } from 'react';
import Logo from '../shared/Logo';

const QRCodeGenerator: React.FC = () => {
    // Generate URL that triggers fullscreen mode in Customer View
    const targetUrl = `${window.location.origin}?fullscreen=true`;
    
    // Using a reliable public API for QR code generation to avoid npm dependencies in this environment
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;
    
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const printArea = printContent.innerHTML;

        document.body.innerHTML = printArea;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reload to restore event listeners/React state
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Customer App QR Code</h2>
                <button 
                    onClick={handlePrint}
                    className="flex items-center space-x-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 px-4 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors font-semibold shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print QR Code</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Display/Print Area */}
                <div className="flex-1 flex justify-center">
                    <div 
                        ref={printRef} 
                        className="bg-white p-12 rounded-xl shadow-lg border border-stone-200 text-center max-w-md w-full"
                        style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                        <div className="mb-6 flex justify-center grayscale">
                            {/* Rendering a simplified version of the logo for print stability */}
                            <svg width="200" height="50" viewBox="0 0 340 75" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <path id="p-t1" d="M 0 0 L 34 34 L 0 34 Z" />
                                    <path id="p-t2" d="M 0 0 L 34 0 L 34 34 Z" />
                                </defs>
                                <g transform="translate(1,1)">
                                    <rect width="68" height="68" rx="14" fill="#1c1917" />
                                    <g fill="#ffffff">
                                        <use href="#p-t1" transform="translate(0, 0)" />
                                        <use href="#p-t2" transform="translate(34, 0) scale(-1, 1)" />
                                        <use href="#p-t1" transform="translate(0, 34) scale(1, -1)" />
                                        <use href="#p-t2" transform="translate(34, 34) scale(-1, -1)" />
                                    </g>
                                </g>
                                <text x="80" y="48" fontFamily="sans-serif" fontSize="48" fontWeight="bold" fill="#1c1917">realife</text>
                                <text x="82" y="70" fontFamily="sans-serif" fontSize="20" fontWeight="300" fill="#57534e" letterSpacing="6">CAFE</text>
                            </svg>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-stone-900 mb-2">Scan to Order</h3>
                        <p className="text-stone-600 mb-6">Skip the queue! Scan this code to view our menu and order directly from your phone.</p>
                        
                        <div className="border-4 border-stone-900 rounded-lg p-2 inline-block mb-6">
                            <img src={qrCodeUrl} alt="Scan to Order" className="w-64 h-64 object-contain" />
                        </div>
                        
                        <div className="text-sm text-stone-400 mt-4">
                            <p>No app download required.</p>
                        </div>
                    </div>
                </div>

                {/* Instructions Side */}
                <div className="flex-1 bg-stone-50 dark:bg-zinc-800 p-6 rounded-xl border border-stone-200 dark:border-zinc-700">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4">How it works</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start">
                            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#A58D79] text-white font-bold mr-3">1</span>
                            <p className="text-stone-700 dark:text-zinc-300 pt-1">Print the QR code card on the left.</p>
                        </li>
                        <li className="flex items-start">
                            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#A58D79] text-white font-bold mr-3">2</span>
                            <p className="text-stone-700 dark:text-zinc-300 pt-1">Place it on tables or at the counter.</p>
                        </li>
                        <li className="flex items-start">
                            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#A58D79] text-white font-bold mr-3">3</span>
                            <p className="text-stone-700 dark:text-zinc-300 pt-1">Customers scan the code with their camera.</p>
                        </li>
                        <li className="flex items-start">
                            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#A58D79] text-white font-bold mr-3">4</span>
                            <p className="text-stone-700 dark:text-zinc-300 pt-1">The app opens in <strong>Full Screen Mode</strong> for an immersive ordering experience.</p>
                        </li>
                    </ul>
                    
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> The generated QR code appends <code>?fullscreen=true</code> to your URL. This triggers a "Tap to Start" screen for customers, ensuring the app enters full-screen mode immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeGenerator;