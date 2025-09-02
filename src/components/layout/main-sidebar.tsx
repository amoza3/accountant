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
  Receipt
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
import { useI18n } from '@/lib/i18n/client';

export function MainSidebar({ appName }: { appName: string }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const menuItems = [
    {
      href: `/dashboard`,
      label: t('sidebar.inventory'),
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/add-product`,
      label: t('sidebar.add_product'),
      icon: PlusCircle,
    },
    {
      href: `/dashboard/record-sale`,
      label: t('sidebar.record_sale'),
      icon: ShoppingCart,
    },
     {
      href: `/dashboard/sales-history`,
      label: t('sidebar.sales_history'),
      icon: History,
    },
    {
        href: `/dashboard/customers`,
        label: t('sidebar.customers'),
        icon: Users,
    },
    {
      href: `/dashboard/expenses`,
      label: t('sidebar.expenses'),
      icon: Receipt,
    },
    {
      href: `/dashboard/reports`,
      label: t('sidebar.reports'),
      icon: FileText,
    },
    {
      href: `/dashboard/settings`,
      label: t('sidebar.settings'),
      icon: Settings,
    }
  ];

  const isLinkActive = (href: string) => {
    // Exact match for dashboard
    if (href.endsWith('/dashboard')) {
      const currentPath = pathname.substring(pathname.indexOf('/dashboard'));
      return currentPath === href;
    }
    // Starts with for sub-pages
    return pathname.includes(href);
  };
  
  return (
    <Sidebar className="border-l border-r-0" dir="rtl">
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
                  <span className="ml-2">{item.label}</span>
                  <item.icon />
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
