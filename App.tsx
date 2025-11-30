import React, { useState, useContext, useEffect, ReactNode } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { View, UserRole } from './types';
import Header from './components/shared/Header';
import CustomerView from './components/customer/CustomerView';
import KDSView from './components/kds/KDSView';
import AdminView from './components/admin/AdminView';
import ProfileView from './components/customer/ProfileView';
import LoginModal from './components/customer/LoginModal';
import Feedback from './components/shared/Feedback';
import Modal from './components/shared/Modal';
import KnowledgeBaseModal from './components/admin/KnowledgeBaseModal';
import { isFirebaseConfigured } from './firebase/config';
import GeminiView from './components/gemini/GeminiView';

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

const AppContent: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { currentUser, theme, isKnowledgeModalOpen, permissionError } = state;
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
    if (!currentUser && (view === View.ADMIN || view === View.KDS || view === View.PROFILE)) {
        setIsLoginModalOpen(true);
        return;
    }
    setCurrentView(view);
  }
  
  const handleMenuLinkClick = (section: string) => {
    switch(section) {
        case 'share-picture':
            setInfoModalContent({
                title: 'Share a Picture',
                content: (
                    <div>
                        <p className="text-stone-600 dark:text-zinc-300 mb-4">We'd love to see your moments at Realife Cafe! Upload a picture to share with our community.</p>
                        <input type="file" accept="image/*" className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-50 dark:file:bg-zinc-600 file:text-stone-700 dark:file:text-zinc-200 hover:file:bg-stone-100 dark:hover:file:bg-zinc-500"/>
                    </div>
                )
            });
            break;
        case 'tell-story':
            setInfoModalContent({
                title: 'Tell a Story',
                content: (
                    <div>
                        <p className="text-stone-600 dark:text-zinc-300 mb-4">Every cup has a story. What's yours? Share a memory, a moment of joy, or a kind word.</p>
                        <textarea rows={5} placeholder="Your story here..." className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" />
                        <button className="mt-4 w-full bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors font-semibold">Submit</button>
                    </div>
                )
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
        case 'knowledge-base':
            dispatch({ type: 'OPEN_KB_MODAL' });
            break;
    }
  };
  
  const renderCurrentView = () => {
    switch (currentView) {
      case View.CUSTOMER:
        return <CustomerView />;
      case View.KDS:
        return currentUser?.role === UserRole.KITCHEN || currentUser?.role === UserRole.ADMIN ? <KDSView /> : <AccessDenied />;
      case View.ADMIN:
        return currentUser?.role === UserRole.ADMIN ? <AdminView /> : <AccessDenied />;
      case View.PROFILE:
        return currentUser ? <ProfileView /> : <AccessDenied />;
      case View.GEMINI:
        return <GeminiView />;
      default:
        return <CustomerView />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3EF] dark:bg-zinc-900 transition-colors duration-300">
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
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      {infoModalContent && (
        <Modal 
            isOpen={!!infoModalContent} 
            onClose={() => setInfoModalContent(null)} 
            title={infoModalContent.title}
        >
            {infoModalContent.content}
        </Modal>
      )}
      <KnowledgeBaseModal 
        isOpen={isKnowledgeModalOpen} 
        onClose={() => dispatch({ type: 'CLOSE_KB_MODAL' })}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
        <AppProvider>
            <AppContent />
        </AppProvider>
    </ToastProvider>
  );
};

export default App;