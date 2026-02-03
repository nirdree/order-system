'use client';
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, Filter, X, Eye, EyeOff,
  Save, UserPlus, Mail, Phone, Calendar, DollarSign,
  CheckCircle, AlertCircle, Loader, ChevronDown, User,
  LayoutGrid, List, RotateCcw, MapPin, IndianRupee, Shield
} from 'lucide-react';
import { usersAPI } from '@/lib/api-client';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatsCards from '@/components/StatsCards';
import ViewControls from '@/components/ViewControls';

const UserManagement = () => {
  const router = useRouter();
  const { user, loading, logout } = useUser();
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
  const currentUserRole = user?.role || '';

  // View Mode
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
  const [gridColumns, setGridColumns] = useState(3); // 1, 2, 3, 4 columns

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

  useEffect(() => {
    if (!loading) {
      if (!user || currentUserRole === 'staff') {
        router.push('/login');
        return;
      }
      loadUsers();
    }
  }, [loading, user, router]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterStatus, users]);

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

  const filterUsers = () => {
    let filtered = [...users];
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }
    setFilteredUsers(filtered);
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
  };

  const validateEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email';
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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

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

  // Helper function to check if user can be edited
  const canEditUser = (targetUser) => {
    if (currentUserRole === 'admin') {
      // Admin can edit everyone except other admins
      return targetUser.role !== 'admin';
    } else if (currentUserRole === 'owner') {
      // Owner can edit staff and managers only (NOT admin or owner)
      return targetUser.role === 'staff' || targetUser.role === 'manager';
    }
    return false;
  };

  // Helper function to check if user can be deleted
  const canDeleteUser = (targetUser) => {
    if (currentUserRole === 'admin') {
      // Admin can delete everyone except other admins
      return targetUser.role !== 'admin';
    } else if (currentUserRole === 'owner') {
      // Owner can delete staff and managers only (NOT admin or owner)
      return targetUser.role === 'staff' || targetUser.role === 'manager';
    }
    return false;
  };

  // Helper function to check if user status can be toggled
  const canToggleUserStatus = (targetUser) => {
    if (currentUserRole === 'admin') {
      // Admin can toggle everyone except other admins
      return targetUser.role !== 'admin';
    } else if (currentUserRole === 'owner') {
      // Owner can toggle staff and managers only (NOT admin or owner)
      return targetUser.role === 'staff' || targetUser.role === 'manager';
    }
    return false;
  };

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

  const openEditModal = (targetUser) => {
    if (!canEditUser(targetUser)) {
      if (currentUserRole === 'admin' && targetUser.role === 'admin') {
        showNotification('error', 'Admin cannot edit other admin accounts');
      } else if (currentUserRole === 'owner') {
        showNotification('error', 'Owner can only edit staff and manager accounts');
      }
      return;
    }

    setIsEditMode(true);
    setCurrentUser(targetUser);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role,
      phone: targetUser.phone || '',
      salary: targetUser.salary || '',
      joiningDate: new Date(targetUser.joiningDate).toISOString().split('T')[0],
      isActive: targetUser.isActive
    });
    setErrors({});
    setTouched({});
    setShowPassword(false);
    setIsModalOpen(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification('error', 'Please fix all errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          salary: parseFloat(formData.salary) || 0,
          joiningDate: formData.joiningDate,
          isActive: formData.isActive
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const response = await usersAPI.updateUser(currentUser._id, updateData);
        if (response.success) {
          showNotification('success', 'User updated successfully');
          await loadUsers();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to update user');
        }
      } else {
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
          await loadUsers();
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

  const handleDelete = (userId) => {
    const targetUser = users.find(u => u._id === userId);
    
    if (!canDeleteUser(targetUser)) {
      if (currentUserRole === 'admin' && targetUser.role === 'admin') {
        showNotification('error', 'Admin cannot delete other admin accounts');
      } else if (currentUserRole === 'owner') {
        showNotification('error', 'Owner can only delete staff and manager accounts');
      }
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
        await loadUsers();
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

  const toggleUserStatus = async (userId) => {
    const targetUser = users.find(u => u._id === userId);
    
    if (!canToggleUserStatus(targetUser)) {
      if (currentUserRole === 'admin' && targetUser.role === 'admin') {
        showNotification('error', 'Admin cannot change other admin status');
      } else if (currentUserRole === 'owner') {
        showNotification('error', 'Owner can only change staff and manager status');
      }
      return;
    }

    try {
      setIsLoading(true);
      const response = await usersAPI.updateUser(userId, {
        isActive: !targetUser.isActive
      });
      if (response.success) {
        showNotification('success', `User ${!targetUser.isActive ? 'activated' : 'deactivated'} successfully`);
        await loadUsers();
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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-rose-500';
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

  // Get available role options based on current user role
  const getRoleOptions = () => {
    if (currentUserRole === 'admin') {
      // Admin can create/edit all roles except admin
      return [
        { value: 'staff', label: 'Staff' },
        { value: 'manager', label: 'Manager' },
        { value: 'owner', label: 'Owner' }
      ];
    } else if (currentUserRole === 'owner') {
      // Owner can create/edit only manager and staff
      return [
        { value: 'staff', label: 'Staff' },
        { value: 'manager', label: 'Manager' }
      ];
    }
    return [{ value: 'staff', label: 'Staff' }];
  };

  // Get filter role options
  const getFilterRoleOptions = () => {
    const baseOptions = [{ value: 'all', label: 'All Roles' }];
    
    if (currentUserRole === 'admin') {
      return [
        ...baseOptions,
        { value: 'admin', label: 'Admin' },
        { value: 'owner', label: 'Owner' },
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' }
      ];
    } else if (currentUserRole === 'owner') {
      return [
        ...baseOptions,
        { value: 'owner', label: 'Owner' },
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' }
      ];
    }
    return [...baseOptions, { value: 'staff', label: 'Staff' }];
  };

  const userStats = [
    { 
      icon: Users, 
      label: 'Total Users', 
      value: users.length, 
      color: 'blue' 
    },
    { 
      icon: CheckCircle, 
      label: 'Active Users', 
      value: users.filter(u => u.isActive).length, 
      color: 'green' 
    },
    { 
      icon: User, 
      label: 'Managers', 
      value: users.filter(u => u.role === 'manager').length, 
      color: 'orange' 
    },
    { 
      icon: User, 
      label: 'Staff', 
      value: users.filter(u => u.role === 'staff').length, 
      color: 'red' 
    }
  ];

  // Add admin stat if current user is admin
  if (currentUserRole === 'admin') {
    userStats.splice(1, 0, {
      icon: Shield,
      label: 'Admins',
      value: users.filter(u => u.role === 'admin').length,
      color: 'red'
    });
  }

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
        <div className={`fixed top-3 right-3 z-50 animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-3 md:px-5 py-2 md:py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs md:text-sm max-w-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete User?</h3>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm({ show: false, userId: null })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 text-sm">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        icon={Users}
        title="User Management"
        subtitle="Manage staff & team"
        showAddButton={true}
        onAddClick={openAddModal}
        showAddButtonCondition={['admin', 'owner'].includes(currentUserRole)}
      />

      {/* Stats Cards */}
      <StatsCards stats={userStats} columns={currentUserRole === 'admin' ? 5 : 4} />

      {/* Filters & View Controls */}
      <ViewControls
        title="Users"
        itemCount={filteredUsers.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridColumns={gridColumns}
        onGridColumnsChange={setGridColumns}
        availableColumns={[1, 2, 3, 4]}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search users..."
        searchColSpan={2}
        filters={[
          {
            type: 'select',
            icon: Filter,
            value: filterRole,
            onChange: setFilterRole,
            options: getFilterRoleOptions()
          },
          {
            type: 'select',
            icon: Filter,
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]
          }
        ]}
        onReset={handleResetFilters}
      />

      {/* Users Display */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-amber-100">
            <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm md:text-base text-gray-600 font-medium">No users found</p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className={`grid gap-2 md:gap-3 ${
            gridColumns === 1 ? 'grid-cols-1' :
            gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
            gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' :
            gridColumns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {filteredUsers.map((userData) => (
              <div key={userData._id} className="bg-white rounded-xl border-2 border-gray-200 p-3 md:p-4 shadow-md hover:shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`${userData.role === 'admin' ? 'bg-gradient-to-br from-red-400 to-rose-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'} p-2 rounded-lg flex-shrink-0`}>
                      {userData.role === 'admin' ? <Shield className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base font-bold text-gray-900 truncate">{userData.name}</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 truncate">{userData.email}</p>
                    </div>
                  </div>
                  <span className={`${getRoleBadgeColor(userData.role)} text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase flex-shrink-0 ml-2`}>
                    {userData.role}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" />
                    <span className="text-[10px] md:text-xs">{userData.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <IndianRupee className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" />
                    <span className="text-[10px] md:text-xs">Salary: <strong>₹{userData.salary?.toLocaleString() || '0'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" />
                    <span className="text-[10px] md:text-xs">Joined: {new Date(userData.joiningDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => toggleUserStatus(userData._id)}
                    disabled={!canToggleUserStatus(userData)}
                    className={`w-full px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border ${userData.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} ${!canToggleUserStatus(userData) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {userData.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => openEditModal(userData)} 
                    disabled={!canEditUser(userData)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${!canEditUser(userData) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600'}`}
                  >
                    <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />Edit
                  </button>
                  {['admin', 'owner'].includes(currentUserRole) && (
                    <button
                      onClick={() => handleDelete(userData._id)}
                      disabled={!canDeleteUser(userData)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${!canDeleteUser(userData) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600'}`}
                    >
                      <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <tr>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">User</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden sm:table-cell">Role</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden md:table-cell">Contact</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Salary</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Joined</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Status</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((userData) => (
                    <tr key={userData._id} className="hover:bg-amber-50/50 transition-colors">
                      {/* User Info */}
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex items-center gap-2">
                          <div className={`${userData.role === 'admin' ? 'bg-gradient-to-br from-red-400 to-rose-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'} p-1.5 rounded-lg`}>
                            {userData.role === 'admin' ? <Shield className="w-3 h-3 md:w-4 md:h-4 text-white" /> : <User className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs md:text-sm">{userData.name}</p>
                            <p className="text-[10px] md:text-xs text-gray-500">{userData.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                        <span className={`${getRoleBadgeColor(userData.role)} text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase`}>
                          {userData.role}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                        <span className="text-xs md:text-sm text-gray-700">{userData.phone || 'N/A'}</span>
                      </td>

                      {/* Salary */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <IndianRupee className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500" />
                          <span className="text-xs md:text-sm font-semibold text-gray-900">{userData.salary?.toLocaleString() || '0'}</span>
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                        <span className="text-xs md:text-sm text-gray-700">{new Date(userData.joiningDate).toLocaleDateString('en-IN')}</span>
                      </td>

                      {/* Status */}
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleUserStatus(userData._id)}
                            disabled={!canToggleUserStatus(userData)}
                            className={`px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg font-bold text-[10px] md:text-xs ${userData.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ${!canToggleUserStatus(userData) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {userData.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(userData)}
                            disabled={!canEditUser(userData)}
                            className={`p-1.5 rounded-lg ${!canEditUser(userData) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          {['admin', 'owner'].includes(currentUserRole) && (
                            <button
                              onClick={() => handleDelete(userData._id)}
                              disabled={!canDeleteUser(userData)}
                              className={`p-1.5 rounded-lg ${!canDeleteUser(userData) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  {isEditMode ? <Edit className="w-4 h-4 text-white" /> : <UserPlus className="w-4 h-4 text-white" />}
                </div>
                <h2 className="text-lg font-bold text-white">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.name && touched.name ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                  />
                  {errors.name && touched.name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.name}
                    </p>
                  )}
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="john@cafe.com"
                        className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.email && touched.email ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Password {!isEditMode && '*'}
                      {isEditMode && <span className="text-gray-500 font-normal text-xs ml-1">(optional)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        className={`w-full px-3 pr-9 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.password && touched.password ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    >
                      {getRoleOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="+91 9876543210"
                        className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.phone && touched.phone ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Salary & Joining Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Salary (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="25000"
                        min="0"
                        className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.salary && touched.salary ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                      />
                    </div>
                    {errors.salary && touched.salary && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.salary}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-1"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active User</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default UserManagement;