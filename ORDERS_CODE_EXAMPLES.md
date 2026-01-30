## Orders Page - Developer Code Examples

### Component Structure

#### Main Orders Page (`app/owner/orders/page.js`)
```javascript
'use client';

// Key hooks and state
const [orders, setOrders] = useState([]);
const [filters, setFilters] = useState({
  status: 'all',
  orderType: 'all',
  placedBy: 'all',
  search: ''
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  pages: 1
});

// Real-time polling
useEffect(() => {
  fetchOrders(1);
  const interval = setInterval(() => {
    fetchOrders(pagination.page);
  }, POLLING_INTERVAL); // 3 seconds
  return () => clearInterval(interval);
}, [fetchOrders, pagination.page]);
```

---

### API Integration Examples

#### 1. Fetch Orders with Filters
```javascript
const fetchOrders = async (page = 1) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: pagination.limit.toString(),
    status: filters.status,
    orderType: filters.orderType,
    placedBy: filters.placedBy,
    ...(filters.search && { search: filters.search })
  });

  const response = await fetch(`/api/orders?${params}`);
  const data = await response.json();
  
  setOrders(data.data.orders);
  setPagination(data.data.pagination);
};
```

#### 2. Update Order Status
```javascript
const handleStatusChange = async (orderId, newStatus) => {
  // Optimistic update
  setOrders(prev => prev.map(order =>
    order._id === orderId
      ? { ...order, orderStatus: newStatus }
      : order
  ));

  // API call
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ orderStatus: newStatus })
  });

  // Refresh data
  fetchOrders(pagination.page);
};
```

#### 3. Cancel Order
```javascript
const handleCancelOrder = async (orderId) => {
  if (!confirm('Cancel this order?')) return;

  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ 
      orderStatus: ORDER_STATUSES.CANCELLED 
    })
  });

  fetchOrders(pagination.page);
};
```

---

### Filter Management Examples

#### 1. Apply Single Filter
```javascript
const handleFilterChange = (filterName, value) => {
  setFilters(prev => ({
    ...prev,
    [filterName]: value
  }));
  // Reset to page 1
  setPagination(prev => ({ ...prev, page: 1 }));
};

// Usage
handleFilterChange('status', 'pending');
handleFilterChange('orderType', 'dine-in');
handleFilterChange('search', 'ORD-123');
```

#### 2. Reset All Filters
```javascript
const handleResetFilters = () => {
  setFilters({
    status: 'all',
    orderType: 'all',
    placedBy: 'all',
    search: ''
  });
  setPagination(prev => ({ ...prev, page: 1 }));
};
```

---

### Pagination Examples

#### 1. Navigate Pages
```javascript
const handleNextPage = () => {
  if (pagination.page < pagination.pages) {
    const newPage = pagination.page + 1;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchOrders(newPage);
  }
};

const handlePreviousPage = () => {
  if (pagination.page > 1) {
    const newPage = pagination.page - 1;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchOrders(newPage);
  }
};
```

#### 2. Change Items Per Page
```javascript
const handleChangeLimit = (newLimit) => {
  setPagination(prev => ({
    ...prev,
    limit: newLimit,
    page: 1  // Reset to first page
  }));
};
```

---

### Utility Functions Examples

#### 1. Format Date
```javascript
import { formatDate } from '@/lib/orderUtils';

// Usage
const formatted = formatDate('2026-01-30T10:30:00');
// Output: "Jan 30, 2026, 10:30 AM"
```

#### 2. Format Currency
```javascript
import { formatCurrency } from '@/lib/orderUtils';

// Usage
const price = formatCurrency(49.99);
// Output: "$49.99"
```

#### 3. Check Order Status Availability
```javascript
import { 
  canUpdateStatus, 
  canCancelOrder,
  getNextStatus 
} from '@/lib/orderUtils';

// Check if can update
if (canUpdateStatus(order.orderStatus)) {
  // Show update button
}

// Check if can cancel
if (canCancelOrder(order.orderStatus)) {
  // Show cancel button
}

// Get next status
const nextStatus = getNextStatus('pending'); // Returns 'preparing'
```

#### 4. Calculate Metrics
```javascript
import { calculateOrderMetrics } from '@/lib/orderUtils';

const metrics = calculateOrderMetrics(orders);
// Returns:
// {
//   total: 45,
//   pending: 10,
//   preparing: 8,
//   served: 25,
//   cancelled: 2,
//   totalRevenue: 1200,
//   averageOrderValue: 26.67
// }
```

---

### Component Usage Examples

#### 1. OrderCard Component
```javascript
import OrderCard from '@/components/OrderCard';

<OrderCard
  order={order}
  onStatusChange={(orderId, newStatus) => {
    handleStatusChange(orderId, newStatus);
  }}
  onCancel={(orderId) => {
    handleCancelOrder(orderId);
  }}
  isUpdating={isUpdating}
/>
```

---

### Error Handling Examples

#### 1. Display Error Message
```javascript
const [error, setError] = useState(null);

const fetchOrders = async () => {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) throw new Error('Failed to fetch');
    // ...
  } catch (err) {
    setError(err.message);
  }
};

// In JSX
{error && (
  <div className="p-4 bg-red-100 border border-red-400 rounded">
    <p>{error}</p>
    <button onClick={() => setError(null)}>Dismiss</button>
  </div>
)}
```

