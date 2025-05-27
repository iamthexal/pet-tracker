'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  ConfirmationResult,
  ApplicationVerifier,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { setCookie, destroyCookie } from 'nookies';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signOut: (redirectTo?: string) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithPhone: (phoneNumber: string, appVerifier: ApplicationVerifier) => Promise<ConfirmationResult>;
  confirmPhoneSignIn: (verificationId: string, verificationCode: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string | null, photoURL?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// List of protected paths that require authentication
const protectedPaths = ['/dashboard', '/settings', '/pets'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsLoading(false);

      if (user) {
        // Get the ID token and set it as a cookie
        const token = await getIdToken(user);
        setCookie(null, '__session', token, {
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        });

        // Handle redirect after sign in
        const redirectTo = searchParams?.get('redirect');
        if (redirectTo && (pathname === '/signin' || pathname === '/signup')) {
          router.push(redirectTo);
        }
      } else {
        // Remove the session cookie
        destroyCookie(null, '__session');

        // Only redirect to signin if on a protected path
        if (protectedPaths.some(path => pathname.startsWith(path))) {
          const redirectUrl = new URL('/signin', window.location.href);
          redirectUrl.searchParams.set('redirect', pathname);
          router.push(redirectUrl.toString());
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router, searchParams]);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await sendEmailVerification(result.user);
    return result.user;
  };

  const signOut = async (redirectTo: string = '/') => {
    try {
      await firebaseSignOut(auth);
      destroyCookie(null, '__session');
      // Force navigation to the specified redirect path
      window.location.href = redirectTo;
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: ApplicationVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const confirmPhoneSignIn = async (verificationId: string, verificationCode: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (displayName?: string | null, photoURL?: string | null) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await updateProfile(auth.currentUser, { displayName, photoURL });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithPhone,
      confirmPhoneSignIn,
      resetPassword,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

