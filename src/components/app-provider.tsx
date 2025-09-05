
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndexedDBDataProvider } from '@/lib/db-indexeddb';
import { FirestoreDataProvider } from '@/lib/db-firestore';
import { createFirebaseApp } from '@/lib/firebase';
import type { DataProvider } from '@/lib/dataprovider';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import type { UserProfile, AppSettings } from '@/lib/types';

export type StorageType = 'local' | 'cloud';

const SUPER_ADMIN_UID = 'kTyOtB5QpjT8KPMsmejr11kAM7r1';
const DEV_MODE_UID = process.env.NEXT_PUBLIC_DEV_MODE_USER_UID;

interface AppContextValue {
  db: DataProvider | null;
  isLoading: boolean;
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
  storageType: StorageType;
  changeStorageType: (newType: StorageType) => void;
  user: UserProfile | null | undefined;
  authLoading: boolean;
  auth: ReturnType<typeof getAuth>;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

const app = createFirebaseApp();
const auth = getAuth(app);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobalLoading, setGlobalLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({ shopName: 'حسابدار آنلاین آموزا' });

  useEffect(() => {
    const savedProvider = (localStorage.getItem('storageType') as StorageType) || 'local';
    setStorageType(savedProvider);

    if (DEV_MODE_UID) {
        const devUser: UserProfile = {
           id: DEV_MODE_UID,
           email: 'dev@example.com',
           displayName: 'Dev User',
           photoURL: `https://i.pravatar.cc/150?u=${DEV_MODE_UID}`,
           role: 'superadmin',
         };
         setUser(devUser);
         setAuthLoading(false);
         return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
          const dbInstance = savedProvider === 'cloud' ? FirestoreDataProvider(currentUser.uid, false) : IndexedDBDataProvider;
          const userProfile = await dbInstance.getUserProfile(currentUser.uid);
           if (userProfile) {
              setUser(userProfile);
          } else {
              const newUserProfile: UserProfile = {
                  id: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                  role: currentUser.uid === SUPER_ADMIN_UID ? 'superadmin' : 'user'
              };
              await dbInstance.saveUserProfile(newUserProfile);
              setUser(newUserProfile);
          }
      } else {
          setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    async function initializeProvider() {
      if (authLoading) return;
      
      setIsLoading(true);

      let provider: DataProvider;
      const currentUserId = user?.id;

      if (storageType === 'cloud') {
        if (currentUserId) {
            const isSuperAdmin = user?.role === 'superadmin';
            provider = FirestoreDataProvider(currentUserId, isSuperAdmin);
        } else {
            setIsLoading(false);
            return;
        }
      } else {
        provider = IndexedDBDataProvider;
      }
      
      try {
        const appSettings = await provider.getAppSettings();
        setSettings(appSettings);
      } catch (e) {
        console.error("Failed to fetch app settings:", e);
      }
      
      setDataProvider(provider);
      setIsLoading(false);
    }

    initializeProvider();
    
  }, [storageType, user, authLoading]);
  
  const changeStorageType = useCallback((newType: StorageType) => {
    localStorage.setItem('storageType', newType);
    setStorageType(newType);
  }, []);

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
    settings,
    setSettings,
  }), [dataProvider, isLoading, isGlobalLoading, storageType, changeStorageType, user, authLoading, auth, settings]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
