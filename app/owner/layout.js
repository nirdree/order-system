// export const metadata = {
//   title: 'Owner Dashboard | Cafe Management',
//   description: 'Owner Dashboard for Cafe Management System',
// };

// export default function OwnerLayout({ children }) {
//   return (
//     <div>
//       {children}
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import {
  Users,
  MenuSquare,
  ShoppingCart,
  Receipt,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function OwnerLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/owner/orders', icon: ShoppingCart },
    { name: 'Menu', href: '/owner/menu', icon: MenuSquare },
    { name: 'Bills', href: '/owner/bills', icon: Receipt },
    { name: 'User Management', href: '/owner/users', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-amber-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white shadow-lg flex-col">
        <div className="p-6 text-2xl font-bold text-amber-900">
          Cafe Owner
        </div>

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
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-amber-900">
                Cafe Owner
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
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center gap-3 p-4 bg-white shadow">
          <button onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <h1 className="text-lg font-semibold text-amber-900">
            Cafe Owner
          </h1>
        </div>

        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
