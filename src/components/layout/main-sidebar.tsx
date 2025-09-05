
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useAppContext } from '@/components/app-provider';
import { Button } from '../ui/button';
import { ThemeSwitcher } from './theme-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const DEV_MODE_UID = process.env.NEXT_PUBLIC_DEV_MODE_USER_UID;

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, user, settings } = useAppContext();

  const handleLogout = () => {
    if (DEV_MODE_UID) {
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
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  const isLinkActive = (href: string) => {
    if (href.endsWith('/dashboard')) {
      return pathname === href || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };
  
  return (
    <Sidebar className="border-l border-r-0" dir="rtl" side="right">
      <SidebarHeader className="border-b border-b-0 border-t flex flex-col gap-4">
        <Logo>{settings.shopName || 'حسابدار آنلاین آموزا'}</Logo>
        {user && (
            <div className="flex items-center gap-3 px-2">
                 <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User Avatar'} />
                    <AvatarFallback>{getInitials(user.displayName || user.email || 'U')}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                    <span className="font-semibold text-sm truncate">{user.displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
            </div>
        )}
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
                <SidebarSeparator />
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
        <ThemeSwitcher />
         <Button variant="ghost" className="w-full justify-start text-right" onClick={handleLogout}>
            <LogOut className="ml-2" />
            <span>خروج</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
