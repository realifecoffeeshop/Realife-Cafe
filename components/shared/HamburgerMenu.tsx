import React from 'react';
import { User, UserRole, View } from '../../types';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLinkClick: (section: string) => void;
    currentUser: User | null;
    onNavClick: (view: View) => void;
}

const MENU_ITEMS = [
    { id: 'share-picture', label: 'Share a Picture' },
    { id: 'tell-story', label: 'Tell a Story' },
    { id: 'our-team', label: 'Our Team' },
    { id: 'serve-with-us', label: 'Serve with Us' },
];

const ICONS: { [key: string]: React.ReactNode } = {
    'share-picture': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    'tell-story': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    'our-team': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    'serve-with-us': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
};

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose, onLinkClick, currentUser, onNavClick }) => {
    
    const handleLinkClick = (section: string) => {
        onLinkClick(section);
        onClose();
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div
                id="hamburger-menu"
                role="dialog"
                aria-modal="true"
                className={`fixed top-0 left-0 h-full w-[280px] sm:w-80 bg-white dark:bg-zinc-900 shadow-[0_0_40px_rgba(0,0,0,0.2)] z-[100] transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} will-change-transform`}
            >
                <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
                    <div className="flex-none flex justify-between items-center px-6 py-6 border-b border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">Menu</h2>
                        <button onClick={onClose} className="p-2 rounded-full bg-stone-50 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm" aria-label="Close menu">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <nav className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
                        <ul className="space-y-1">
                             {/* Main navigation for smaller screens */}
                            <li className="md:hidden">
                                <button onClick={() => onNavClick(View.CUSTOMER)} className="w-full flex items-center px-4 py-3.5 text-lg font-serif font-bold text-stone-900 dark:text-zinc-50 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-stone-100 dark:hover:border-zinc-700">Customer View</button>
                            </li>
                            {(currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN) && (
                                <>
                                    <li className="md:hidden">
                                        <button onClick={() => onNavClick(View.KDS)} className="w-full flex items-center px-4 py-3.5 text-lg font-serif font-bold text-stone-900 dark:text-zinc-50 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-stone-100 dark:hover:border-zinc-700">KDS</button>
                                    </li>
                                    <li className="md:hidden">
                                        <button onClick={() => onNavClick(View.BIRTHDAYS)} className="w-full flex items-center px-4 py-3.5 text-lg font-serif font-bold text-stone-900 dark:text-zinc-50 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-stone-100 dark:hover:border-zinc-700">
                                            Birthdays
                                        </button>
                                    </li>
                                </>
                            )}
                            {currentUser?.role === UserRole.ADMIN && (
                                <li className="md:hidden">
                                    <button onClick={() => onNavClick(View.ADMIN)} className="w-full flex items-center px-4 py-3.5 text-lg font-serif font-bold text-stone-900 dark:text-zinc-50 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-stone-100 dark:hover:border-zinc-700">Admin</button>
                                </li>
                            )}
                            <li className="border-b border-stone-100 dark:border-zinc-800 my-4 md:hidden"></li>
                            
                            {/* Community and info links */}
                            {MENU_ITEMS.map(item => (
                                 <li key={item.id}>
                                    <button
                                        onClick={() => handleLinkClick(item.id)}
                                        className="w-full flex items-center px-4 py-3.5 text-lg font-serif font-bold text-stone-900 dark:text-zinc-50 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all group border border-transparent hover:border-stone-100 dark:hover:border-zinc-700"
                                    >
                                        <span className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-amber-500 transition-colors">
                                            {ICONS[item.id]}
                                        </span>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        
                        {/* Footer info in menu */}
                        <div className="mt-10 pt-8 border-t border-stone-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 mb-2">Realife Coffee Shop</p>
                            <p className="text-sm text-stone-500 dark:text-zinc-400 font-serif italic leading-relaxed">Handcrafted with passion and precision.</p>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
};
export default React.memo(HamburgerMenu);