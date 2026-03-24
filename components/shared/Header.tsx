import React, { useContext, useState, memo } from 'react';
import { View, UserRole } from '../../types';
import { useApp } from '../../context/useApp';
import Logo from './Logo';
import HamburgerMenu from './HamburgerMenu';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onLoginClick: () => void;
  onMenuLinkClick: (section: string) => void;
}

const NavButton: React.FC<{ view: View; currentView: View; setView: (view: View) => void; children: React.ReactNode }> = memo(({ view, currentView, setView, children }) => (
  <button
    onClick={() => setView(view)}
    className={`px-5 py-2 text-sm font-bold rounded-full transition-all tracking-wide uppercase ${
      currentView === view
        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm'
        : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-zinc-800'
    }`}
  >
    {children}
  </button>
));

const Header: React.FC<HeaderProps> = ({ currentView, setView, onLoginClick, onMenuLinkClick }) => {
  const { state, dispatch } = useApp();
  const { currentUser, theme } = state;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setView(View.CUSTOMER);
  };
  
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  return (
    <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-stone-800 dark:text-zinc-200 sticky top-0 z-40 border-b border-stone-100 dark:border-zinc-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-full text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 md:hidden transition-all"
                aria-label="Open menu"
                aria-controls="hamburger-menu"
                aria-expanded={isMenuOpen}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <Logo />
        </div>
        <div className="hidden md:flex items-center space-x-1">
            <NavButton view={View.CUSTOMER} currentView={currentView} setView={setView}>Menu</NavButton>
            {(currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN) && (
                <>
                    <NavButton view={View.KDS} currentView={currentView} setView={setView}>KDS</NavButton>
                    <NavButton view={View.BIRTHDAYS} currentView={currentView} setView={setView}>Birthdays</NavButton>
                </>
            )}
            {currentUser?.role === UserRole.ADMIN && (
                <NavButton view={View.ADMIN} currentView={currentView} setView={setView}>Admin</NavButton>
            )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleThemeToggle}
            className="p-2.5 rounded-full text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>
          <div className="border-l border-stone-100 dark:border-zinc-800 h-6"></div>
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView(View.PROFILE)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    currentView === View.PROFILE 
                    ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white' 
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.name.charAt(0)}
                </div>
                <span className="text-sm font-bold hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-6 py-2.5 bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-sm text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
      <HamburgerMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLinkClick={onMenuLinkClick}
        currentUser={currentUser}
        onNavClick={(view) => {
            setView(view);
            setIsMenuOpen(false);
        }}
      />
    </header>
  );
};

export default memo(Header);
