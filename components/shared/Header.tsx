import React, { useContext, useState } from 'react';
import { View, UserRole } from '../../types';
import { AppContext } from '../../context/AppContext';
import Logo from './Logo';
import HamburgerMenu from './HamburgerMenu';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onLoginClick: () => void;
  onMenuLinkClick: (section: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, onLoginClick, onMenuLinkClick }) => {
  const { state, dispatch } = useContext(AppContext);
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

  const NavButton: React.FC<{ view: View; children: React.ReactNode }> = ({ view, children }) => (
    <button
      onClick={() => setView(view)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        currentView === view
          ? 'bg-stone-200 text-stone-900 dark:bg-zinc-700 dark:text-white'
          : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <header className="bg-white dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 shadow-sm border-b border-stone-200 dark:border-zinc-700">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-md text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700 md:hidden"
                aria-label="Open menu"
                aria-controls="hamburger-menu"
                aria-expanded={isMenuOpen}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <Logo />
        </div>
        <div className="hidden md:flex items-center space-x-2">
            <NavButton view={View.CUSTOMER}>Customer View</NavButton>
            <NavButton view={View.GEMINI}>Ask Gemini</NavButton>
            {(currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN) && (
                <NavButton view={View.KDS}>KDS</NavButton>
            )}
            {currentUser?.role === UserRole.ADMIN && (
                <NavButton view={View.ADMIN}>Admin</NavButton>
            )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-full text-stone-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>
          <div className="border-l border-stone-300 dark:border-zinc-600 h-6"></div>
          {currentUser ? (
            <>
              <NavButton view={View.PROFILE}>Profile</NavButton>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-medium bg-[#A58D79] text-white rounded-md hover:bg-[#947D6A] dark:bg-zinc-100 dark:text-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Login / Register
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

export default Header;