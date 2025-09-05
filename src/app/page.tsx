
'use client';

import { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { createFirebaseApp } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const app = createFirebaseApp();
const auth = getAuth(app);

const loginSchema = z.object({
    email: z.string().email({ message: 'لطفا یک ایمیل معتبر وارد کنید.' }),
    password: z.string().min(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' }),
});

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  const handleAuthAction = async (data: z.infer<typeof loginSchema>, action: 'signIn' | 'signUp') => {
    try {
      if (action === 'signIn') {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: 'ورود موفق', description: 'با موفقیت وارد شدید.' });
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: 'ثبت نام موفق', description: 'حساب کاربری شما ایجاد شد. خوش آمدید!' });
      }
      // The onAuthStateChanged listener will handle the redirect
    } catch (error: any) {
        let message = 'عملیات ناموفق بود.';
        if (error.code === 'auth/user-not-found') message = 'کاربری با این ایمیل یافت نشد.';
        if (error.code === 'auth/wrong-password') message = 'رمز عبور اشتباه است.';
        if (error.code === 'auth/email-already-in-use') message = 'این ایمیل قبلا استفاده شده است.';
        
        toast({
            variant: 'destructive',
            title: 'خطا',
            description: message,
        });
    }
  };

  if (loading || (!loading && user)) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Skeleton className="h-8 w-32 mx-auto mb-4" />
                    <Skeleton className="h-4 w-48 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                     <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center space-y-4">
                <Logo className="justify-center" />
                <CardTitle className="text-2xl">ورود یا ثبت‌نام</CardTitle>
                <CardDescription>برای دسترسی به داشبورد، لطفاً وارد شوید یا ثبت‌نام کنید.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <Label>ایمیل</Label>
                                <FormControl>
                                    <Input placeholder="name@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <Label>رمز عبور</Label>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                           <Button 
                             onClick={form.handleSubmit(data => handleAuthAction(data, 'signIn'))} 
                             className="w-full"
                             disabled={isSubmitting}
                            >
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              ورود
                           </Button>
                           <Button 
                             onClick={form.handleSubmit(data => handleAuthAction(data, 'signUp'))}
                             variant="outline" 
                             className="w-full"
                             disabled={isSubmitting}
                            >
                               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                ثبت‌نام
                           </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}

