'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Users,
  ShoppingBag,
  IndianRupee,
  Star,
  Package,
  Activity,
  ShoppingBagIcon
} from 'lucide-react';

import dynamic from 'next/dynamic';
import 'chart.js/auto';
import PageHeader from '@/components/PageHeader';

const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
});

const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
  ssr: false,
});

// ============= STATIC DATA =============
const staticData = {
  revenue: {
    total: 245680,
    growth: 12.5
  },
  orders: {
    total: 1847,
    avgValue: 133
  },
  customers: {
    total: 892,
    new: 156
  },
  popularItems: [
    { name: 'Butter Chicken', orders: 234, revenue: 35100 },
    { name: 'Paneer Tikka', orders: 198, revenue: 29700 },
    { name: 'Biryani', orders: 187, revenue: 33660 },
    { name: 'Dal Makhani', orders: 156, revenue: 18720 }
  ],
  weeklyRevenue: [
    { day: 'Mon', revenue: 32450 },
    { day: 'Tue', revenue: 28900 },
    { day: 'Wed', revenue: 35600 },
    { day: 'Thu', revenue: 31200 },
    { day: 'Fri', revenue: 42300 },
    { day: 'Sat', revenue: 48700 },
    { day: 'Sun', revenue: 45200 }
  ],
  monthlyTrend: [
    { month: 'Jan', revenue: 198000 },
    { month: 'Feb', revenue: 212000 },
    { month: 'Mar', revenue: 225000 },
    { month: 'Apr', revenue: 218420 },
    { month: 'May', revenue: 245680 }
  ],
  categoryBreakdown: [
    { category: 'Main Course', percentage: 45 },
    { category: 'Appetizers', percentage: 22 },
    { category: 'Beverages', percentage: 15 },
    { category: 'Desserts', percentage: 12 },
    { category: 'Combos', percentage: 6 }
  ]
};

// ============= SIMPLE CHARTS =============
const RevenueChart = () => {
  const data = {
    labels: staticData.monthlyTrend.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: staticData.monthlyTrend.map(d => d.revenue),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="h-48">
      <Line data={data} options={options} />
    </div>
  );
};

const OrdersChart = () => {
  const data = {
    labels: staticData.weeklyRevenue.map(d => d.day),
    datasets: [
      {
        label: 'Orders',
        data: staticData.weeklyRevenue.map(d => d.revenue / 133),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="h-48">
      <Bar data={data} options={options} />
    </div>
  );
};

const CategoryChart = () => {
  const data = {
    labels: staticData.categoryBreakdown.map(c => c.category),
    datasets: [
      {
        data: staticData.categoryBreakdown.map(c => c.percentage),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6'
        ]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 10 }, padding: 8 }
      }
    }
  };

  return (
    <div className="h-48">
      <Pie data={data} options={options} />
    </div>
  );
};

// ============= MAIN DASHBOARD =============
export default function OwnerDashboard() {
  const { user, loading } = useUser();

  const [metrics, setMetrics] = useState({
    total: 1847,
    pending: 23,
    preparing: 15,
    ready: 8,
    completed: 1756,
    cancelled: 45
  });
  const router = useRouter();
   useEffect(() => {
      if (!loading) {
        if (!user || user.role === 'staff' || user.role === 'manager') {
          router.push('/login');
          return;
        }
       
      }
    }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <PageHeader
        icon={ShoppingBag}
        title="Dashboard Overview"
        subtitle="Overview of your business"
      />




        {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-3 md:mb-5">
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-3">
          {/* Tables */}
          <div className="bg-white/90 backdrop-blur border border-blue-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
              <div className="bg-blue-100 p-1 md:p-1.5 rounded-lg flex-shrink-0">
                <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              </div>
      
              
              <p className="hidden md:block text-[10px] md:text-xs font-semibold text-gray-600">
                Total Tables
              </p>
            </div>
            <p className="text-lg md:text-xl font-bold text-blue-700">
             34
            </p>
          </div>
      
          {/* Available */}
          <div className="bg-white/90 backdrop-blur border border-red-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
              <div className="bg-red-100 p-1 md:p-1.5 rounded-lg flex-shrink-0">
                <Users className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
              </div>
      
              <p className="hidden md:block text-[10px] md:text-xs font-semibold text-gray-600">
                Available
              </p>
            </div>
            <p className="text-lg md:text-xl font-bold text-red-700">
              12
            </p>
          </div>
      
          {/* Occupied */}
          <div className="bg-white/90 backdrop-blur border border-green-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
              <div className="bg-green-100 p-1 md:p-1.5 rounded-lg flex-shrink-0">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
              </div>
      
              <p className="hidden md:block text-[10px] md:text-xs font-semibold text-gray-600">
                Occupied
              </p>
            </div>
            <p className="text-lg md:text-xl font-bold text-green-700">
             23
            </p>
          </div>
      
          {/* Capacity */}
          <div className="bg-white/90 backdrop-blur border border-orange-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
              <div className="bg-orange-100 p-1 md:p-1.5 rounded-lg flex-shrink-0">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
              </div>
      
              <p className="hidden md:block text-[10px] md:text-xs font-semibold text-gray-600">
                Capacity
              </p>
            </div>
            <p className="text-lg md:text-xl font-bold text-orange-700">
              10
            </p>
          </div>
      
        </div>
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Revenue Trend</h3>
            <RevenueChart />
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Weekly Orders</h3>
            <OrdersChart />
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Category Breakdown</h3>
            <CategoryChart />
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Popular Items</h3>
            <div className="space-y-2">
              {staticData.popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs text-gray-700 truncate">{item.name}</span>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs font-semibold text-gray-800">₹{(item.revenue / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500">{item.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Category Performance</h3>
          <div className="space-y-3">
            {staticData.categoryBreakdown.map((category, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700">{category.category}</span>
                  <span className="text-xs font-semibold text-gray-800">{category.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}