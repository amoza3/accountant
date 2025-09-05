'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/components/app-provider';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

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

    if (isLoading || authLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>نام فروشگاه (کاربر)</TableHead>
                                <TableHead>شناسه کاربر (UID)</TableHead>
                                <TableHead>نقش</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.displayName || 'بدون نام'}</TableCell>
                                    <TableCell className="font-mono">{u.id}</TableCell>
                                    <TableCell>
                                        {u.id === user?.id ? <Badge>Super Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
