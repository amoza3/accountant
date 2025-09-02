'use client';

import { initializeApp, getApp, getApps, deleteApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

let appInstance: ReturnType<typeof initializeApp> | null = null;
let currentConfig: string | null = null;

// This function now ensures that the app is initialized with the latest config from localStorage.
export const createFirebaseApp = () => {
    const firebaseConfigStr = typeof window !== 'undefined' ? localStorage.getItem('firebaseConfig') : null;
    
    // Default config as a fallback
    const defaultConfig: FirebaseOptions = {
        projectId: 'easystock-wlf7q',
        appId: '1:757179151003:web:a83f3727b9373d0b400c3e',
        storageBucket: 'easystock-wlf7q.appspot.com',
        apiKey: 'AIzaSyD2e_mFdDS8H0ltLT-W4vw57isQfPvzZz4',
        authDomain: 'easystock-wlf7q.firebaseapp.com',
        messagingSenderId: '757179151003',
    };

    const firebaseConfig = firebaseConfigStr ? JSON.parse(firebaseConfigStr) : defaultConfig;
    const newConfigStr = JSON.stringify(firebaseConfig);
    
    // If there's no instance or the config has changed, create a new app instance
    if (!appInstance || currentConfig !== newConfigStr) {
        if (appInstance) {
            // If an old instance exists, delete it before creating a new one
            deleteApp(appInstance).catch(console.error);
        }
        
        appInstance = initializeApp(firebaseConfig, `app-${Date.now()}`); // Use a unique name
        currentConfig = newConfigStr;
    }
    
    return appInstance;
};


// Note: We are creating a function to get the db and storage instances.
// This ensures that they are requested *after* createFirebaseApp has been called and the app is properly initialized.

let dbInstance: ReturnType<typeof getFirestore> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

export const getDb = () => {
    if (!appInstance) {
        createFirebaseApp();
    }
    // Use initializeFirestore to be safe against hot-reloading issues
    if (!dbInstance) {
        dbInstance = initializeFirestore(appInstance!, {
            ignoreUndefinedProperties: true
        });
    }
    return dbInstance;
}

export const getStorageInstance = () => {
    if (!appInstance) {
        createFirebaseApp();
    }
    if (!storageInstance) {
        storageInstance = getStorage(appInstance!);
    }
    return storageInstance;
}

// Exporting db and storage directly for compatibility, but encouraging getDb/getStorageInstance
export const db = getDb();
export const storage = getStorageInstance();
