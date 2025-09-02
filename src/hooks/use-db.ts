'use client';

import { useState, useEffect, useCallback } from 'react';
import { IndexedDBDataProvider } from '@/lib/db-indexeddb';
import { FirestoreDataProvider } from '@/lib/db-firestore';
import type { DataProvider } from '@/lib/dataprovider';

export type StorageType = 'local' | 'cloud';

export function useDb() {
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedProvider = (localStorage.getItem('storageType') as StorageType) || 'local';
    setStorageType(savedProvider);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let provider: DataProvider;
    if (storageType === 'cloud') {
      provider = FirestoreDataProvider;
    } else {
      provider = IndexedDBDataProvider;
    }
    setDataProvider(provider);
    setIsLoading(false);
  }, [storageType]);
  
  const changeStorageType = useCallback((newType: StorageType) => {
    localStorage.setItem('storageType', newType);
    setStorageType(newType);
  }, []);

  return { db: dataProvider, isLoading, storageType, changeStorageType };
}
