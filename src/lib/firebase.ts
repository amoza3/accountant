'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'easystock-wlf7q',
  appId: '1:757179151003:web:a83f3727b9373d0b400c3e',
  storageBucket: 'easystock-wlf7q.firebasestorage.app',
  apiKey: 'AIzaSyD2e_mFdDS8H0ltLT-W4vw57isQfPvzZz4',
  authDomain: 'easystock-wlf7q.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '757179151003',
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
