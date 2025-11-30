import React from 'react';
import { User, UserRole, View } from '../../types';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLinkClick: (section: string) => void;
    currentUser: User | null;
    onNavClick: (view: View) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose, onLinkClick, currentUser, onNavClick }) => {
    
    const handleLinkClick = (section: string) => {
        onLinkClick(section);
        onClose();
    };

    const menuItems = [
        { id: 'share-picture', label: 'Share a Picture' },
        { id: 'tell-story', label: 'Tell a Story' },
        { id: 'our-team', label: 'Our Team' },
        { id: 'serve-with-us', label: 'Serve with Us' },
    ];

    const icons: { [key: string]: React.ReactNode } = {
        'share-picture': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        'tell-story': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
        'our-team': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        'serve-with-us': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
        'knowledge-base': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div
                id="hamburger-menu"
                role="dialog"
                aria-modal="true"
                className={`fixed top-0 left-0 h-full w-full max-w-xs bg-white dark:bg-zinc-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex justify-between items-center p-4 border-b dark:border-zinc-700">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Menu</h2>
                    <button onClick={onClose} className="p-2" aria-label="Close menu">
                        <svg className="w-6 h-6 text-stone-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <nav className="p-4">
                    <ul className="space-y-2">
                         {/* Main navigation for smaller screens */}
                        <li className="md:hidden">
                            <button onClick={() => onNavClick(View.CUSTOMER)} className="w-full flex items-center p-3 text-lg text-stone-700 dark:text-zinc-200 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-700">Customer View</button>
                        </li>
                        <li className="md:hidden">
                            <button onClick={() => onNavClick(View.GEMINI)} className="w-full flex items-center p-3 text-lg text-stone-700 dark:text-zinc-200 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-700">Ask Gemini</button>
                        </li>
                        {(currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN) && (
                            <li className="md:hidden">
                                <button onClick={() => onNavClick(View.KDS)} className="w-full flex items-center p-3 text-lg text-stone-700 dark:text-zinc-200 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-700">KDS</button>
                            </li>
                        )}
                        {currentUser?.role === UserRole.ADMIN && (
                            <li className="md:hidden">
                                <button onClick={() => onNavClick(View.ADMIN)} className="w-full flex items-center p-3 text-lg text-stone-700 dark:text-zinc-200 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-700">Admin</button>
                            </li>
                        )}
                        <li className="border-b dark:border-zinc-700 my-4 md:hidden"></li>
                        
                        {/* Community and info links */}
                        {menuItems.map(item => (
                             <li key={item.id}>
                                <button
                                    onClick={() => handleLinkClick(item.id)}
                                    className="w-full flex items-center p-3 text-lg text-stone-700 dark:text-zinc-200 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {icons[item.id]}
                                    {item.label}
                                </button>
                            </li>
                        ))}
                         {currentUser?.role === UserRole.ADMIN && (
                            <>
                                <li className="border-b dark:border-zinc-700 my-4"></li>
                                <li>
                                    <button
                                        onClick={() => handleLinkClick('knowledge-base')}
                                        className="w-full flex items-center p-3 text-lg text-stone-700 dark:text-zinc-200 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        {icons['knowledge-base']}
                                        Help & Knowledge Base
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </>
    );
};
export default HamburgerMenu;