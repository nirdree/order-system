'use client';
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, Filter, X, Eye, EyeOff,
  Save, UserPlus, Mail, Phone, Calendar, DollarSign,
  CheckCircle, AlertCircle, Loader, ChevronDown, User
} from 'lucide-react';
import { usersAPI } from '@/lib/api-client';
const UserManagement = () => {
 const [users, setUsers] = useState([]);
   const [filteredUsers, setFilteredUsers] = useState([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isEditMode, setIsEditMode] = useState(false);
   const [currentUser, setCurrentUser] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterRole, setFilterRole] = useState('all');
   const [filterStatus, setFilterStatus] = useState('all');
   const [showPassword, setShowPassword] = useState(false);
   const [notification, setNotification] = useState({ show: false, type: '', message: '' });
   const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null });
   const [isLoading, setIsLoading] = useState(false);
 
   const [formData, setFormData] = useState({
     name: '',
     email: '',
     password: '',
     role: 'staff',
     phone: '',
     salary: '',
     joiningDate: new Date().toISOString().split('T')[0],
     isActive: true
   });
 
   const [errors, setErrors] = useState({});
   const [touched, setTouched] = useState({});
 
   // Load users from API on component mount
   useEffect(() => {
     loadUsers();
   }, []);
 
   // Filter users when search term or filters change
   useEffect(() => {
     filterUsers();
   }, [searchTerm, filterRole, filterStatus, users]);
 
   // Load users from API
   const loadUsers = async () => {
     try {
       setIsLoading(true);
       const response = await usersAPI.getAllUsers();
       if (response.success) {
         setUsers(response.data);
         setFilteredUsers(response.data);
       } else {
         showNotification('error', 'Failed to load users');
       }
     } catch (error) {
       console.error('Error loading users:', error);
       showNotification('error', 'Failed to load users');
     } finally {
       setIsLoading(false);
     }
   };
 
   // Filter users based on search and filters
   const filterUsers = () => {
     let filtered = [...users];
 
     // Search filter
     if (searchTerm) {
       filtered = filtered.filter(user =>
         user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.phone?.includes(searchTerm)
       );
     }
 
     // Role filter
     if (filterRole !== 'all') {
       filtered = filtered.filter(user => user.role === filterRole);
     }
 
     // Status filter
     if (filterStatus !== 'all') {
       const isActive = filterStatus === 'active';
       filtered = filtered.filter(user => user.isActive === isActive);
     }
 
     setFilteredUsers(filtered);
   };
 
   // Show notification
   const showNotification = (type, message) => {
     setNotification({ show: true, type, message });
     setTimeout(() => {
       setNotification({ show: false, type: '', message: '' });
     }, 3000);
   };
 
   // Validation functions
   const validateEmail = (email) => {
     const emailRegex = /^\S+@\S+\.\S+$/;
     if (!email) return 'Email is required';
     if (!emailRegex.test(email)) return 'Please enter a valid email';
     // Check for duplicate email (excluding current user in edit mode)
     const duplicate = users.find(u =>
       u.email === email && (!isEditMode || u._id !== currentUser._id)
     );
     if (duplicate) return 'Email already exists';
     return '';
   };
 
   const validateName = (name) => {
     if (!name) return 'Name is required';
     if (name.length < 2) return 'Name must be at least 2 characters';
     return '';
   };
 
   const validatePassword = (password) => {
     if (!isEditMode && !password) return 'Password is required';
     if (password && password.length < 6) return 'Password must be at least 6 characters';
     return '';
   };
 
   const validatePhone = (phone) => {
     if (phone && !/^[+]?[\d\s-()]+$/.test(phone)) {
       return 'Please enter a valid phone number';
     }
     return '';
   };
 
   const validateSalary = (salary) => {
     if (salary && salary < 0) return 'Salary must be a positive number';
     return '';
   };
 
   // Validate field
   const validateField = (name, value) => {
     let error = '';
     switch (name) {
       case 'name':
         error = validateName(value);
         break;
       case 'email':
         error = validateEmail(value);
         break;
       case 'password':
         error = validatePassword(value);
         break;
       case 'phone':
         error = validatePhone(value);
         break;
       case 'salary':
         error = validateSalary(value);
         break;
       default:
         break;
     }
     setErrors(prev => ({ ...prev, [name]: error }));
     return error;
   };
 
   // Handle form input change
   const handleInputChange = (e) => {
     const { name, value, type, checked } = e.target;
     const fieldValue = type === 'checkbox' ? checked : value;
 
     setFormData(prev => ({
       ...prev,
       [name]: fieldValue
     }));
 
     if (touched[name]) {
       validateField(name, fieldValue);
     }
   };
 
   // Handle blur
   const handleBlur = (e) => {
     const { name, value } = e.target;
     setTouched(prev => ({ ...prev, [name]: true }));
     validateField(name, value);
   };
 
   // Validate entire form
   const validateForm = () => {
     const nameError = validateName(formData.name);
     const emailError = validateEmail(formData.email);
     const passwordError = validatePassword(formData.password);
     const phoneError = validatePhone(formData.phone);
     const salaryError = validateSalary(formData.salary);
 
     const newErrors = {
       name: nameError,
       email: emailError,
       password: passwordError,
       phone: phoneError,
       salary: salaryError
     };
 
     setErrors(newErrors);
     setTouched({
       name: true,
       email: true,
       password: true,
       phone: true,
       salary: true
     });
 
     return !Object.values(newErrors).some(error => error !== '');
   };
 
   // Open modal for adding new user
   const openAddModal = () => {
     setIsEditMode(false);
     setCurrentUser(null);
     setFormData({
       name: '',
       email: '',
       password: '',
       role: 'staff',
       phone: '',
       salary: '',
       joiningDate: new Date().toISOString().split('T')[0],
       isActive: true
     });
     setErrors({});
     setTouched({});
     setShowPassword(false);
     setIsModalOpen(true);
   };
 
   // Open modal for editing user
   const openEditModal = (user) => {
     if (user.role === 'owner') {
       showNotification('error', 'Owner account cannot be edited');
       return;
     }
     setIsEditMode(true);
     setCurrentUser(user);
     setFormData({
       name: user.name,
       email: user.email,
       password: '',
       role: user.role,
       phone: user.phone || '',
       salary: user.salary || '',
       joiningDate: new Date(user.joiningDate).toISOString().split('T')[0],
       isActive: user.isActive
     });
     setErrors({});
     setTouched({});
     setShowPassword(false);
     setIsModalOpen(true);
   };
 
   // Close modal
   const closeModal = () => {
     setIsModalOpen(false);
     setIsEditMode(false);
     setCurrentUser(null);
     setFormData({
       name: '',
       email: '',
       password: '',
       role: 'staff',
       phone: '',
       salary: '',
       joiningDate: new Date().toISOString().split('T')[0],
       isActive: true
     });
     setErrors({});
     setTouched({});
   };
 
   // Handle form submit
   const handleSubmit = async (e) => {
     e.preventDefault();
 
     if (!validateForm()) {
       showNotification('error', 'Please fix all errors before submitting');
       return;
     }
 
     setIsLoading(true);
 
     try {
       if (isEditMode) {
         // Update existing user
         const updateData = {
           name: formData.name,
           email: formData.email,
           role: formData.role,
           phone: formData.phone,
           salary: parseFloat(formData.salary) || 0,
           joiningDate: formData.joiningDate,
           isActive: formData.isActive
         };
 
         // Only include password if it was changed
         if (formData.password) {
           updateData.password = formData.password;
         }
 
         const response = await usersAPI.updateUser(currentUser._id, updateData);
         
         if (response.success) {
           showNotification('success', 'User updated successfully');
           await loadUsers(); // Reload users from API
           closeModal();
         } else {
           showNotification('error', response.message || 'Failed to update user');
         }
       } else {
         // Create new user
         const newUserData = {
           name: formData.name,
           email: formData.email,
           password: formData.password,
           role: formData.role,
           phone: formData.phone,
           salary: parseFloat(formData.salary) || 0,
           joiningDate: formData.joiningDate,
           isActive: formData.isActive
         };
 
         const response = await usersAPI.createUser(newUserData);
         
         if (response.success) {
           showNotification('success', 'User created successfully');
           await loadUsers(); // Reload users from API
           closeModal();
         } else {
           showNotification('error', response.message || 'Failed to create user');
         }
       }
     } catch (error) {
       console.error('Error submitting form:', error);
       showNotification('error', 'An error occurred. Please try again.');
     } finally {
       setIsLoading(false);
     }
   };
 
   // Delete user
   const handleDelete = (userId) => {
     const user = users.find(u => u._id === userId);
     if (user.role === 'owner') {
       showNotification('error', 'Owner account cannot be deleted');
       return;
     }
     setDeleteConfirm({ show: true, userId });
   };
 
   const confirmDelete = async () => {
     try {
       setIsLoading(true);
       const response = await usersAPI.deleteUser(deleteConfirm.userId);
       
       if (response.success) {
         showNotification('success', 'User deleted successfully');
         await loadUsers(); // Reload users from API
       } else {
         showNotification('error', response.message || 'Failed to delete user');
       }
     } catch (error) {
       console.error('Error deleting user:', error);
       showNotification('error', 'Failed to delete user');
     } finally {
       setIsLoading(false);
       setDeleteConfirm({ show: false, userId: null });
     }
   };
 
   // Toggle user status
   const toggleUserStatus = async (userId) => {
     const user = users.find(u => u._id === userId);
     if (user.role === 'owner') {
       showNotification('error', 'Owner account status cannot be changed');
       return;
     }
 
     try {
       setIsLoading(true);
       const response = await usersAPI.updateUser(userId, {
         isActive: !user.isActive
       });
       
       if (response.success) {
         showNotification('success', `User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
         await loadUsers(); // Reload users from API
       } else {
         showNotification('error', response.message || 'Failed to update user status');
       }
     } catch (error) {
       console.error('Error toggling user status:', error);
       showNotification('error', 'Failed to update user status');
     } finally {
       setIsLoading(false);
     }
   };
 
   // Get role badge color
   const getRoleBadgeColor = (role) => {
     switch (role) {
       case 'owner':
         return 'bg-gradient-to-r from-purple-500 to-pink-500';
       case 'manager':
         return 'bg-gradient-to-r from-blue-500 to-cyan-500';
       case 'staff':
         return 'bg-gradient-to-r from-green-500 to-emerald-500';
       default:
         return 'bg-gray-500';
     }
   };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 animate-slide-in-right ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-600">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, userId: null })}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border-2 border-amber-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage your cafe staff and team members</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-orange-600 hover:to-rose-600 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border-2 border-amber-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-blue-700">{users.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-700">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Managers</p>
              <p className="text-2xl font-bold text-purple-700">
                {users.filter(u => u.role === 'manager').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
              <p className="text-sm text-gray-600 mb-1">Staff</p>
              <p className="text-2xl font-bold text-amber-700">
                {users.filter(u => u.role === 'staff').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border-2 border-amber-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-500 to-orange-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">User</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Salary</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Joining Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-gray-100 p-6 rounded-full">
                          <Users className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold text-lg">No users found</p>
                          <p className="text-gray-500 text-sm">Try adjusting your filters or add a new user</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${getRoleBadgeColor(user.role)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{user.phone || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-semibold">₹{user.salary?.toLocaleString() || '0'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {new Date(user.joiningDate).toLocaleDateString('en-IN')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(user._id)}
                          disabled={user.role === 'owner'}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${user.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                            } transition-colors ${user.role === 'owner' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={user.role === 'owner'}
                            className={`p-2 rounded-lg transition-colors ${user.role === 'owner'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  {isEditMode ? <Edit className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit User' : 'Add New User'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.name && touched.name
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                      }`}
                  />
                  {errors.name && touched.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="john@cafe.com"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.email && touched.email
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                        }`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password {!isEditMode && '*'}
                    {isEditMode && <span className="text-gray-500 font-normal text-xs ml-2">(Leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      className={`w-full px-4 pr-12 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.password && touched.password
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="+91 9876543210"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.phone && touched.phone
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                        }`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Salary (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="25000"
                      min="0"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.salary && touched.salary
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                        }`}
                    />
                  </div>
                  {errors.salary && touched.salary && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.salary}
                    </p>
                  )}
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Joining Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">
                      Active User
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isEditMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;