#### 2. Error with Retry
```javascript
const [retrying, setRetrying] = useState(false);

const handleRetry = async () => {
  setRetrying(true);
  setError(null);
  try {
    await fetchOrders(1);
  } catch (err) {
    setError(err.message);
  } finally {
    setRetrying(false);
  }
};
```

---

### Advanced Filtering Examples

#### 1. Complex Filter Combination
```javascript
// Fetch pending dine-in orders placed by staff
const params = new URLSearchParams({
  page: '1',
  limit: '10',
  status: 'pending',
  orderType: 'dine-in',
  placedBy: 'staff'
});

fetch(`/api/orders?${params}`);
```

#### 2. Search with Filters
```javascript
// Search for specific order with status filter
const params = new URLSearchParams({
  page: '1',
  limit: '10',
  search: 'ORD-123',
  status: 'preparing'
});

fetch(`/api/orders?${params}`);
```

---

### Real-Time Polling Examples

#### 1. Configure Polling Interval
```javascript
const POLLING_INTERVAL = 3000; // 3 seconds
const pollingIntervalRef = useRef(null);

// Setup polling
pollingIntervalRef.current = setInterval(() => {
  fetchOrders(pagination.page);
}, POLLING_INTERVAL);

// Cleanup
return () => clearInterval(pollingIntervalRef.current);
```

#### 2. Pause Polling When Not Mounted
```javascript
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

const fetchOrders = async () => {
  if (isMountedRef.current) {
    // Update state only if component is mounted
    setOrders(data);
  }
};
```

---

### Optimistic UI Examples

#### 1. Immediate Status Update
```javascript
// Show update immediately to user
setOrders(prev => prev.map(order =>
  order._id === orderId
    ? { ...order, orderStatus: newStatus }
    : order
));

// Then sync with backend
const response = await fetch(`/api/orders/${orderId}`, {
  method: 'PUT',
  body: JSON.stringify({ orderStatus: newStatus })
});

// Refresh to ensure consistency
setTimeout(() => fetchOrders(pagination.page), 500);
```

---

### Loading State Examples

#### 1. Loading Spinner
```javascript
{isLoading ? (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 
                    border-amber-900 mx-auto mb-4"></div>
    <p>Loading orders...</p>
  </div>
) : (
  // Content
)}
```

#### 2. Empty State
```javascript
{orders.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-lg">
    <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
    <p className="text-gray-600">No orders found</p>
    <p className="text-gray-500">Try adjusting your filters</p>
  </div>
) : (
  // Orders list
)}
```

---

### Testing Examples

#### 1. Mock Orders Data
```javascript
const mockOrders = [
  {
    _id: '1',
    orderId: 'ORD-123',
    orderStatus: 'pending',
    orderType: 'dine-in',
    orderAmount: 49.99,
    items: [
      { name: 'Burger', quantity: 2, price: 12.99, subtotal: 25.98 }
    ],
    createdAt: new Date().toISOString(),
    table: { tableNumber: 5 }
  }
];
```

#### 2. Test Filter Application
```javascript
// Test if filters correctly filter orders
const filtered = orders.filter(o => o.orderStatus === 'pending');
expect(filtered.length).toBe(expectedCount);
```

---

### Browser Compatibility Notes

```javascript
// Features used that require modern browser:
- fetch API (IE 11 needs polyfill)
- URLSearchParams (IE 11 needs polyfill)
- Object spread syntax (IE 11 needs transpilation)
- Array methods like map, filter (IE 8 needs polyfill)
- CSS Grid/Flexbox (IE 10 not fully supported)
```

---

### Performance Optimization Tips

```javascript
// 1. Memoize filter change handler
const handleFilterChange = useCallback((filterName, value) => {
  setFilters(prev => ({ ...prev, [filterName]: value }));
}, []);

// 2. Use ref for non-state values
const pollingIntervalRef = useRef(null);

// 3. Debounce search input
const [searchTimeout, setSearchTimeout] = useState(null);

const handleSearch = (value) => {
  clearTimeout(searchTimeout);
  const timeout = setTimeout(() => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 300);
  setSearchTimeout(timeout);
};

// 4. Lazy load order details
const [expandedOrders, setExpandedOrders] = useState({});

const toggleExpand = (orderId) => {
  setExpandedOrders(prev => ({
    ...prev,
    [orderId]: !prev[orderId]
  }));
};
```

---

### Common Patterns

#### 1. Loading + Error + Data State
```javascript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (orders.length === 0) return <EmptyState />;
return <OrdersList orders={orders} />;
```

#### 2. Conditional Rendering
```javascript
{order.orderStatus !== 'cancelled' && (
  <button onClick={() => handleStatusChange(order._id, 'preparing')}>
    Update Status
  </button>
)}
```

---

### Customization Examples

#### 1. Change Polling Interval
```javascript
// In page.js, change:
const POLLING_INTERVAL = 5000; // 5 seconds instead of 3
```

#### 2. Change Default Page Limit
```javascript
// In page.js, change:
const DEFAULT_LIMIT = 20; // Show 20 items per page instead of 10
```

#### 3. Add Custom Status Colors
```javascript
// In lib/orderUtils.js:
export const STATUS_COLORS = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  // Add your custom colors here
  custom: { bg: 'bg-purple-100', text: 'text-purple-800' }
};
```

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2026
