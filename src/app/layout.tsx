import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { PanelLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ایزی استاک',
  description: 'مدیریت ساده موجودی',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appName = 'ایزی استاک';
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
            <SidebarProvider>
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
                </SidebarInset>
              </div>
            </SidebarProvider>
          <Toaster />
      </body>
    </html>
  );
}
