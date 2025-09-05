
'use client';

import { useEffect, useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { createFirebaseApp } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const app = createFirebaseApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
  
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'ورود موفق', description: 'با موفقیت وارد شدید.' });
      // The onAuthStateChanged listener will handle the redirect
    } catch (error: any) {
        let message = 'ورود با گوگل ناموفق بود.';
        // You can check for specific error codes if needed, e.g., 'auth/popup-closed-by-user'
        console.error("Google Sign-In Error:", error);
        toast({
            variant: 'destructive',
            title: 'خطا',
            description: message,
        });
    } finally {
        setIsSubmitting(false);
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
                    <Skeleton className="h-12 w-full" />
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
                <CardTitle className="text-2xl">خوش آمدید!</CardTitle>
                <CardDescription>برای دسترسی به داشبورد، لطفاً با حساب گوگل خود وارد شوید.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button 
                    onClick={handleGoogleSignIn} 
                    className="w-full"
                    disabled={isSubmitting}
                    size="lg"
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg
                          className="mr-2 h-5 w-5"
                          aria-hidden="true"
                          focusable="false"
                          data-prefix="fab"
                          data-icon="google"
                          role="img"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 488 512"
                        >
                          <path
                            fill="currentColor"
                            d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.7 67.7C314.6 114.5 283.5 104 248 104c-73.8 0-134.3 60.3-134.3 135S174.2 375 248 375c83.8 0 119.3-61.2 122.7-89.3h-122.7v-73.3h239.3c1.3 7.8 2.3 15.6 2.3 23.8z"
                          ></path>
                        </svg>
                    )}
                    {isSubmitting ? "در حال ورود..." : "ورود با حساب گوگل"}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}

