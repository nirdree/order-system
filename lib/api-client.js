// lib/api-client.js - Frontend API helper with caching and deduplication
const API_BASE = '/api';

// Cache for GET requests (in-memory)
const requestCache = new Map();
const requestInFlight = new Map();

// Cache configuration (in milliseconds)
const CACHE_DURATION = {
  users: 5 * 60 * 1000,      // 5 minutes
  tables: 5 * 60 * 1000,     // 5 minutes
  categories: 10 * 60 * 1000, // 10 minutes
  menuItems: 10 * 60 * 1000,  // 10 minutes
  sessions: 30 * 1000,       // 30 seconds
  orders: 30 * 1000,         // 30 seconds
  default: 5 * 60 * 1000,    // 5 minutes
};

function getCacheDuration(endpoint) {
  if (endpoint.includes('/users')) return CACHE_DURATION.users;
  if (endpoint.includes('/tables')) return CACHE_DURATION.tables;
  if (endpoint.includes('/categories')) return CACHE_DURATION.categories;
  if (endpoint.includes('/menu-items')) return CACHE_DURATION.menuItems;
  if (endpoint.includes('/sessions')) return CACHE_DURATION.sessions;
  if (endpoint.includes('/orders')) return CACHE_DURATION.orders;
  return CACHE_DURATION.default;
}

function clearCache(pattern) {
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key);
    }
  }
}

// Generic API call wrapper with caching and deduplication
async function apiCall(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies
    ...options,
  };

  // Only cache GET requests
  const isGetRequest = !config.method || config.method === 'GET';
  const cacheKey = isGetRequest ? `${API_BASE}${endpoint}` : null;

  // Check cache first
  if (isGetRequest && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < getCacheDuration(endpoint)) {
      return cached.data;
    } else {
      requestCache.delete(cacheKey);
    }
  }

  // Check if request is already in flight (deduplication)
  if (isGetRequest && requestInFlight.has(cacheKey)) {
    return requestInFlight.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      // Try to parse as JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || `API error: ${response.status}` };
      }

      if (!response.ok) {
        // Handle error responses
        if (data.success === false && data.error) {
          return {
            success: false,
            error: data.error.message,
            message: data.error.message,
            status: response.status,
            details: data
          };
        }
        
        return { 
          success: false,
          error: data.error || `API error: ${response.status}`,
          message: data.error || `API error: ${response.status}`,
          status: response.status,
          details: data
        };
      }

      // Cache successful GET responses
      if (isGetRequest && cacheKey) {
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      // Clear related caches on mutations
      if (config.method && config.method !== 'GET') {
        if (endpoint.includes('/users')) clearCache('/users');
        if (endpoint.includes('/tables')) clearCache('/tables');
        if (endpoint.includes('/categories')) clearCache('/categories');
        if (endpoint.includes('/menu-items')) clearCache('/menu-items');
        if (endpoint.includes('/sessions')) clearCache('/sessions');
        if (endpoint.includes('/orders')) clearCache('/orders');
      }

      return data;
    } catch (error) {
      // Return error object instead of throwing
      return { 
        success: false,
        error: 'Network error. Please check your connection and try again.',
        message: 'Network error. Please check your connection and try again.',
        networkError: true
      };
    } finally {
      // Remove from in-flight requests
      if (isGetRequest && cacheKey) {
        requestInFlight.delete(cacheKey);
      }
    }
  })();

  // Store promise in flight if it's a GET request
  if (isGetRequest && cacheKey) {
    requestInFlight.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

// Export cache clearing function for manual cache invalidation
export function invalidateCache(pattern) {
  clearCache(pattern);
}

// Auth API
export const authAPI = {
  login: async (email, password) => {
    return await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (signupData) => {
    return await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  },

  logout: async () => {
    return await apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return await apiCall('/auth/me');
  },

  forgotPassword: async (email) => {
    return await apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token, password, confirmPassword) => {
    return await apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    });
  },
};

