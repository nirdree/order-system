'use client';
import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Edit, Trash2, Search, Filter, X, Eye,
  Save, Calendar, MapPin, Users, CheckCircle, AlertCircle,
  Loader, ChevronDown, QrCode, Download
} from 'lucide-react';
import QRCode from 'qrcode';
import { tablesAPI } from '@/lib/api-client';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, tableId: null });
  const [isLoading, setIsLoading] = useState(false);
  const [qrModal, setQrModal] = useState({ show: false, table: null, qrDataUrl: '' });

  const [formData, setFormData] = useState({
    tableNumber: '',
    floorNumber: '',
    capacity: '',
    status: 'available',
    location: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Load tables from API on component mount
  useEffect(() => {
    loadTables();
  }, []);

  // Filter tables when search term or filters change
  useEffect(() => {
    filterTables();
  }, [searchTerm, filterStatus, filterFloor, tables]);

  // Load tables from API
  const loadTables = async () => {
    try {
      setIsLoading(true);
      const response = await tablesAPI.getAllTables();
      if (response.success) {
        setTables(response.data);
        setFilteredTables(response.data);
      } else {
        showNotification('error', 'Failed to load tables');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      showNotification('error', 'Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tables based on search and filters
  const filterTables = () => {
    let filtered = [...tables];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(table =>
        table.tableNumber.toString().includes(searchTerm) ||
        table.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(table => table.status === filterStatus);
    }

    // Floor filter
    if (filterFloor !== 'all') {
      filtered = filtered.filter(table => table.floorNumber === parseInt(filterFloor));
    }

    setFilteredTables(filtered);
  };

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Validation functions
  const validateTableNumber = (tableNumber) => {
    if (!tableNumber) return 'Table number is required';
    if (tableNumber < 1) return 'Table number must be positive';
    // Check for duplicate table number (excluding current table in edit mode)
    const duplicate = tables.find(t =>
      t.tableNumber === parseInt(tableNumber) && (!isEditMode || t._id !== currentTable._id)
    );
    if (duplicate) return 'Table number already exists';
    return '';
  };

  const validateFloorNumber = (floorNumber) => {
    if (!floorNumber) return 'Floor number is required';
    if (floorNumber < 1) return 'Floor number must be positive';
    return '';
  };

  const validateCapacity = (capacity) => {
    if (!capacity) return 'Capacity is required';
    if (capacity < 1) return 'Capacity must be at least 1';
    return '';
  };

  // Validate field
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'tableNumber':
        error = validateTableNumber(value);
        break;
      case 'floorNumber':
        error = validateFloorNumber(value);
        break;
      case 'capacity':
        error = validateCapacity(value);
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
    const tableNumberError = validateTableNumber(formData.tableNumber);
    const floorNumberError = validateFloorNumber(formData.floorNumber);
    const capacityError = validateCapacity(formData.capacity);

    const newErrors = {
      tableNumber: tableNumberError,
      floorNumber: floorNumberError,
      capacity: capacityError
    };

    setErrors(newErrors);
    setTouched({
      tableNumber: true,
      floorNumber: true,
      capacity: true
    });

    return !Object.values(newErrors).some(error => error !== '');
  };

  // Open modal for adding new table
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentTable(null);
    setFormData({
      tableNumber: '',
      floorNumber: '',
      capacity: '',
      status: 'available',
      location: '',
      isActive: true
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  // Open modal for editing table
  const openEditModal = (table) => {
    setIsEditMode(true);
    setCurrentTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      floorNumber: table.floorNumber,
      capacity: table.capacity,
      status: table.status,
      location: table.location || '',
      isActive: table.isActive
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentTable(null);
    setFormData({
      tableNumber: '',
      floorNumber: '',
      capacity: '',
      status: 'available',
      location: '',
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
        // Update existing table
        const updateData = {
          tableNumber: parseInt(formData.tableNumber),
          floorNumber: parseInt(formData.floorNumber),
          capacity: parseInt(formData.capacity),
          status: formData.status,
          location: formData.location,
          isActive: formData.isActive
        };

        const response = await tablesAPI.updateTable(currentTable._id, updateData);
        
        if (response.success) {
          showNotification('success', 'Table updated successfully');
          await loadTables();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to update table');
        }
      } else {
        // Create new table
        const newTableData = {
          tableNumber: parseInt(formData.tableNumber),
          floorNumber: parseInt(formData.floorNumber),
          capacity: parseInt(formData.capacity),
          status: formData.status,
          location: formData.location,
          isActive: formData.isActive
        };

        const response = await tablesAPI.createTable(newTableData);
        
        if (response.success) {
          showNotification('success', 'Table created successfully');
          await loadTables();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to create table');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete table
  const handleDelete = (tableId) => {
    setDeleteConfirm({ show: true, tableId });
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await tablesAPI.deleteTable(deleteConfirm.tableId);
      
      if (response.success) {
        showNotification('success', 'Table deleted successfully');
        await loadTables();
      } else {
        showNotification('error', response.message || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      showNotification('error', 'Failed to delete table');
    } finally {
      setIsLoading(false);
      setDeleteConfirm({ show: false, tableId: null });
    }
  };

  // Toggle table status
  const toggleTableStatus = async (tableId) => {
    const table = tables.find(t => t._id === tableId);

    try {
      setIsLoading(true);
      const response = await tablesAPI.updateTable(tableId, {
        status: table.status === 'available' ? 'occupied' : 'available'
      });
      
      if (response.success) {
        showNotification('success', `Table status updated successfully`);
        await loadTables();
      } else {
        showNotification('error', response.message || 'Failed to update table status');
      }
    } catch (error) {
      console.error('Error toggling table status:', error);
      showNotification('error', 'Failed to update table status');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR Code
  const generateQRCode = async (table) => {
    try {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
      const qrUrl = `${frontendUrl}/menu/${table._id}`;
      
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrModal({ show: true, table, qrDataUrl });
    } catch (error) {
      console.error('Error generating QR code:', error);
      showNotification('error', 'Failed to generate QR code');
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `table-${qrModal.table.tableNumber}-qr.png`;
    link.href = qrModal.qrDataUrl;
    link.click();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'occupied':
        return 'bg-gradient-to-r from-red-500 to-rose-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get unique floor numbers
  const uniqueFloors = [...new Set(tables.map(t => t.floorNumber))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 animate-slide-in-right ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Table?</h3>
              <p className="text-gray-600">
                Are you sure you want to delete this table? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, tableId: null })}
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

      {/* QR Code Modal */}
      {qrModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Table QR Code</h3>
              <button
                onClick={() => setQrModal({ show: false, table: null, qrDataUrl: '' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl mb-4">
                <img 
                  src={qrModal.qrDataUrl} 
                  alt="QR Code" 
                  className="w-full h-auto"
                />
              </div>
              <p className="text-gray-700 font-semibold">
                Table {qrModal.table?.tableNumber} - Floor {qrModal.table?.floorNumber}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Scan to view menu
              </p>
            </div>

            <button
              onClick={downloadQRCode}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border-2 border-amber-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">Table Management</h1>
                <p className="text-gray-600">Manage your cafe tables and seating</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-orange-600 hover:to-rose-600 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Table
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
                placeholder="Search by table number or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
              />
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
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Floor Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Floors</option>
                {uniqueFloors.map(floor => (
                  <option key={floor} value={floor}>Floor {floor}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Tables</p>
              <p className="text-2xl font-bold text-blue-700">{tables.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Available</p>
              <p className="text-2xl font-bold text-green-700">
                {tables.filter(t => t.status === 'available').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-1">Occupied</p>
              <p className="text-2xl font-bold text-red-700">
                {tables.filter(t => t.status === 'occupied').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total Capacity</p>
              <p className="text-2xl font-bold text-purple-700">
                {tables.reduce((sum, t) => sum + t.capacity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTables.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 text-center shadow-lg border-2 border-amber-100">
                <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <UtensilsCrossed className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 font-semibold text-lg">No tables found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or add a new table</p>
              </div>
            </div>
          ) : (
            filteredTables.map((table) => (
              <div
                key={table._id}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border-2 border-amber-100 hover:shadow-xl transition-all"
              >
                {/* Table Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl">
                      <UtensilsCrossed className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Table {table.tableNumber}</h3>
                      <p className="text-sm text-gray-500">Floor {table.floorNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => generateQRCode(table)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Generate QR Code"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>

                {/* Table Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Capacity: <strong>{table.capacity}</strong> people</span>
                  </div>
                  {table.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{table.location}</span>
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => toggleTableStatus(table._id)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-bold ${
                        table.status === 'available'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {table.status === 'available' ? 'Available' : 'Occupied'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openEditModal(table)}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-semibold">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(table._id)}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Delete</span>
                  </button>
                </div>

                {/* Inactive Badge */}
                {!table.isActive && (
                  <div className="mt-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold text-center">
                    Inactive
                  </div>
                )}
              </div>
            ))
          )}
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
                  {isEditMode ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit Table' : 'Add New Table'}
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
                {/* Table Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Table Number *
                  </label>
                  <input
                    type="number"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="1"
                    min="1"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.tableNumber && touched.tableNumber
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                    }`}
                  />
                  {errors.tableNumber && touched.tableNumber && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.tableNumber}
                    </p>
                  )}
                </div>

                {/* Floor Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Floor Number *
                  </label>
                  <input
                    type="number"
                    name="floorNumber"
                    value={formData.floorNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="1"
                    min="1"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.floorNumber && touched.floorNumber
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                    }`}
                  />
                  {errors.floorNumber && touched.floorNumber && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.floorNumber}
                    </p>
                  )}
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="4"
                      min="1"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.capacity && touched.capacity
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                      }`}
                    />
                  </div>
                  {errors.capacity && touched.capacity && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.capacity}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Near window, Corner, etc."
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
                      Active Table
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
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditMode ? 'Update Table' : 'Create Table'}
                    </>
                  )}
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

export default TableManagement;