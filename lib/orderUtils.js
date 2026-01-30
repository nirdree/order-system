// Order utility functions for formatting and status management

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  SERVED: 'served',
  CANCELLED: 'cancelled'
};

export const ORDER_TYPES = {
  DINE_IN: 'dine-in',
  COUNTER: 'counter'
};

export const PLACED_BY = {
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

// Status colors for UI
export const STATUS_COLORS = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  preparing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  served: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
};

// Status icons
export const STATUS_ICONS = {
  pending: '⏳',
  preparing: '👨‍🍳',
  served: '✓',
  cancelled: '✕'
};

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format time duration
export const formatDuration = (startDate, endDate) => {
  if (!startDate) return 'N/A';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diff = Math.floor((end - start) / 1000); // in seconds

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
};

// Get next available status
export const getNextStatus = (currentStatus) => {
  const statusFlow = {
    pending: ORDER_STATUSES.PREPARING,
    preparing: ORDER_STATUSES.SERVED,
    served: ORDER_STATUSES.SERVED, // No further status
    cancelled: ORDER_STATUSES.CANCELLED
  };
  return statusFlow[currentStatus] || currentStatus;
};

// Check if order can be cancelled
export const canCancelOrder = (status) => {
  return [ORDER_STATUSES.PENDING, ORDER_STATUSES.PREPARING].includes(status);
};

// Check if order can be updated
export const canUpdateStatus = (status) => {
  return status !== ORDER_STATUSES.CANCELLED && status !== ORDER_STATUSES.SERVED;
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Get status badge component data
export const getStatusBadgeData = (status) => {
  return {
    ...STATUS_COLORS[status],
    icon: STATUS_ICONS[status],
    label: status.charAt(0).toUpperCase() + status.slice(1)
  };
};

// Validate order filters
export const validateFilters = (filters) => {
  const validStatuses = Object.values(ORDER_STATUSES);
  const validTypes = Object.values(ORDER_TYPES);
  const validPlacedBy = Object.values(PLACED_BY);

  if (filters.status && filters.status !== 'all' && !validStatuses.includes(filters.status)) {
    return { valid: false, error: 'Invalid status filter' };
  }

  if (filters.orderType && filters.orderType !== 'all' && !validTypes.includes(filters.orderType)) {
    return { valid: false, error: 'Invalid order type filter' };
  }

  if (filters.placedBy && filters.placedBy !== 'all' && !validPlacedBy.includes(filters.placedBy)) {
    return { valid: false, error: 'Invalid placedBy filter' };
  }

  return { valid: true };
};

// Calculate order metrics
export const calculateOrderMetrics = (orders) => {
  if (!orders || orders.length === 0) {
    return {
      total: 0,
      pending: 0,
      preparing: 0,
      served: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }

  const metrics = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === ORDER_STATUSES.PENDING).length,
    preparing: orders.filter(o => o.orderStatus === ORDER_STATUSES.PREPARING).length,
    served: orders.filter(o => o.orderStatus === ORDER_STATUSES.SERVED).length,
    cancelled: orders.filter(o => o.orderStatus === ORDER_STATUSES.CANCELLED).length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.orderAmount || 0), 0),
  };

  metrics.averageOrderValue = metrics.total > 0 ? metrics.totalRevenue / metrics.total : 0;

  return metrics;
};
