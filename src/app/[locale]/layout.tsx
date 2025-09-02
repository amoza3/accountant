import type { ReactNode } from 'react';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { FirebaseStatusIndicator } from '@/components/layout/firebase-status-indicator';

export default async function DashboardLayout({ children, params: { locale } }: { children: ReactNode, params: { locale: string } }) {
  const { t } = await getI18n(locale);
  const appName = t('app_name');
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
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <FirebaseStatusIndicator />
      </SidebarInset>
    </div>
  );
}
