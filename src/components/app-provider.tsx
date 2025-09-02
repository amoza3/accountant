'use client';

import React from 'react';
import { useDb } from '@/hooks/use-db';

const AppContext = React.createContext<ReturnType<typeof useDb> | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const dbState = useDb();
  return <AppContext.Provider value={dbState}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
