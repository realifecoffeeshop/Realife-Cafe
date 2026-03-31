import * as React from 'react';
import { AppState, Action } from '../types';

export const AppContext = React.createContext<{ state: AppState; dispatch: React.Dispatch<Action>; firebaseUser: any | null } | undefined>(undefined);

export function useApp() {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
