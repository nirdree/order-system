'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import OrderCard from '@/components/OrderCard';
import {
  ORDER_STATUSES,
  ORDER_TYPES,
  PLACED_BY,
  calculateOrderMetrics,
  validateFilters
} from '@/lib/orderUtils';

const POLLING_INTERVAL = 3000; // Poll every 3 seconds for new orders
const DEFAULT_LIMIT = 10;

export default function OrdersPage() {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  // State management
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    pages: 1
  });

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    orderType: 'all',
    placedBy: 'all',
    search: ''
  });

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch orders
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        orderType: filters.orderType,
        placedBy: filters.placedBy,
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      if (isMountedRef.current) {
        if (data.data) {
          setOrders(data.data.orders || []);
          setPagination(data.data.pagination || {});
          setMetrics(calculateOrderMetrics(data.data.orders || []));
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch orders');
        console.error('Fetch orders error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters, pagination.limit]);

  // Setup polling for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchOrders(1);

    // Setup polling
    pollingIntervalRef.current = setInterval(() => {
      fetchOrders(pagination.page);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchOrders, pagination.page]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      orderType: 'all',
      placedBy: 'all',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state optimistically
      setOrders(prev => prev.map(order =>
        order._id === orderId
          ? { ...order, orderStatus: newStatus }
          : order
      ));

      // Refresh the list after a short delay to get complete data
      setTimeout(() => fetchOrders(pagination.page), 500);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
      console.error('Update status error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      setIsUpdating(true);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderStatus: ORDER_STATUSES.CANCELLED })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Update local state
      setOrders(prev => prev.map(order =>
        order._id === orderId
          ? { ...order, orderStatus: ORDER_STATUSES.CANCELLED }
          : order
      ));

      // Refresh the list
      setTimeout(() => fetchOrders(pagination.page), 500);
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
      console.error('Cancel order error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      const newPage = pagination.page - 1;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      const newPage = pagination.page + 1;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-amber-900">Orders Management</h1>
            <div className="hidden md:flex items-center gap-4 text-sm ml-8">
              {metrics && (
                <>
                  <div className="flex items-center gap-1 text-gray-700">
                    <TrendingUp size={16} className="text-green-500" />
                    <span>{metrics.total} Total</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock size={16} className="text-yellow-500" />
                    <span>{metrics.pending} Pending</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Filter size={20} />
              Filters & Search
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              {showFilters ? '▼' : '▶'} {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFilters && (
            <>
              {/* Search */}
              <div className="mb-4 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by Order ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  >
                    <option value="all">All Statuses</option>
                    {Object.values(ORDER_STATUSES).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Type
                  </label>
                  <select
                    value={filters.orderType}
                    onChange={(e) => handleFilterChange('orderType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  >
                    <option value="all">All Types</option>
                    {Object.values(ORDER_TYPES).map(type => (
                      <option key={type} value={type}>
                        {type === 'dine-in' ? 'Dine-In' : 'Counter'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Placed By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placed By
                  </label>
                  <select
                    value={filters.placedBy}
                    onChange={(e) => handleFilterChange('placedBy', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  >
                    <option value="all">All</option>
                    {Object.values(PLACED_BY).map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items Per Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Per Page
                  </label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination(prev => ({
                        ...prev,
                        limit: parseInt(e.target.value),
                        page: 1
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
              >
                <RotateCcw size={18} />
                Reset Filters
              </button>
            </>
          )}
        </div>

        {/* Orders List */}
        <div>
          {isLoading && pagination.page === 1 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">No orders found</p>
              <p className="text-gray-500">Try adjusting your filters or come back later</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onCancel={handleCancelOrder}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.pages}</span> ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.page === 1 || isLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={pagination.page === pagination.pages || isLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center text-xs text-gray-500">
          🔄 Refreshing automatically every {POLLING_INTERVAL / 1000} seconds
        </div>
      </div>
    </div>
  );
}
