'use client';
import React, { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { LogOut, BarChart3, Users, TrendingUp, ShoppingBag, RefreshCw } from 'lucide-react';

export default function OwnerDashboard() {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      
        <div className="bg-white rounded-xl p-3 md:p-4 shadow-md border border-amber-100">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 md:p-2.5 rounded-lg flex-shrink-0">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">Orders Management</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Track and manage all orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 md:p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-gray-600 `} />
              </button>
            </div>
          </div>
        </div>
      

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Staff</p>
                <p className="text-3xl font-bold text-amber-900">12</p>
              </div>
              <Users size={32} className="text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Daily Revenue</p>
                <p className="text-3xl font-bold text-green-600">$2,450</p>
              </div>
              <TrendingUp size={32} className="text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Orders Today</p>
                <p className="text-3xl font-bold text-blue-600">156</p>
              </div>
              <BarChart3 size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">
            You are logged in as an <strong>Owner</strong>. You have full access to all cafe management features including staff management, inventory, reports, and settings.
          </p>
        </div>
      </div>
    </div>
  );
}
