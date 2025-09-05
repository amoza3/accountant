
'use client';

import type { ReactNode } from 'react';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';
import { FirebaseStatusIndicator } from '@/components/layout/firebase-status-indicator';
import { GlobalProgressBar } from '@/components/layout/global-progress-bar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const appName = "ایزی استاک";
  return (
    <div className="flex min-h-screen">
      <MainSidebar appName={appName} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b md:hidden">
            <SidebarTrigger>
                <PanelLeft className="h-6 w-6" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold">{appName}</h1>
        </header>
        <GlobalProgressBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <FirebaseStatusIndicator />
      </SidebarInset>
    </div>
  );
}
