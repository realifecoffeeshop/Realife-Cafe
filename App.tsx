import React, { useState, useContext, useEffect, ReactNode, Suspense, lazy } from 'react';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { ToastProvider, useToast } from './context/ToastContext';
import { View, UserRole } from './types';
import Header from './components/shared/Header';
import Feedback from './components/shared/Feedback';
import Modal from './components/shared/Modal';
import SharePictureForm from './components/shared/SharePictureForm';
import TellStoryForm from './components/shared/TellStoryForm';
import { isFirebaseConfigured } from './firebase/config';

import CustomerView from './components/customer/CustomerView';
const KDSView = lazy(() => import('./components/kds/KDSView'));
const AdminView = lazy(() => import('./components/admin/AdminView'));
const ProfileView = lazy(() => import('./components/customer/ProfileView'));
const BirthdaysView = lazy(() => import('./components/shared/BirthdaysView'));
const LoginModal = lazy(() => import('./components/customer/LoginModal'));
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

const FirebasePermissionErrorBanner: React.FC<{ message: string, onDismiss: () => void }> = ({ message, onDismiss }) => (
    <div className="bg-red-100 dark:bg-red-900 border-b-2 border-red-500 dark:border-red-600 p-3 text-center text-sm text-red-800 dark:text-red-200 relative" role="alert">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
            <div className="flex-shrink-0">
                 <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3 text-left">
                <p>
                    <strong className="font-bold">Firebase Error:</strong> {message} For a quick fix, you can set your rules to be public. In Firebase Console &gt; Realtime Database &gt; Rules, use:
                    <code className="bg-red-200 dark:bg-red-800/50 rounded p-1 mx-1 text-xs font-mono select-all">
                        {`{ "rules": { ".read": true, ".write": true } }`}
                    </code>
                     (Note: This is insecure for production apps).
                </p>
            </div>
        </div>
        <button onClick={onDismiss} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50" aria-label="Dismiss">
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
    fallback={
      <div className="p-12 text-center bg-white dark:bg-zinc-800 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-700 m-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">View Error</h3>
        <p className="text-stone-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
          There was a problem loading the <span className="font-semibold">{viewName}</span>. 
          This might be a temporary issue. Please try refreshing the page.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#A58D79] hover:bg-[#947D6A] text-white px-6 py-2 rounded-full transition-colors font-semibold"
        >
          Refresh Page
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

const AppContent: React.FC = () => {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const { currentUser, theme, permissionError } = state;
  const [currentView, setCurrentView] = useState<View>(View.CUSTOMER);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: ReactNode } | null>(null);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
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
        case 'serve-with-us':
            setInfoModalContent({
                title: 'Serve With Us',
                content: <p className="text-stone-600 dark:text-zinc-300">Interested in joining the Realife Cafe family? We're always looking for enthusiastic people to help us spread warmth and great coffee. Contact us at careers@realifecafe.com.</p>
            });
            break;
    }
  };
  
  const renderCurrentView = () => {
    switch (currentView) {
      case View.CUSTOMER:
        return (
          <ViewErrorBoundary viewName="Menu">
            <CustomerView />
          </ViewErrorBoundary>
        );
      case View.KDS:
        return currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN ? (
          <ViewErrorBoundary viewName="Kitchen Display">
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
          <ViewErrorBoundary viewName="Birthdays">
            <Suspense fallback={<LoadingSpinner />}>
              <BirthdaysView />
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
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F5F3EF] dark:bg-zinc-900 transition-colors duration-300">
      {!isFirebaseConfigured && <FirebaseWarningBanner />}
      {permissionError && (
          <FirebasePermissionErrorBanner 
              message={permissionError} 
              onDismiss={() => dispatch({ type: 'SET_PERMISSION_ERROR', payload: null })} 
          />
      )}
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
        onLoginClick={() => setIsLoginModalOpen(true)}
        onMenuLinkClick={handleMenuLinkClick}
      />
      <main className="flex-grow">
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
    <ErrorBoundary>
      <ToastProvider>
          <AppProvider>
              <AppContent />
          </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;