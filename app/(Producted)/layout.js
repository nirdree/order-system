'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  MenuSquare,
  ShoppingCart,
  Receipt,
  LayoutDashboard,
  Menu,
  X,
  UtensilsCrossed,
  LogOut,
  Settings,
  ChartCandlestick,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

export default function OwnerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useUser();

  // Redirect to login when user is not authenticated
  useEffect(() => {
    console.log('Loading:', loading, 'User:', user);
    if (!loading && !user) {
      // perform navigation after render to avoid updating Router during render
      router.push('/login');
    }
  }, [loading, user, router]);

  /* ===============================
     BLOCK PRERENDER UNTIL USER LOADS
     =============================== */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <span className="text-amber-900 font-semibold">Loading...</span>
      </div>
    );
  }

  /* ===============================
     PROTECT ROUTE (render guard)
     =============================== */
  if (!user && !loading) {
    // Return null while redirecting (useEffect will handle navigation)
    return null;
  }

  /* ===============================
     ROLE-BASED MENU
     =============================== */
  const menuItems = [
    ...(user.role !== 'staff' && user.role !== 'manager'
      ? [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
      : []),

    { name: 'Orders', href: '/orders', icon: Receipt },
    { name: 'Table Orders', href: '/tablesorders', icon: ShoppingCart },

    ...(user.role !== 'staff'
      ? [
          { name: 'Menu Management', href: '/menu', icon: MenuSquare },
          { name: 'Tables Management', href: '/tables', icon: UtensilsCrossed },
          { name: 'User Management', href: '/users', icon: Users },
          { name: 'Sales & Explanations', href: '/sales-explanations', icon: TrendingUp },
          { name: 'Explanations', href: '/explanations', icon: ChartCandlestick }
        ]
      : []),
    ...(user.role == 'admin'
      ? [
          { name: 'Setting', href: '/setting', icon: Settings },
        ]
      : []),

  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    
  };

  return (
    <div className="flex min-h-screen bg-amber-50">
      {/* ===============================
          DESKTOP SIDEBAR
          =============================== */}
      <aside className="hidden md:flex w-64 bg-white shadow-lg flex-col fixed h-full left-0 top-0">
        <div className="p-6 text-2xl font-bold text-amber-900">
           {user?.settings?.businessName}
        </div>

        <h1 className="px-6 mb-6 text-sm font-medium">
          Welcome, {user.name}
        </h1>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
                  ${
                    active
                      ? 'bg-amber-100 text-amber-900 font-semibold'
                      : 'text-gray-600 hover:bg-amber-50'
                  }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* ===============================
          MOBILE DRAWER
          =============================== */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg z-50 flex flex-col p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-amber-900">
               {user?.settings?.businessName}
              </span>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
                      ${
                        active
                          ? 'bg-amber-100 text-amber-900 font-semibold'
                          : 'text-gray-600 hover:bg-amber-50'
                      }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t">
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ===============================
          MAIN CONTENT
          =============================== */}
      <main className="flex-1 w-full md:ml-64">
        <div className="md:hidden flex items-center gap-3 p-4 bg-white shadow">
          <button onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <h1 className="text-lg font-semibold text-amber-900">
             {user?.settings?.businessName}
          </h1>
        </div>

        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
