
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Shield,
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

const DEV_MODE_UID = process.env.NEXT_PUBLIC_DEV_MODE_USER_UID;

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, user, settings } = useAppContext();

  const handleLogout = () => {
    if (DEV_MODE_UID) {
      // In dev mode, just redirect to simulate logout
      router.push('/');
    } else {
      auth.signOut();
    }
  };

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

  const adminMenuItems = [
    {
        href: '/dashboard/admin/users',
        label: 'مدیریت کاربران',
        icon: Shield,
    }
  ];

  const isLinkActive = (href: string) => {
    // Exact match for dashboard
    if (href.endsWith('/dashboard')) {
      return pathname === href || pathname === '/dashboard';
    }
    // Starts with for sub-pages
    return pathname.startsWith(href);
  };
  
  return (
    <Sidebar className="border-l border-r-0" dir="rtl" side="right">
      <SidebarHeader className="border-b border-b-0 border-t">
        <Logo>{settings.shopName || 'حسابدار آنلاین آموزا'}</Logo>
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
           {user?.role === 'superadmin' && (
            <>
                <SidebarMenuItem>
                    <div className="p-2 text-xs font-semibold text-muted-foreground">پنل ادمین</div>
                </SidebarMenuItem>
                {adminMenuItems.map((item) => (
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
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        {user && (
            <div className="flex flex-col gap-2 p-2">
                <p className="text-xs text-muted-foreground px-2">وارد شده با: {user.email}</p>
                <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    خروج
                </Button>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
