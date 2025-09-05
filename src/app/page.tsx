
'use client';

import { useEffect } from 'react';
import StyledFirebaseAuth from 'firebaseui-react/StyledFirebaseAuth';
import { getAuth, EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { createFirebaseApp } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

const app = createFirebaseApp();
const auth = getAuth(app);

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID,
    // GoogleAuthProvider.PROVIDER_ID, // You can add more providers here
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false,
  },
};

export default function LoginPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center space-y-4">
                <Logo className="justify-center" />
                <CardTitle className="text-2xl">ورود به حساب کاربری</CardTitle>
                <CardDescription>برای دسترسی به داشبورد، لطفاً وارد شوید.</CardDescription>
            </CardHeader>
            <CardContent>
                <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
            </CardContent>
        </Card>
      </div>
    );
  }

  return null; // or a loading spinner while redirecting
}