export const usersAPI = {
  createUser: async (userData) => {
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  getAllUsers: async () => {
    return await apiCall('/users');
  },
  
  updateUser: async (userId, userData) => {
    return await apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  deleteUser: async (userId) => {
    return await apiCall(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

export const tablesAPI = {
  createTable: async (tableData) => {
    return await apiCall('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  },
  
  getAllTables: async () => {
    return await apiCall('/tables');
  },
  
  updateTable: async (tableId, tableData) => {
    return await apiCall(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify(tableData),
    });
  },
  
  deleteTable: async (tableId) => {
    return await apiCall(`/tables/${tableId}`, {
      method: 'DELETE',
    });
  },
  getTableById: async(tableId)=>{
      return await apiCall(`/tables/${tableId}`);
  }
};

export const categoriesAPI = {
  createCategory: async (categoryData) => {
    return await apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },
  
  getAllCategories: async () => {
    return await apiCall('/categories');
  },
  
  updateCategory: async (categoryId, categoryData) => {
    return await apiCall(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },
  
  deleteCategory: async (categoryId) => {
    return await apiCall(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },
};
export const menuItemsAPI = {
  createMenuItem: async (menuItemData) => {
    return await apiCall('/menu-items', {
      method: 'POST',
      body: JSON.stringify(menuItemData),
    });
  },
  
  getAllMenuItems: async () => {
    return await apiCall('/menu-items');
  },
  
  updateMenuItem: async (itemId, itemData) => {
    return await apiCall(`/menu-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },
  
  deleteMenuItem: async (menuItemId) => {
    return await apiCall(`/menu-items/${menuItemId}`, {
      method: 'DELETE',
    });
  },
};
// Sessions API
export const sessionsAPI = {
  // Get all sessions
  getAllSessions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.initiatedBy) params.append('initiatedBy', filters.initiatedBy);
    if (filters.tableId) params.append('tableId', filters.tableId);

    const url = `/sessions${params.toString() ? `?${params.toString()}` : ''}`;
    return apiCall(url);
  },

  // Get single session
  getSession: async (id) => {
    return apiCall(`/sessions/${id}`);
  },

  // Get session by table ID (Public - No auth required)
  getSessionByTableId: async (tableId) => {
    return apiCall(`/sessions/public/${tableId}`);
  },

  // Create session
  createSession: async (sessionData) => {
    return apiCall(`/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  // Update session
  updateSession: async (id, sessionData) => {
    return apiCall(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  },

  // Complete session
  completeSession: async (id, paymentData) => {
    return apiCall(`/sessions/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  },

  // Cancel/Delete session
  deleteSession: async (id) => {
    return apiCall(`/sessions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersAPI = {
  // Get all orders
  getAllOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.orderType) params.append('orderType', filters.orderType);
    if (filters.placedBy) params.append('placedBy', filters.placedBy);
    if (filters.sessionId) params.append('sessionId', filters.sessionId);
    if (filters.tableId) params.append('tableId', filters.tableId);

    const url = `/orders${params.toString() ? `?${params.toString()}` : ''}`;
    return apiCall(url);
  },

  // Get single order
  getOrder: async (id) => {
    return apiCall(`/orders/${id}`);
  },

  // Create order (staff)
  createOrder: async (orderData) => {
    return apiCall(`/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Update order
  updateOrder: async (id, orderData) => {
    return apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    return apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ orderStatus: status }),
    });
  },

  // Cancel/Delete order
  deleteOrder: async (id) => {
    return apiCall(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
  addItemToOrder: async (orderId, itemData) => {
    return await apiCall(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  // Update order item quantity
  updateOrderItem: async (orderId, itemId, updateData) => {
    return await apiCall(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete item from order
  deleteOrderItem: async (orderId, itemId) => {
    return await apiCall(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }
};

// Customer API (Public - No auth)
export const customerAPI = {
  // Get menu for table
  getMenuForTable: async (tableId) => {
    console.log('Fetching menu for table:', tableId);
    return apiCall(`/menu/${tableId}`);
  },

  // Place customer order
  placeOrder: async (orderData) => {
    return apiCall(`/customer`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get order status
  getOrderStatus: async (orderId) => {
    return apiCall(`/customer/order/${orderId}/status`);
  },
};

// Dashboard API
export const dashboardAPI = {
  // Get all dashboard statistics
  getStats: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;
    return apiCall(url);
  },
};

export const settingsAPI = {
  createSettings: async (settingsData) => {
    return await apiCall('/settings', {
      method: 'POST',
      body: JSON.stringify(settingsData),
    });
  },
  
  getAllSettings: async () => {
    return await apiCall('/settings');
  },
  
  updateSettings: async (settingsId, settingsData) => {
    return await apiCall(`/settings/${settingsId}`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },
  
  deleteSettings: async (settingsId) => {
    return await apiCall(`/settings/${settingsId}`, {
      method: 'DELETE',
    });
  },
};

// Explanations API
export const explanationsAPI = {
  createExplanation: async (data) => {
    return await apiCall('/explanations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getAllExplanations: async () => {
    return await apiCall('/explanations');
  },
  
  updateExplanation: async (id, data) => {
    return await apiCall(`/explanations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  deleteExplanation: async (id) => {
    return await apiCall(`/explanations/${id}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const explanationCategoriesAPI = {
  createCategory: async (data) => {
    return await apiCall('/explanation-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getAllCategories: async () => {
    return await apiCall('/explanation-categories');
  },
  
  updateCategory: async (id, data) => {
    return await apiCall(`/explanation-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  deleteCategory: async (id) => {
    return await apiCall(`/explanation-categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Example usage in your React component:
/*
import { authAPI, studentAPI } from '@/lib/api-client';

// Login
const handleLogin = async (email, password) => {
  try {
    const { user } = await authAPI.login(email, password);
    setUser(user);
  } catch (error) {
    setError(error.message);
  }
};

// Get students
const loadStudents = async () => {
  try {
    const { students } = await studentAPI.getAll();
    setStudents(students);
  } catch (error) {
  }
};

// Add student
const handleAddStudent = async (studentData) => {
  try {
    const { student } = await studentAPI.create(studentData);
    setStudents([...students, student]);
  } catch (error) {
    alert(error.message);
  }
};
*/