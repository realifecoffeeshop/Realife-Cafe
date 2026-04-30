import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { useToast } from './context/ToastContext';
import { View, UserRole } from './types';
import Header from './components/shared/Header';
import Feedback from './components/shared/Feedback';
import Modal from './components/shared/Modal';
import SharePictureForm from './components/shared/SharePictureForm';
import TellStoryForm from './components/shared/TellStoryForm';
import { isFirebaseConfigured, auth } from './firebase/config';
import { lazyWithRetry } from './lib/utils';

const CustomerView = lazyWithRetry(() => import('./components/customer/CustomerView'));
const KDSView = lazyWithRetry(() => import('./components/kds/KDSView'));
const AdminView = lazyWithRetry(() => import('./components/admin/AdminView'));
const ProfileView = lazyWithRetry(() => import('./components/customer/ProfileView'));
const CalendarView = lazyWithRetry(() => import('./components/shared/CalendarView'));
const LoginModal = lazyWithRetry(() => import('./components/customer/LoginModal'));
const DevMode = lazyWithRetry(() => import('./components/admin/DevMode'));

const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A58D79]"></div>
    </div>
);

const FirebaseWarningBanner: React.FC = () => (
    <div className="bg-yellow-100 dark:bg-yellow-900 border-b-2 border-yellow-400 dark:border-yellow-600 p-3 text-center text-sm text-yellow-800 dark:text-yellow-200" role="alert">
        <strong className="font-bold">Action Required:</strong> Real-time sync is off. Go to your Firebase project settings, copy the `firebaseConfig` object, and paste it into the `firebase/config.ts` file.
    </div>
);

const FirebasePermissionErrorBanner: React.FC<{ message: string, onDismiss: () => void }> = ({ message, onDismiss }) => {
    const handleRefresh = async () => {
        if (auth) {
            try {
                // Clear any corrupted local auth state
                await auth.signOut();
                localStorage.removeItem('cafe-pos-data');
            } catch (e) {
                console.warn("Sign-out failed during session refresh:", e);
            }
        }
        window.location.reload();
    };

    return (
        <div className="bg-red-50 dark:bg-zinc-900 border-b border-red-200 dark:border-zinc-800 p-2 text-center text-[10px] uppercase tracking-widest font-bold text-red-600 dark:text-red-400 relative z-50 shadow-sm" role="alert">
            <div className="flex items-center justify-center max-w-4xl mx-auto px-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{message}</span>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 rounded-full transition-all active:scale-95"
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh Session</span>
                    </button>
                </div>
            </div>
            <button 
                onClick={onDismiss} 
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors text-stone-400 hover:text-red-600" 
                aria-label="Dismiss"
            >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
    );
};

const ConnectionWarningBanner: React.FC = () => (
    <div className="bg-amber-500 text-white p-2 text-center text-xs font-medium animate-pulse" role="alert">
        <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a5 5 0 010-7.072m0 0l2.829 2.829m-4.243 4.243L3 21M5.636 5.636a9 9 0 0112.728 0m0 0l-2.829 2.829" />
            </svg>
            <span>Connection lost. Trying to reconnect...</span>
        </div>
    </div>
);

const GlobalErrorBanner: React.FC<{ error: string, onDismiss: () => void }> = ({ error, onDismiss }) => (
    <div className="bg-red-500 text-white p-3 text-center text-sm relative" role="alert">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong className="font-bold">System Error:</strong> {error}</span>
        </div>
        <button onClick={onDismiss} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded-md hover:bg-red-600" aria-label="Dismiss">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
    </div>
);

const AccessDenied: React.FC = () => (
    <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">You do not have permission to view this page. Please log in with an authorized account.</p>
    </div>
);

const ViewErrorBoundary: React.FC<{ children: React.ReactNode; viewName: string }> = ({ children, viewName }) => (
  <ErrorBoundary 
    fallback={(error: Error) => {
      const isChunkLoadError = error.name === 'ChunkLoadError' || error.message.includes('Loading chunk');
      const errorMessage = isChunkLoadError 
        ? "We had trouble loading a part of the application. This usually happens after an update." 
        : error.message || "An unexpected error occurred while loading this view.";

      return (
        <div className="p-12 text-center bg-white dark:bg-zinc-800 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-700 m-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
            {isChunkLoadError ? "Update Required" : `Error loading ${viewName}`}
          </h3>
          <p className="text-stone-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#A58D79] hover:bg-[#947D6A] text-white px-6 py-2 rounded-full transition-colors font-semibold w-full sm:w-auto"
            >
              Refresh Page
            </button>
            {import.meta.env.DEV && (
              <button 
                onClick={() => console.error(error)}
                className="text-stone-400 hover:text-stone-600 text-sm underline"
              >
                Log Error to Console
              </button>
            )}
          </div>
        </div>
      );
    }}
  >
    {children}
  </ErrorBoundary>
);


