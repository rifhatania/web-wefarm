// lib/adminMiddleware.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // User not logged in, redirect to login
        router.push('/login');
        return;
      }

      try {
        // Check if user is admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        const adminStatus = adminDoc.exists();
        
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          // User is not admin, redirect to home
          router.push('/home');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/home');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return { isAdmin, loading };
};

// Higher Order Component untuk protect admin pages
export const withAdminAuth = (WrappedComponent) => {
  return function AdminProtectedComponent(props) {
    const { isAdmin, loading } = useAdminCheck();

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      );
    }

    if (!isAdmin) {
      return null; // Will be redirected by useAdminCheck
    }

    return <WrappedComponent {...props} />;
  };
};