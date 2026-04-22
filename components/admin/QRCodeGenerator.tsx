import React, { useRef, useState } from 'react';
import Logo from '../shared/Logo';

const QRCodeGenerator: React.FC = () => {
    const [tableNumber, setTableNumber] = useState('');
    
    // Generate URL that triggers fullscreen mode in Customer View
    const targetUrl = `${window.location.origin}?fullscreen=true${tableNumber ? `&table=${encodeURIComponent(tableNumber)}` : ''}`;
    
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
        <div className="p-8 space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-stone-100 dark:border-zinc-800">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Customer App QR Code</h2>
                    <p className="text-stone-400 dark:text-zinc-500 mt-2 font-medium">Generate and print QR codes for table ordering.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Table #"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="pl-4 pr-10 py-3.5 bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-4 focus:ring-stone-900/5 dark:focus:ring-white/5 focus:outline-none transition-all w-24 sm:w-32 shadow-sm font-serif italic"
                        />
                        {tableNumber && (
                             <button 
                                onClick={() => setTableNumber('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600 dark:hover:text-white transition-colors"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                             </button>
                        )}
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center space-x-3 bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-8 py-3.5 rounded-2xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all font-bold shadow-2xl hover:shadow-stone-900/20 dark:hover:shadow-white/20 active:scale-95 group whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span className="font-serif italic text-base">Print Card</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Display/Print Area */}
                <div className="flex-1 flex justify-center">
                    <div 
                        ref={printRef} 
                        className="bg-white p-16 rounded-[3rem] shadow-2xl border border-stone-100 text-center max-w-md w-full relative overflow-hidden"
                        style={{ fontFamily: 'serif' }}
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-stone-900"></div>
                        <div className="mb-12 flex justify-center grayscale opacity-90 scale-110">
                            {/* Rendering a simplified version of the logo for print stability */}
                            <svg width="240" height="60" viewBox="0 0 340 75" xmlns="http://www.w3.org/2000/svg">
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
                                <text x="80" y="48" fontFamily="serif" fontSize="48" fontWeight="bold" fill="#1c1917">realife</text>
                                <text x="82" y="70" fontFamily="sans-serif" fontSize="20" fontWeight="300" fill="#57534e" letterSpacing="6">CAFE</text>
                            </svg>
                        </div>
                        
                        <div className="flex flex-col items-center">
                             <h3 className="text-4xl font-serif font-bold text-stone-900 mb-2 tracking-tight">Scan to Order</h3>
                             {tableNumber && (
                                 <div className="bg-stone-900 text-white rounded-full px-6 py-1.5 text-sm font-bold tracking-widest uppercase mb-4 shadow-xl">
                                     Table {tableNumber}
                                 </div>
                             )}
                        </div>
                        
                        <p className="text-stone-400 mb-10 leading-relaxed text-lg font-medium italic">Skip the queue! Scan this code to view our menu and order directly from your phone.</p>
                        
                        <div className="border-[12px] border-stone-900 rounded-[2.5rem] p-6 inline-block mb-12 shadow-2xl bg-white">
                            <img src={qrCodeUrl} alt="Scan to Order" className="w-64 h-64 object-contain" />
                        </div>
                        
                        <div className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em] mt-6 border-t border-stone-50 pt-6">
                            <p>No app download required.</p>
                        </div>
                    </div>
                </div>

                {/* Instructions Side */}
                <div className="flex-1 bg-stone-50/50 dark:bg-zinc-900/50 p-12 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 shadow-inner">
                    <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-10 tracking-tight">Table QR Codes</h3>
                    <ul className="space-y-10">
                        <li className="flex items-start group">
                            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold mr-6 shadow-xl group-hover:scale-110 transition-transform font-serif italic text-lg">1</span>
                            <div className="pt-1">
                                <h4 className="font-serif font-bold text-stone-900 dark:text-white mb-2 text-lg tracking-tight">Enter Table Number</h4>
                                <p className="text-stone-400 dark:text-zinc-500 text-sm leading-relaxed font-medium">Type a table number in the box above to customize the QR code.</p>
                            </div>
                        </li>
                        <li className="flex items-start group">
                            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold mr-6 shadow-xl group-hover:scale-110 transition-transform font-serif italic text-lg">2</span>
                            <div className="pt-1">
                                <h4 className="font-serif font-bold text-stone-900 dark:text-white mb-2 text-lg tracking-tight">Print and Place</h4>
                                <p className="text-stone-400 dark:text-zinc-500 text-sm leading-relaxed font-medium">Print the card and place it on the corresponding table.</p>
                            </div>
                        </li>
                        <li className="flex items-start group">
                            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold mr-6 shadow-xl group-hover:scale-110 transition-transform font-serif italic text-lg">3</span>
                            <div className="pt-1">
                                <h4 className="font-serif font-bold text-stone-900 dark:text-white mb-2 text-lg tracking-tight">Automatic Table Info</h4>
                                <p className="text-stone-400 dark:text-zinc-500 text-sm leading-relaxed font-medium">When scanned, the table number is automatically pre-filled in the customer's order.</p>
                            </div>
                        </li>
                        <li className="flex items-start group">
                            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold mr-6 shadow-xl group-hover:scale-110 transition-transform font-serif italic text-lg">4</span>
                            <div className="pt-1">
                                <h4 className="font-serif font-bold text-stone-900 dark:text-white mb-2 text-lg tracking-tight">KDS Visibility</h4>
                                <p className="text-stone-400 dark:text-zinc-500 text-sm leading-relaxed font-medium">The table number will be prominently displayed on the Kitchen Display System (KDS) tickets.</p>
                            </div>
                        </li>
                    </ul>
                    
                    <div className="mt-12 p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100/50 dark:border-amber-900/20 shadow-sm">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <span className="font-serif font-bold text-amber-900 dark:text-amber-200 text-base tracking-tight">Pro Tip</span>
                        </div>
                        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-medium italic">
                            For permanent table setups, we recommend laminating your printed QR cards or using clear acrylic table-top holders.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
