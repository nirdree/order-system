// lib/api-client.js - Frontend API helper
const API_BASE = '/api';

// Generic API call wrapper
async function apiCall(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies
    ...options,
  };

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
      // Return error objects instead of throwing for better mobile compatibility
      return { 
        error: data.error || `API error: ${response.status}`,
        status: response.status,
        details: data
      };
    }

    return data;
  } catch (error) {
    // Return error object instead of throwing for better mobile compatibility
    return { 
      error:  'Network error. Please check your connection and try again.',
      networkError: true
    };
  }
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
    try {
      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      return await response.json();
    } catch (error) {
      console.error('Add item to order error:', error);
      return { success: false, message: 'Failed to add item to order' };
    }
  },

  // Update order item quantity
  updateOrderItem: async (orderId, itemId, updateData) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update order item error:', error);
      return { success: false, message: 'Failed to update order item' };
    }
  },

  // Delete item from order
  deleteOrderItem: async (orderId, itemId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('Delete order item error:', error);
      return { success: false, message: 'Failed to delete order item' };
    }
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