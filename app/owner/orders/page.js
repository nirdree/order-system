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
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Table as TableIcon,
  X,
  ChevronDown,
  Users,
  UtensilsCrossed,
  Package,
  Utensils,
  MapPin,
  User,
  DollarSign,
  Timer
} from 'lucide-react';
import {
  ORDER_STATUSES,
  ORDER_TYPES,
  PLACED_BY,
  calculateOrderMetrics
} from '@/lib/orderUtils';

const POLLING_INTERVAL = 10000;
const DEFAULT_LIMIT = 10;

export default function OrdersPage() {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    pages: 1
  });

  const [filters, setFilters] = useState({
    status: 'all',
    orderType: 'all',
    placedBy: 'all',
    search: '',
    tableNumber: ''
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [expandedOrder, setExpandedOrder] = useState(null);

  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  }, []);

  const fetchOrders = useCallback(async (page = 1, isBackground = false) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (!isBackground) {
        if (isInitialLoad) {
          setIsInitialLoad(true);
        } else {
          setIsRefreshing(true);
        }
      }
      
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.orderType !== 'all' && { orderType: filters.orderType }),
        ...(filters.placedBy !== 'all' && { placedBy: filters.placedBy }),
        ...(filters.search && { search: filters.search }),
        ...(filters.tableNumber && { tableNumber: filters.tableNumber })
      });

      const response = await fetch(`/api/orders?${params}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();

      if (isMountedRef.current && data.success) {
        setOrders(data.data.orders || []);
        setPagination(data.data.pagination || {});
        setMetrics(calculateOrderMetrics(data.data.orders || []));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch orders');
        showNotification('error', 'Failed to fetch orders');
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoad(false);
        setIsRefreshing(false);
      }
    }
  }, [filters, pagination.limit, isInitialLoad, showNotification]);

  useEffect(() => {
    fetchOrders(1);
    pollingIntervalRef.current = setInterval(() => {
      fetchOrders(pagination.page, true);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [filters, pagination.limit]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const searchTimeoutRef = useRef(null);
  
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (filterName === 'search' || filterName === 'tableNumber') {
      searchTimeoutRef.current = setTimeout(() => {
        fetchOrders(1);
      }, 500);
    } else {
      fetchOrders(1);
    }
  }, [fetchOrders]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      orderType: 'all',
      placedBy: 'all',
      search: '',
      tableNumber: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(order =>
      order._id === orderId ? { ...order, orderStatus: newStatus } : order
    ));

    try {
      setIsUpdating(true);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Order status updated');
        setTimeout(() => fetchOrders(pagination.page, true), 500);
      }
    } catch (err) {
      setOrders(previousOrders);
      showNotification('error', 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  }, [orders, pagination.page, fetchOrders, showNotification]);

  const handleCancelOrder = useCallback(async (orderId) => {
    if (!confirm('Cancel this order?')) return;

    const previousOrders = [...orders];
    setOrders(prev => prev.map(order =>
      order._id === orderId ? { ...order, orderStatus: ORDER_STATUSES.CANCELLED } : order
    ));

    try {
      setIsUpdating(true);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: ORDER_STATUSES.CANCELLED })
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      showNotification('success', 'Order cancelled');
      setTimeout(() => fetchOrders(pagination.page, true), 500);
    } catch (err) {
      setOrders(previousOrders);
      showNotification('error', 'Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  }, [orders, pagination.page, fetchOrders, showNotification]);

  const handlePreviousPage = useCallback(() => {
    if (pagination.page > 1) {
      const newPage = pagination.page - 1;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  }, [pagination.page, fetchOrders]);

  const handleNextPage = useCallback(() => {
    if (pagination.page < pagination.pages) {
      const newPage = pagination.page + 1;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  }, [pagination.page, pagination.pages, fetchOrders]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-[10000] animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Orders Management</h1>
                <p className="text-xs text-gray-500">Real-time tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders(pagination.page)}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="hidden sm:flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <Users className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-semibold text-gray-700">{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-sm"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              <MetricBadge icon={<TrendingUp />} label="Total" value={metrics.total} color="blue" />
              <MetricBadge icon={<Clock />} label="Pending" value={metrics.pending} color="yellow" />
              <MetricBadge icon={<Loader2 />} label="Preparing" value={metrics.preparing} color="orange" />
              <MetricBadge icon={<CheckCircle />} label="Completed" value={metrics.completed} color="green" />
              <MetricBadge icon={<XCircle />} label="Cancelled" value={metrics.cancelled} color="red" />
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters - Single Line */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-3 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Order ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* Table Number */}
            <div className="relative">
              <TableIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Table #..."
                value={filters.tableNumber}
                onChange={(e) => handleFilterChange('tableNumber', e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Status</option>
              {Object.values(ORDER_STATUSES).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Type */}
            <select
              value={filters.orderType}
              onChange={(e) => handleFilterChange('orderType', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              {Object.values(ORDER_TYPES).map(t => (
                <option key={t} value={t}>{t === 'dine-in' ? 'Dine-In' : 'Counter'}</option>
              ))}
            </select>

            {/* Placed By */}
            <select
              value={filters.placedBy}
              onChange={(e) => handleFilterChange('placedBy', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All</option>
              {Object.values(PLACED_BY).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-1.5 transition text-sm text-gray-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Orders */}
        {isInitialLoad ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">No orders found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                isExpanded={expandedOrder === order._id}
                onToggle={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                onStatusChange={handleStatusChange}
                onCancel={handleCancelOrder}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm p-3 flex items-center justify-between border border-gray-200">
            <p className="text-xs text-gray-600">
              Page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.pages}</span>
              <span className="text-gray-400 mx-1">•</span>
              {pagination.total} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-1 transition text-sm disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                onClick={handleNextPage}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-1 transition text-sm disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

// Metric Badge Component
function MetricBadge({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-2 flex items-center gap-2`}>
      <div className="text-current">{React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}</div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-base font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, isExpanded, onToggle, onStatusChange, onCancel, isUpdating }) {
  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    preparing: 'bg-blue-50 text-blue-700 border-blue-200',
    ready: 'bg-green-50 text-green-700 border-green-200',
    served: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-gray-50 text-gray-700 border-gray-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
      >
        {/* Status Badge */}
        <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColors[order.orderStatus]}`}>
          {order.orderStatus}
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{order.orderId}</span>
            {order.table?.tableNumber && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <TableIcon className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Table {order.table.tableNumber}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(order.orderedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {order.items?.length || 0} items
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ₹{order.orderAmount?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Expand Icon */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div>
              <span className="text-gray-500">Order Type:</span>
              <span className="ml-2 font-semibold text-gray-700">{order.orderType}</span>
            </div>
            <div>
              <span className="text-gray-500">Placed By:</span>
              <span className="ml-2 font-semibold text-gray-700">{order.placedBy}</span>
            </div>
            {order.session?.sessionId && (
              <div>
                <span className="text-gray-500">Session:</span>
                <span className="ml-2 font-semibold text-gray-700">{order.session.sessionId}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Est. Time:</span>
              <span className="ml-2 font-semibold text-gray-700">{order.estimatedTime || 0} min</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg border border-gray-200 mb-3 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Item</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">Price</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {item.menuItem?.imgURL && item.menuItem.imgURL !== '/images/default-item.jpg' ? (
                          <img src={item.menuItem.imgURL} alt={item.name} className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                            <Utensils className="w-3 h-3 text-amber-600" />
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-gray-700">{item.quantity}</td>
                    <td className="py-2 px-2 text-right text-gray-600">₹{item.price}</td>
                    <td className="py-2 px-2 text-right font-semibold text-gray-900">₹{item.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-amber-50 border-t border-amber-200">
                <tr>
                  <td colSpan="3" className="py-2 px-2 text-right font-semibold text-gray-700">Total:</td>
                  <td className="py-2 px-2 text-right font-bold text-amber-600">₹{order.orderAmount?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <select
              value={order.orderStatus}
              onChange={(e) => onStatusChange(order._id, e.target.value)}
              disabled={isUpdating || order.orderStatus === 'cancelled'}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {Object.values(ORDER_STATUSES).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && (
              <button
                onClick={() => onCancel(order._id)}
                disabled={isUpdating}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}