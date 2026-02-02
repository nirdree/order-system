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
  ShoppingBagIcon,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api-client';

import dynamic from 'next/dynamic';
import 'chart.js/auto';
import PageHeader from '@/components/PageHeader';
import StatsCards from '@/components/StatsCards';

const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
});

const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
  ssr: false,
});

// ============= CHART COMPONENTS (Dynamic) =============
const RevenueChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(d => d.revenue),
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
      <Line data={chartData} options={options} />
    </div>
  );
};

const OrdersChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.day),
    datasets: [
      {
        label: 'Orders',
        data: data.map(d => d.orders),
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
      <Bar data={chartData} options={options} />
    </div>
  );
};

const CategoryChart = ({ data }) => {
  const chartData = {
    labels: data.map(c => c.category),
    datasets: [
      {
        data: data.map(c => c.percentage),
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
      <Pie data={data.length > 0 ? chartData : { labels: [], datasets: [] }} options={options} />
    </div>
  );
};

// ============= MAIN DASHBOARD =============
export default function OwnerDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  // Dashboard states
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);
      const response = await dashboardAPI.getStats();
      
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Auth check
  useEffect(() => {
    if (!loading) {
      if (!user || user.role === 'staff') {
        router.push('/login');
        return;
      }
      loadDashboardData();
    }
  }, [loading, user, router]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon={ShoppingBag}
            title="Dashboard Overview"
            subtitle="Overview of your business"
          />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mt-4">
            {error || 'No data available'}
          </div>
        </div>
      </div>
    );
  }

  // Create stats cards from dynamic data
  const userStats = [
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: dashboardData.orderMetrics.total,
      color: 'blue'
    },
    {
      icon: Clock,
      label: 'Pending Orders',
      value: dashboardData.orderMetrics.pending,
      color: 'yellow'
    },
    {
      icon: Activity,
      label: 'Preparing',
      value: dashboardData.orderMetrics.preparing,
      color: 'purple'
    },
    {
      icon: CheckCircle,
      label: 'Ready',
      value: dashboardData.orderMetrics.ready,
      color: 'green'
    },
    {
      icon: Wallet,
      label: 'Total Revenue',
      value: `₹${(dashboardData.revenue.total / 1000).toFixed(1)}k`,
      color: 'green'
    },
    {
      icon: IndianRupee,
      label: 'Avg Order Value',
      value: `₹${dashboardData.revenue.avgOrderValue}`,
      color: 'blue'
    }
  ];
 


  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header with Refresh Button */}
        
            <PageHeader
              icon={ShoppingBag}
              title="Dashboard Overview"
              subtitle="Real-time overview of your business"
            />
        

        {/* Stats Cards */}
        <StatsCards stats={userStats} columns={6} />

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Revenue Trend (6 Months)</h3>
            {dashboardData.monthlyTrend.length > 0 ? (
              <RevenueChart data={dashboardData.monthlyTrend} />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Weekly Orders */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Weekly Orders</h3>
            {dashboardData.weeklyRevenue.length > 0 ? (
              <OrdersChart data={dashboardData.weeklyRevenue} />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Category Breakdown</h3>
            {dashboardData.categoryBreakdown.length > 0 ? (
              <CategoryChart data={dashboardData.categoryBreakdown} />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Popular Items */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Selling Items</h3>
            {dashboardData.popularItems.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.popularItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs text-gray-700 truncate">{item.name}</span>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-semibold text-gray-800">₹{(item.revenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-gray-500">{item.quantity} qty</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                No items ordered yet
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tables Info */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">Tables</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-800">{dashboardData.tables.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Occupied</span>
                <span className="text-lg font-bold text-red-600">{dashboardData.tables.occupied}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Available</span>
                <span className="text-lg font-bold text-green-600">{dashboardData.tables.available}</span>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-800">Sessions</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Active Sessions</span>
                <span className="text-lg font-bold text-green-600">{dashboardData.sessions.active}</span>
              </div>
            </div>
          </div>

          {/* Staff Info */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-800">Staff</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Total Staff</span>
                <span className="text-lg font-bold text-gray-800">{dashboardData.staff.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Managers</span>
                <span className="text-lg font-bold text-purple-600">{dashboardData.staff.managers}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}