
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
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isGlobalLoading, setGlobalLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({ shopName: 'ایزی استاک' });

  useEffect(() => {
    const savedProvider = (localStorage.getItem('storageType') as StorageType) || 'local';
    setStorageType(savedProvider);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (DEV_MODE_UID && savedProvider === 'local') {
         console.log(`[DEV MODE] Bypassing auth and using mock user with UID: ${DEV_MODE_UID}`);
         setUser({
            id: DEV_MODE_UID,
            email: 'dev@example.com',
            displayName: 'Dev User',
            role: 'superadmin', // Dev user is always superadmin for local testing
          });
          setAuthLoading(false);
          return;
      }

      if (currentUser) {
          const dbInstance = savedProvider === 'cloud' ? FirestoreDataProvider(currentUser.uid, false) : IndexedDBDataProvider;
          const userProfile = await dbInstance.getUserProfile(currentUser.uid);
           if (userProfile) {
              setUser(userProfile);
          } else {
              // Create a profile if it doesn't exist.
              const newUserProfile: UserProfile = {
                  id: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
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
  }, [storageType]);


  useEffect(() => {
    async function initializeProvider() {
      setIsDbLoading(true);
      setGlobalLoading(true);
      let provider: DataProvider;
      
      const currentUserId = user?.id;

      if (storageType === 'cloud') {
        if (currentUserId) {
            const isSuperAdmin = user.role === 'superadmin';
            provider = FirestoreDataProvider(currentUserId, isSuperAdmin);
        } else if (!authLoading) {
            setIsDbLoading(false);
            setGlobalLoading(false);
            return;
        } else {
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
      
      setDataProvider(() => provider);
      setIsDbLoading(false);
      setGlobalLoading(false);
    }

    if (!authLoading) {
        initializeProvider();
    }
    
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