const AppContent: React.FC = () => {
  const { state, dispatch, isInitializingAuth } = useApp();
  const { addToast } = useToast();
  const { currentUser, theme, permissionError, globalError } = state;
  const [currentView, setCurrentView] = useState<View>(View.CUSTOMER);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Listen for global errors from context or other sources
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
        if (event.message.includes('Firebase')) return; // Handled by permissionError or context
        setLocalError(event.message);
    };
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
    } else {
        root.classList.remove('dark');
        root.removeAttribute('data-theme');
    }
  }, [theme]);

  const handleSetView = (view: View) => {
    // If user is not logged in, force login for protected views
    if (!currentUser && (view === View.ADMIN || view === View.KDS || view === View.PROFILE || view === View.BIRTHDAYS)) {
        setIsLoginModalOpen(true);
        return;
    }
    setCurrentView(view);
  }
  
  const handleMenuLinkClick = (section: string) => {
    // Require login for interactive community features
    if (!currentUser && (section === 'share-picture' || section === 'tell-story')) {
        setIsLoginModalOpen(true);
        addToast('Please log in to share with the community', 'info');
        return;
    }

    switch(section) {
        case 'share-picture':
            setInfoModalContent({
                title: 'Share a Picture',
                content: <SharePictureForm onSuccess={() => setInfoModalContent(null)} />
            });
            break;
        case 'tell-story':
            setInfoModalContent({
                title: 'Tell a Story',
                content: <TellStoryForm onSuccess={() => setInfoModalContent(null)} />
            });
            break;
        case 'our-team':
            setInfoModalContent({
                title: 'Our Team',
                content: <p className="text-stone-600 dark:text-zinc-300">We're a passionate group of coffee lovers, baristas, and community builders dedicated to making your day better, one cup at a time.</p>
            });
            break;
    }
  };
  
  const renderCurrentView = () => {
    if (isInitializingAuth) return null; // Safety check in sub-render
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full"
        >
          {(() => {
            switch (currentView) {
              case View.CUSTOMER:
                return (
                  <ViewErrorBoundary viewName="Menu">
                    <Suspense fallback={<LoadingSpinner />}>
                        <CustomerView />
                    </Suspense>
                  </ViewErrorBoundary>
                );
              case View.KDS:
                return currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN ? (
                  <ViewErrorBoundary viewName="KDS">
                    <Suspense fallback={<LoadingSpinner />}>
                      <KDSView />
                    </Suspense>
                  </ViewErrorBoundary>
                ) : <AccessDenied />;
              case View.ADMIN:
                return currentUser?.role === UserRole.ADMIN ? (
                  <ViewErrorBoundary viewName="Admin Dashboard">
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminView />
                    </Suspense>
                  </ViewErrorBoundary>
                ) : <AccessDenied />;
              case View.PROFILE:
                return currentUser ? (
                  <ViewErrorBoundary viewName="Profile">
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProfileView />
                    </Suspense>
                  </ViewErrorBoundary>
                ) : <AccessDenied />;
              case View.BIRTHDAYS:
                return currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN ? (
                  <ViewErrorBoundary viewName="Calendar">
                    <Suspense fallback={<LoadingSpinner />}>
                      <CalendarView />
                    </Suspense>
                  </ViewErrorBoundary>
                ) : <AccessDenied />;
              case View.DEV_MODE:
                return currentUser?.role === UserRole.ADMIN ? (
                  <ViewErrorBoundary viewName="Dev Mode">
                    <Suspense fallback={<LoadingSpinner />}>
                      <DevMode />
                    </Suspense>
                  </ViewErrorBoundary>
                ) : <AccessDenied />;
              default:
                return (
                  <ViewErrorBoundary viewName="Menu">
                    <CustomerView />
                  </ViewErrorBoundary>
                );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // If we are still figuring out who the user is (anonymous or logged in), 
  // show a global splash to prevent starting listeners before we have a UID.
  // We place this AFTER all hooks to follow the Rules of Hooks.
  // OPTIMIZATION: If we already have a hydrated currentUser from localStorage, 
  // we show the app immediately to make it feel instant.
  if (isInitializingAuth && !currentUser) {
    return (
        <div className="fixed inset-0 bg-[#F5F3EF] dark:bg-zinc-950 flex flex-col items-center justify-center p-6 z-[100]">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative mb-6 w-24 h-24 flex items-center justify-center overflow-hidden rounded-full shadow-2xl shadow-stone-200 dark:shadow-none"
                style={{ aspectRatio: '1/1' }}
            >
                <video 
                    src="https://cdn.shopify.com/videos/c/o/v/7e104c320f774533ba628ee4655a5d86.webm"
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                />
            </motion.div>
            <div className="text-center">
                <h1 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2 font-serif uppercase tracking-tighter">Realife Cafe</h1>
                <p className="text-stone-400 dark:text-stone-500 text-[10px] tracking-[0.2em] uppercase font-bold animate-pulse">Initialising Secure Session</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F5F3EF] dark:bg-zinc-900 transition-colors duration-300">
      {!isFirebaseConfigured && <FirebaseWarningBanner />}
      {!state.isConnected && <ConnectionWarningBanner />}
      {permissionError && (
          <FirebasePermissionErrorBanner 
              message={permissionError} 
              onDismiss={() => dispatch({ type: 'SET_PERMISSION_ERROR', payload: null })} 
          />
      )}
      {(globalError || localError) && (
          <GlobalErrorBanner 
              error={globalError || localError || "Unknown error"} 
              onDismiss={() => {
                  if (globalError) dispatch({ type: 'SET_GLOBAL_ERROR', payload: null });
                  if (localError) setLocalError(null);
              }} 
          />
      )}
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
        onLoginClick={() => setIsLoginModalOpen(true)}
        onMenuLinkClick={handleMenuLinkClick}
      />
      <main className="flex-grow overflow-hidden">
        {renderCurrentView()}
      </main>
      <Feedback />
      <Suspense fallback={null}>
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </Suspense>
      {infoModalContent && (
        <Modal 
            isOpen={!!infoModalContent} 
            onClose={() => setInfoModalContent(null)} 
            title={infoModalContent.title}
        >
            {infoModalContent.content}
        </Modal>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
