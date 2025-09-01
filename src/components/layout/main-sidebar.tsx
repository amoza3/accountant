'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingCart,
  FileText,
  Settings,
  History
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';

export function MainSidebar({ appName }: { appName: string }) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: `/dashboard`,
      label: 'موجودی',
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/add-product`,
      label: 'افزودن محصول',
      icon: PlusCircle,
    },
    {
      href: `/dashboard/record-sale`,
      label: 'ثبت فروش',
      icon: ShoppingCart,
    },
     {
      href: `/dashboard/sales-history`,
      label: 'تاریخچه فروش',
      icon: History,
    },
    {
      href: `/dashboard/reports`,
      label: 'گزارش‌ها',
      icon: FileText,
    },
    {
      href: `/dashboard/settings`,
      label: 'تنظیمات',
      icon: Settings,
    }
  ];

  const isLinkActive = (href: string) => {
    // Exact match for dashboard
    if (href.endsWith('/dashboard')) {
      return pathname === href || pathname === '/';
    }
    // Starts with for sub-pages
    return pathname.startsWith(href);
  };
  
  return (
    <Sidebar>
      <SidebarHeader>
        <Logo>{appName}</Logo>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isLinkActive(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
