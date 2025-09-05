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

export function MainSidebar({ appName }: { appName: string }) {
  const pathname = usePathname();

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
    </Sidebar>
  );
}
