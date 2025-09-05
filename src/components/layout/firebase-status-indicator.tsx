'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAppContext } from '@/components/app-provider';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function FirebaseStatusIndicator() {
  const { storageType } = useAppContext();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (storageType !== 'cloud') {
      return;
    }

    // A more reliable way to check Firestore connection status is to listen to metadata changes on the db instance itself.
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Set initial state from browser
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
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
            {isOnline ? 'متصل به فضای ابری' : 'اتصال به فضای ابری قطع شد'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
