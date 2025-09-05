'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndexedDBDataProvider } from '@/lib/db-indexeddb';
import { FirestoreDataProvider } from '@/lib/db-firestore';
import { createFirebaseApp } from '@/lib/firebase';
import type { DataProvider } from '@/lib/dataprovider';
import { getAuth, User } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

export type StorageType = 'local' | 'cloud';

interface AppContextValue {
  db: DataProvider | null;
  isLoading: boolean;
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
  storageType: StorageType;
  changeStorageType: (newType: StorageType) => void;
  user: User | null | undefined;
  authLoading: boolean;
  auth: ReturnType<typeof getAuth>;
}

const AppContext = React.createContext<AppContextValue | null>(null);

const app = createFirebaseApp();
const auth = getAuth(app);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isGlobalLoading, setGlobalLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    const savedProvider = (localStorage.getItem('storageType') as StorageType) || 'local';
    setStorageType(savedProvider);
  }, []);

  useEffect(() => {
    async function initializeProvider() {
      setIsDbLoading(true);
      setGlobalLoading(true);
      let provider: DataProvider;

      if (storageType === 'cloud') {
        if (user) {
            // Pass user ID to provider if needed for collection pathing
            provider = FirestoreDataProvider(user.uid);
        } else if (!authLoading) {
            // Don't initialize cloud provider if user is not logged in and auth check is complete
            setIsDbLoading(false);
            setGlobalLoading(false);
            return;
        } else {
            // Auth is still loading, wait...
            return
        }
      } else {
        provider = IndexedDBDataProvider;
      }
      
      setDataProvider(() => provider);
      setIsDbLoading(false);
      setGlobalLoading(false);
    }

    initializeProvider();
  }, [storageType, user, authLoading]);
  
  const changeStorageType = useCallback((newType: StorageType) => {
    localStorage.setItem('storageType', newType);
    setStorageType(newType);
  }, []);
  
  const isLoading = isDbLoading || authLoading;

  const contextValue = useMemo(() => ({
    db: dataProvider,
    isLoading,
    isGlobalLoading,
    setGlobalLoading,
    storageType,
    changeStorageType,
    user,
    authLoading,
    auth,
  }), [dataProvider, isLoading, isGlobalLoading, storageType, changeStorageType, user, authLoading, auth]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
