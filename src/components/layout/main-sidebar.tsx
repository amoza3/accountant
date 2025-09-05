'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingCart,
  FileText,
  Settings,
  History,
  Users,
  Receipt,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useAppContext } from '@/components/app-provider';
import { Button } from '../ui/button';

export function MainSidebar({ appName }: { appName: string }) {
  const pathname = usePathname();
  const { auth, user } = useAppContext();

  const menuItems = [
    {
      href: `/dashboard`,
      label: "موجودی کالا",
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/add-product`,
      label: "افزودن محصول",
      icon: PlusCircle,
    },
    {
      href: `/dashboard/record-sale`,
      label: "ثبت فروش",
      icon: ShoppingCart,
    },
     {
      href: `/dashboard/sales-history`,
      label: "تاریخچه فروش",
      icon: History,
    },
    {
        href: `/dashboard/customers`,
        label: "مشتریان",
        icon: Users,
    },
    {
      href: `/dashboard/expenses`,
      label: "مخارج",
      icon: Receipt,
    },
    {
      href: `/dashboard/reports`,
      label: "گزارش‌ها",
      icon: FileText,
    },
    {
      href: `/dashboard/settings`,
      label: "تنظیمات",
      icon: Settings,
    }
  ];

  const isLinkActive = (href: string) => {
    // Exact match for dashboard
    if (href.endsWith('/dashboard')) {
      return pathname === href;
    }
    // Starts with for sub-pages
    return pathname.startsWith(href);
  };
  
  return (
    <Sidebar className="border-l border-r-0" dir="rtl" side="right">
      <SidebarHeader className="border-b border-b-0 border-t">
        <Logo>{appName}</Logo>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={isLinkActive(item.href)}
                  tooltip={item.label}
                  className="text-right"
                >
                  <item.icon className="ml-2" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        {user && (
            <div className="flex flex-col gap-2 p-2">
                <p className="text-xs text-muted-foreground px-2">وارد شده با: {user.email}</p>
                <Button variant="ghost" className="justify-start" onClick={() => auth.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    خروج
                </Button>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
