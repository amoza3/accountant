
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '@/components/app-provider';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminUsersPage() {
    const { db, user, authLoading } = useAppContext();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'superadmin') {
            router.push('/dashboard');
            return;
        }

        if (!db) return;

        async function fetchUsers() {
            setIsLoading(true);
            try {
                const allUsers = await db.getAllUsers();
                setUsers(allUsers);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUsers();
    }, [db, user, authLoading, router]);

    const getInitials = (name: string) => {
        return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('');
    };

    if (isLoading || authLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">مدیریت کاربران</h1>
            <Card>
                <CardHeader>
                    <CardTitle>لیست کاربران سیستم</CardTitle>
                    <CardDescription>
                        در این بخش می‌توانید لیست تمام کاربرانی که در سیستم ثبت‌نام کرده‌اند را مشاهده کنید.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card">
                                <TableRow>
                                    <TableHead>کاربر</TableHead>
                                    <TableHead>نام فروشگاه</TableHead>
                                    <TableHead>ایمیل</TableHead>
                                    <TableHead>شناسه کاربر (UID)</TableHead>
                                    <TableHead>نقش</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={u.photoURL || undefined} alt={u.displayName || 'User Avatar'} />
                                                    <AvatarFallback>{getInitials(u.displayName || u.email || 'U')}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{u.displayName || 'بدون نام نمایشی'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{u.displayName || 'بدون نام'}</TableCell>
                                        <TableCell>{u.email || '-'}</TableCell>
                                        <TableCell className="font-mono text-xs">{u.id}</TableCell>
                                        <TableCell>
                                            {u.role === 'superadmin' ? <Badge>Super Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

