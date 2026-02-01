'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api-client';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    if (typeof window === 'undefined') return;
    
    const publicPages = ['/', '/login', '/signup'];
    if (publicPages.includes(pathname)) {
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.getCurrentUser();            
      if (data?.success === true && data?.data) {
        setUser(data.data);
      } else if (data?.success === true) {
        // API returns user data directly, not nested in data.data
        const userData = { ...data };
        delete userData.success;
        delete userData.message;
        setUser(userData);
      } else if (data?.error || data?.status === 401) {
        // If authentication fails, logout and clear token
        setUser(null);
        try {
          await authAPI.logout();
        } catch (e) {
          // ignore logout error
        }
        // Redirect to login if not already on public pages
        if (!publicPages.includes(pathname)) {
          router.push('/login');
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setUser(null);
      try {
        await authAPI.logout();
      } catch (e) {
        // ignore logout error
      }
      if (!publicPages.includes(pathname)) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}