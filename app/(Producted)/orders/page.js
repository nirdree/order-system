'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { useSocket } from '@/context/SocketContext';
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
  Loader,
  RefreshCw,
  X,
  ChevronDown,
  Users,
  UtensilsCrossed,
  Package,
  Utensils,
  IndianRupee,
  LayoutGrid,
  List,
  ShoppingBag,
  Edit2,
  Trash2
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatsCards from '@/components/StatsCards';
import ViewControls from '@/components/ViewControls';
import { ordersAPI } from '@/lib/api-client';

// ============= ORDER DETAIL MODAL COMPONENT =============
const OrderDetailModal = ({ order, isOpen, onClose, onStatusChange, onCancel }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    preparing: 'bg-blue-50 text-blue-700 border-blue-200',
    ready: 'bg-green-50 text-green-700 border-green-200',
    served: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-gray-50 text-gray-700 border-gray-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    await onStatusChange(order._id, newStatus);
    setIsUpdating(false);
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setIsUpdating(true);
    await onCancel(order._id);
    setIsUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-3">
      <div className="bg-white rounded-t-xl sm:rounded-2xl max-w-4xl w-full h-full sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 md:px-5 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">{order.orderId}</h2>
            <p className="text-white/90 text-xs md:text-sm">
              {new Date(order.orderedAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5">
          {/* Order Info */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-3 md:mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
              <div>
                <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Status</p>
                <div className={`inline-flex px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border ${statusColors[order.orderStatus]}`}>
                  {order.orderStatus}
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Type</p>
                <p className="font-bold text-gray-900 text-xs md:text-sm">
                  {order.orderType === 'dine-in' ? 'Dine-In' : 'Counter'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Placed By</p>
                <p className="font-bold text-gray-900 text-xs md:text-sm">{order.placedBy}</p>
              </div>
              <div>
                <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Est. Time</p>
                <p className="font-bold text-gray-900 text-xs md:text-sm">{order.estimatedTime || 0} min</p>
              </div>
              {order.table?.tableNumber && (
                <div className="col-span-2">
                  <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Table</p>
                  <p className="font-bold text-amber-600 text-xs md:text-sm">Table {order.table.tableNumber}</p>
                </div>
              )}
              {order.session?.sessionId && (
                <div className="col-span-2">
                  <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Session ID</p>
                  <p className="font-bold text-gray-900 text-xs md:text-sm truncate">{order.session.sessionId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 md:py-2.5 px-2 md:px-3 text-[10px] md:text-xs font-semibold text-gray-700">Item</th>
                      <th className="text-center py-2 md:py-2.5 px-2 md:px-3 text-[10px] md:text-xs font-semibold text-gray-700">Qty</th>
                      <th className="text-right py-2 md:py-2.5 px-2 md:px-3 text-[10px] md:text-xs font-semibold text-gray-700">Price</th>
                      <th className="text-right py-2 md:py-2.5 px-2 md:px-3 text-[10px] md:text-xs font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 md:py-2.5 px-2 md:px-3">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            {item.menuItem?.imgURL && item.menuItem.imgURL !== '/images/default-item.jpg' ? (
                              <img src={item.menuItem.imgURL} alt={item.name} className="w-6 h-6 md:w-8 md:h-8 rounded object-cover" />
                            ) : (
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                <Utensils className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900 text-[10px] md:text-xs">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-2 md:py-2.5 px-2 md:px-3 text-center font-semibold text-gray-700">{item.quantity}</td>
                        <td className="py-2 md:py-2.5 px-2 md:px-3 text-right text-gray-600">₹{item.price}</td>
                        <td className="py-2 md:py-2.5 px-2 md:px-3 text-right font-bold text-amber-600">₹{item.subtotal?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-br from-amber-50 to-orange-50 border-t-2 border-amber-200">
                    <tr>
                      <td colSpan="3" className="py-2 md:py-3 px-2 md:px-3 text-right font-semibold text-gray-700">Total Amount:</td>
                      <td className="py-2 md:py-3 px-2 md:px-3 text-right font-bold text-amber-600 text-base md:text-lg">₹{order.orderAmount?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 md:space-y-3">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Update Status</label>
              <select
                value={order.orderStatus}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={isUpdating || order.orderStatus === 'cancelled' || order.orderStatus === 'completed'}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
    <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="served">Served</option>  
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && (
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
              >
                {isUpdating ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <><Trash2 className="w-4 h-4 md:w-5 md:h-5" />Cancel Order</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= MAIN ORDERS PAGE COMPONENT =============
export default function OrdersPage() {
  const { user, loading, logout } = useUser();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPlacedBy, setFilterPlacedBy] = useState('all');
  const [filterTable, setFilterTable] = useState('');

  // View Mode
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
  const [gridColumns, setGridColumns] = useState(3); // 1, 2, 3, 4, 5, or 6 columns

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    completed: 0,
    cancelled: 0
  });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await ordersAPI.getAllOrders();

      if (data.success) {
        const ordersList = data.data.orders || [];
        setOrders(ordersList);

        // Calculate metrics
        const stats = {
          total: ordersList.length,
          pending: ordersList.filter(o => o.orderStatus === 'pending').length,
          preparing: ordersList.filter(o => o.orderStatus === 'preparing').length,
          ready: ordersList.filter(o => o.orderStatus === 'ready').length,
          served: ordersList.filter(o => o.orderStatus === 'served').length,
          completed: ordersList.filter(o => o.orderStatus === 'completed').length,
          cancelled: ordersList.filter(o => o.orderStatus === 'cancelled').length
        };
        setMetrics(stats);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message);
      showNotification('error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {

    loadOrders();
    console.log('loading stutes-', loading, 'user stutes-', user)
  }, []);

  // WebSocket Real-time Updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new orders
    const handleNewOrder = (data) => {
      console.log('📦 New order received:', data.order);
      setOrders(prev => [data.order, ...prev]);
      showNotification('success', `New order: ${data.order.orderId}`);
    };

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      console.log('🔄 Order updated:', data.order);
      setOrders(prev =>
        prev.map(order =>
          order._id === data.order._id ? data.order : order
        )
      );
      showNotification('info', `Order ${data.order.orderId} status: ${data.order.orderStatus}`);
    };

    // Listen for order cancellations
    const handleOrderCancelled = (data) => {
      console.log('❌ Order cancelled:', data.order);
      setOrders(prev =>
        prev.map(order =>
          order._id === data.order._id ? { ...order, orderStatus: 'cancelled' } : order
        )
      );
      showNotification('error', `Order ${data.order.orderId} cancelled`);
    };

    socket.on('order-created', handleNewOrder);
    socket.on('order-updated', handleOrderUpdate);
    socket.on('order-cancelled', handleOrderCancelled);

    return () => {
      socket.off('order-created', handleNewOrder);
      socket.off('order-updated', handleOrderUpdate);
      socket.off('order-cancelled', handleOrderCancelled);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    if (!loading && !user) {
      // router.push('/login');
      console.log('loading stutes-', loading, 'user stutes-', user)
    }
  }, [loading, user, router]);

  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(order => order.orderType === filterType);
    }

    if (filterPlacedBy !== 'all') {
      filtered = filtered.filter(order => order.placedBy === filterPlacedBy);
    }

    if (filterTable) {
      filtered = filtered.filter(order =>
        order.table?.tableNumber?.toString().includes(filterTable)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, filterPlacedBy, filterTable, orders]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('all');
    setFilterPlacedBy('all');
    setFilterTable('');
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // Find the order being updated
    const orderToUpdate = orders.find(o => o._id === orderId);
    if (!orderToUpdate) return;

    const oldStatus = orderToUpdate.orderStatus;

    // Optimistic update - update UI immediately
    setOrders(prev =>
      prev.map(o =>
        o._id === orderId ? { ...o, orderStatus: newStatus } : o
      )
    );

    // Close modal if open
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
    }

    try {
      const data = await ordersAPI.updateOrderStatus(orderId, newStatus);

      if (data.success) {
        // Update metrics
        const updatedOrders = orders.map(o =>
          o._id === orderId ? { ...o, orderStatus: newStatus } : o
        );
        const stats = {
          total: updatedOrders.length,
          pending: updatedOrders.filter(o => o.orderStatus === 'pending').length,
          preparing: updatedOrders.filter(o => o.orderStatus === 'preparing').length,
          ready: updatedOrders.filter(o => o.orderStatus === 'ready').length,
          served: updatedOrders.filter(o => o.orderStatus === 'served').length,
          completed: updatedOrders.filter(o => o.orderStatus === 'completed').length,
          cancelled: updatedOrders.filter(o => o.orderStatus === 'cancelled').length
        };
        setMetrics(stats);
        showNotification('success', 'Order status updated');
      } else {
        // Revert on failure
        setOrders(prev =>
          prev.map(o =>
            o._id === orderId ? { ...o, orderStatus: oldStatus } : o
          )
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, orderStatus: oldStatus } : null);
        }
        showNotification('error', 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      // Revert on error
      setOrders(prev =>
        prev.map(o =>
          o._id === orderId ? { ...o, orderStatus: oldStatus } : o
        )
      );
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, orderStatus: oldStatus } : null);
      }
      showNotification('error', 'Failed to update status');
    }
  };

  const handleCancelOrder = async (orderId) => {
    // Find the order being cancelled
    const orderToCancel = orders.find(o => o._id === orderId);
    if (!orderToCancel) return;

    const oldStatus = orderToCancel.orderStatus;

    // Optimistic update - update UI immediately
    setOrders(prev =>
      prev.map(o =>
        o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o
      )
    );

    // Close modal
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(null);
      setIsModalOpen(false);
    }

    try {
      const data = await ordersAPI.updateOrderStatus(orderId, 'cancelled');

      if (data.success) {
        // Update metrics
        const updatedOrders = orders.map(o =>
          o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o
        );
        const stats = {
          total: updatedOrders.length,
          pending: updatedOrders.filter(o => o.orderStatus === 'pending').length,
          preparing: updatedOrders.filter(o => o.orderStatus === 'preparing').length,
          ready: updatedOrders.filter(o => o.orderStatus === 'ready').length,
          served: updatedOrders.filter(o => o.orderStatus === 'served').length,
          completed: updatedOrders.filter(o => o.orderStatus === 'completed').length,
          cancelled: updatedOrders.filter(o => o.orderStatus === 'cancelled').length
        };
        setMetrics(stats);
        showNotification('success', 'Order cancelled');
      } else {
        // Revert on failure
        setOrders(prev =>
          prev.map(o =>
            o._id === orderId ? { ...o, orderStatus: oldStatus } : o
          )
        );
        showNotification('error', 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      // Revert on error
      setOrders(prev =>
        prev.map(o =>
          o._id === orderId ? { ...o, orderStatus: oldStatus } : o
        )
      );
      showNotification('error', 'Failed to cancel order');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    preparing: 'bg-blue-50 text-blue-700 border-blue-200',
    ready: 'bg-green-50 text-green-700 border-green-200',
    served: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-gray-50 text-gray-700 border-gray-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  };
  const orderStats = [
    { icon: TrendingUp, label: 'Total', value: metrics.total, color: 'blue' },
    { icon: Clock, label: 'Pending', value: metrics.pending, color: 'yellow' },
    { icon: Loader, label: 'Preparing', value: metrics.preparing, color: 'blue' },
    { icon: CheckCircle, label: 'Ready', value: metrics.ready, color: 'green' },
    { icon: UtensilsCrossed, label: 'Served', value: metrics.served, color: 'purple' },
    { icon: CheckCircle, label: 'Completed', value: metrics.completed, color: 'gray' },
    { icon: XCircle, label: 'Cancelled', value: metrics.cancelled, color: 'red' }
  ];



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="text-center">
          <Loader className="w-8 h-8 md:w-10 md:h-10 text-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-3 md:p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-3 right-3 z-50 animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-3 md:px-5 py-2 md:py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs md:text-sm max-w-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}

      <PageHeader
        icon={ShoppingBag}
        title="Orders Management"
        subtitle="Track and manage all orders"
        showRefreshButton={true}
        onRefreshClick={loadOrders}
        isRefreshing={isLoading}
      />

       <StatsCards stats={orderStats} columns={7} />

      {/* Filters & View Controls */}
       <ViewControls
        title="Orders"
        itemCount={filteredOrders.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridColumns={gridColumns}
        onGridColumnsChange={setGridColumns}
        availableColumns={[1, 2, 3, 4 ,5]}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search Order ID..."
        searchColSpan={2}
        filters={[
          {
            type: 'text',
            icon: Filter,
            placeholder: 'Table #...',
            value: filterTable,
            onChange: setFilterTable
          },
          {
            type: 'select',
            icon: Filter,
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'served', label: 'Served' },
              { value: 'cancelled', label: 'Cancelled' }
            ]
          },
          {
            type: 'select',
            icon: Filter,
            value: filterType,
            onChange: setFilterType,
            options: [
              { value: 'all', label: 'All Types' },
              { value: 'dine-in', label: 'Dine-In' },
              { value: 'counter', label: 'Counter' }
            ]
          }
        ]}
        onReset={handleResetFilters}
      />

      {/* Orders Display */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-red-200">
            <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm md:text-base text-gray-600 font-medium">{error}</p>
          </div>
        ) : currentOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-amber-100">
            <Package className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm md:text-base text-gray-600 font-medium">No orders found</p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className={`grid gap-2 md:gap-3 ${gridColumns === 1 ? 'grid-cols-1' :
              gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' :
                  gridColumns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
            {currentOrders.map((order) => (
              <button
                key={order._id}
                onClick={() => handleOrderClick(order)}
                className="bg-white rounded-xl border-2 border-gray-200 p-3 md:p-4 shadow-md hover:shadow-lg transition-all hover:scale-105 text-left"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-0.5">{order.orderId}</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      {new Date(order.orderedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border ${statusColors[order.orderStatus]}`}>
                    {order.orderStatus}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 md:space-y-2 mb-2 md:mb-3">
                  {order.table?.tableNumber && (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      <UtensilsCrossed className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600" />
                      <span className="text-[10px] md:text-xs font-semibold text-amber-700">Table {order.table.tableNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      {order.items?.length || 0} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      {order.estimatedTime || 0}m
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="pt-2 md:pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs text-gray-500">Total Amount</span>
                    <div className="flex items-center gap-0.5 md:gap-1">
                      <IndianRupee className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
                      <span className="text-base md:text-lg font-bold text-amber-600">
                        {order.orderAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <tr>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Order ID</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden sm:table-cell">Time</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden md:table-cell">Table</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Status</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Items</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-right text-xs md:text-sm font-bold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                      onClick={() => handleOrderClick(order)}
                    >
                      {/* Order ID */}
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <span className="font-bold text-gray-900 text-xs md:text-sm">{order.orderId}</span>
                      </td>

                      {/* Time */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {new Date(order.orderedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Table */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                        {order.table?.tableNumber ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-xs font-semibold text-amber-700 border border-amber-200">
                            <UtensilsCrossed className="w-3 h-3" />
                            Table {order.table.tableNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg font-bold text-[10px] md:text-xs border ${statusColors[order.orderStatus]}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                          <Package className="w-3 h-3" />
                          {order.items?.length || 0} items
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5 md:gap-1">
                          <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                          <span className="text-xs md:text-sm font-bold text-amber-600">
                            {order.orderAmount?.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-3 md:mt-4 bg-white rounded-lg shadow-sm p-3 flex items-center justify-between border border-gray-200">
            <p className="text-xs text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
              <span className="text-gray-400 mx-1">•</span>
              {filteredOrders.length} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-1 transition text-sm disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-1 transition text-sm disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusChange={handleStatusChange}
        onCancel={handleCancelOrder}
      />

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