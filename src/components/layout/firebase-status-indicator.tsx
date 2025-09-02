'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAppContext } from '@/components/app-provider';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/client';

export function FirebaseStatusIndicator() {
  const { storageType } = useAppContext();
  const [isOnline, setIsOnline] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (storageType !== 'cloud') {
      return;
    }

    // A more reliable way to check Firestore connection status is to listen to metadata changes on the db instance itself.
    const db = getDb();
    const unsubscribe = onSnapshot(db, { includeMetadataChanges: true }, 
        (snapshot) => {
            // This listener is primarily for network connectivity changes.
            // Firestore SDK internally manages this and tells us if we are offline.
            // The hasPendingWrites check is a good indicator, but the most direct way is via the metadata diff.
            // However, a simpler and effective approach for just network status is checking the metadata directly.
            // In the new SDK versions, there isn't a direct `isOnline` flag, so we infer it.
            // For now, listening to the browser's online/offline status is a good primary indicator,
            // and we let Firestore handle retries in the background. The user doesn't need to be
            // immediately alerted to every transient network hiccup if Firestore is managing it.
        },
        (error) => {
            console.error("Firebase connection listener error:", error);
            setIsOnline(false);
        }
    );

    // Also listen to browser online/offline events for faster feedback
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Set initial state from browser
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [storageType]);

  if (storageType !== 'cloud') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-4 right-4 z-50 p-2 bg-card rounded-full border shadow-lg">
            {isOnline ? (
              <Wifi className="h-6 w-6 text-green-500" />
            ) : (
              <WifiOff className="h-6 w-6 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>
            {isOnline ? t('status.firestore_connected') : t('status.firestore_disconnected')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
