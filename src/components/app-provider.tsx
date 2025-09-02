'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndexedDBDataProvider } from '@/lib/db-indexeddb';
import { FirestoreDataProvider } from '@/lib/db-firestore';
import { createFirebaseApp } from '@/lib/firebase';
import type { DataProvider } from '@/lib/dataprovider';

export type StorageType = 'local' | 'cloud';

interface AppContextValue {
  db: DataProvider | null;
  isLoading: boolean;
  storageType: StorageType;
  changeStorageType: (newType: StorageType) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Determine storage type from localStorage on mount
    const savedProvider = (localStorage.getItem('storageType') as StorageType) || 'local';
    setStorageType(savedProvider);
  }, []);

  useEffect(() => {
    async function initializeProvider() {
      setIsLoading(true);
      let provider: DataProvider;

      if (storageType === 'cloud') {
        // Ensure Firebase is initialized with the correct config before setting the provider
        await createFirebaseApp();
        provider = FirestoreDataProvider;
      } else {
        provider = IndexedDBDataProvider;
      }
      
      setDataProvider(() => provider);
      setIsLoading(false);
    }

    initializeProvider();
  }, [storageType]);
  
  const changeStorageType = useCallback((newType: StorageType) => {
    localStorage.setItem('storageType', newType);
    setStorageType(newType);
  }, []);

  const contextValue = useMemo(() => ({
    db: dataProvider,
    isLoading,
    storageType,
    changeStorageType,
  }), [dataProvider, isLoading, storageType, changeStorageType]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
