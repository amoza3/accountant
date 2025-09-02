'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAppContext } from '@/components/app-provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

    // A reliable way to check Firestore connection status is to listen to a document
    // and check the `fromCache` metadata flag.
    const db = getDb();
    // We listen to a document that is unlikely to change frequently.
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'exchangeRates'),
      { includeMetadataChanges: true },
      (docSnapshot) => {
        // If the data is from the cache, we are likely offline.
        // If it's not from cache, we are connected to the backend.
        setIsOnline(!docSnapshot.metadata.fromCache);
      },
      (error) => {
        console.error("Firebase connection listener error:", error);
        setIsOnline(false);
      }
    );

    // Also listen to browser online/offline events for faster feedback
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
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
  );
}
