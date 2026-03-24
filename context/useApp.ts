import { createContext, useContext, Dispatch } from 'react';
import { AppState, Action } from '../types';

export const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action>; firebaseUser: any | null } | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
