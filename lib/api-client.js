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