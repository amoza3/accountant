'use client';

import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";


const createFirebaseApp = () => {
    const firebaseConfigStr = typeof window !== 'undefined' ? localStorage.getItem('firebaseConfig') : null;
    
    const defaultConfig: FirebaseOptions = {
        projectId: 'easystock-wlf7q',
        appId: '1:757179151003:web:a83f3727b9373d0b400c3e',
        storageBucket: 'easystock-wlf7q.appspot.com',
        apiKey: 'AIzaSyD2e_mFdDS8H0ltLT-W4vw57isQfPvzZz4',
        authDomain: 'easystock-wlf7q.firebaseapp.com',
        messagingSenderId: '757179151003',
    };

    const firebaseConfig = firebaseConfigStr ? JSON.parse(firebaseConfigStr) : defaultConfig;

    if (getApps().length > 0) {
        // A hack to re-evaluate the config if it has changed.
        // This is not ideal, but works for this client-side scenario.
        const currentApp = getApp();
        const currentConfig = currentApp.options;
        if (JSON.stringify(currentConfig) !== JSON.stringify(firebaseConfig)) {
            // This is a bit of a nuclear option, but necessary if config changes.
            // In a real app, you might want to handle this more gracefully.
            return initializeApp(firebaseConfig, `app-${Date.now()}`);
        }
        return currentApp;
    } else {
       return initializeApp(firebaseConfig);
    }
};

const app = createFirebaseApp();
// Use initializeFirestore to avoid issues with hot-reloading
const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});
const storage = getStorage(app);

export { db, storage, createFirebaseApp };
