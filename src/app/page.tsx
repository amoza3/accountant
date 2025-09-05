
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/components/app-provider';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, authLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
          <Loader2 className="h-16 w-16 animate-spin" />
      </div>
  );
}
