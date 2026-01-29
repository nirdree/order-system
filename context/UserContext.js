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
    
    // Don't fetch user on public pages
    const publicPages = ['/', '/login', '/signup'];
    if (publicPages.includes(pathname)) {
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.getCurrentUser();
      
      console.log('Fetch user response:', data);
      
      // Check if we got valid user data (success response)
      if (data?.success === true && data?.data) {
        console.log('Setting user:', data.data);
        setUser(data.data);
      } else if (data?.error) {
        // If there's an error, clear user (401, network error, etc.)
        console.log('User fetch error:', data.error);
        setUser(null);
      } else {
        console.log('Unexpected response format');
        setUser(null);
      }
    } catch (err) {
      console.error('Fetch user exception:', err);
      setUser(null);
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
  }, [pathname]);

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