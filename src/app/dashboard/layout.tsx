'use client';

import type { ReactNode } from 'react';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';
import { FirebaseStatusIndicator } from '@/components/layout/firebase-status-indicator';
import { GlobalProgressBar } from '@/components/layout/global-progress-bar';
import { useAppContext } from '@/components/app-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, authLoading } = useAppContext();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        // You can show a global loader here if you prefer
        return <GlobalProgressBar />;
    }

    return <>{children}</>;
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { settings } = useAppContext();
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <MainSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex items-center justify-between p-4 border-b md:hidden">
              <SidebarTrigger>
                  <PanelLeft className="h-6 w-6" />
              </SidebarTrigger>
              <Logo>{settings.shopName || 'ایزی استاک'}</Logo>
          </header>
          <GlobalProgressBar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
          <FirebaseStatusIndicator />
        </SidebarInset>
      </div>
    </ProtectedRoute>
  );
}
