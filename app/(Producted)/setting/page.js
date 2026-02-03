'use client';
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Plus, Edit, Trash2, X,
  Save, CheckCircle, AlertCircle, Loader, MapPin, 
  Building2, ShoppingCart, Navigation
} from 'lucide-react';
import { settingsAPI } from '@/lib/api-client';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatsCards from '@/components/StatsCards';

const SettingsManagement = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [settings, setSettings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, settingsId: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const currentUserRole = user?.role || '';

  const [formData, setFormData] = useState({
    locationAddress: '',
    locationLongitude: '',
    locationLatitude: '',
    locationAccuracy: '',
    businessName: '',
    orderLimit: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!loading) {
      if (!user || !['admin', 'owner', 'manager'].includes(currentUserRole)) {
        router.push('/login');
        return;
      }
      loadSettings();
    }
  }, [loading, user, router]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsAPI.getAllSettings();
      if (response.success) {
        setSettings(response.data);
      } else {
        showNotification('error', 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Get Current Location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('error', 'Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Update form data with coordinates
        setFormData(prev => ({
          ...prev,
          locationLatitude: latitude.toFixed(6),
          locationLongitude: longitude.toFixed(6),
          locationAccuracy: accuracy.toFixed(2)
        }));

        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              locationAddress: data.display_name
            }));
          }
          
          showNotification('success', 'Location retrieved successfully');
        } catch (error) {
          console.error('Error getting address:', error);
          showNotification('success', 'Location coordinates retrieved');
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            showNotification('error', 'Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            showNotification('error', 'Location information unavailable');
            break;
          case error.TIMEOUT:
            showNotification('error', 'Location request timed out');
            break;
          default:
            showNotification('error', 'An unknown error occurred');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const validateLocationAddress = (address) => {
    if (!address) return 'Location address is required';
    if (address.length < 5) return 'Address must be at least 5 characters';
    return '';
  };

  const validateLongitude = (longitude) => {
    if (!longitude) return 'Longitude is required';
    const num = parseFloat(longitude);
    if (isNaN(num)) return 'Longitude must be a number';
    if (num < -180 || num > 180) return 'Longitude must be between -180 and 180';
    return '';
  };

  const validateLatitude = (latitude) => {
    if (!latitude) return 'Latitude is required';
    const num = parseFloat(latitude);
    if (isNaN(num)) return 'Latitude must be a number';
    if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
    return '';
  };

  const validateAccuracy = (accuracy) => {
    if (!accuracy) return 'Accuracy is required';
    const num = parseFloat(accuracy);
    if (isNaN(num)) return 'Accuracy must be a number';
    if (num < 0) return 'Accuracy must be a positive number';
    return '';
  };

  const validateBusinessName = (name) => {
    if (!name) return 'Business name is required';
    if (name.length < 2) return 'Business name must be at least 2 characters';
    return '';
  };

  const validateOrderLimit = (limit) => {
    if (limit && limit < 0) return 'Order limit must be a positive number';
    return '';
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'locationAddress':
        error = validateLocationAddress(value);
        break;
      case 'locationLongitude':
        error = validateLongitude(value);
        break;
      case 'locationLatitude':
        error = validateLatitude(value);
        break;
      case 'locationAccuracy':
        error = validateAccuracy(value);
        break;
      case 'businessName':
        error = validateBusinessName(value);
        break;
      case 'orderLimit':
        error = validateOrderLimit(value);
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
    const addressError = validateLocationAddress(formData.locationAddress);
    const longitudeError = validateLongitude(formData.locationLongitude);
    const latitudeError = validateLatitude(formData.locationLatitude);
    const accuracyError = validateAccuracy(formData.locationAccuracy);
    const businessNameError = validateBusinessName(formData.businessName);
    const orderLimitError = validateOrderLimit(formData.orderLimit);

    const newErrors = {
      locationAddress: addressError,
      locationLongitude: longitudeError,
      locationLatitude: latitudeError,
      locationAccuracy: accuracyError,
      businessName: businessNameError,
      orderLimit: orderLimitError
    };

    setErrors(newErrors);
    setTouched({
      locationAddress: true,
      locationLongitude: true,
      locationLatitude: true,
      locationAccuracy: true,
      businessName: true,
      orderLimit: true
    });

    return !Object.values(newErrors).some(error => error !== '');
  };

  const openAddModal = () => {
    if (settings.length >= 1) {
      showNotification('error', 'Only one setting configuration is allowed');
      return;
    }
    setIsEditMode(false);
    setCurrentSettings(null);
    setFormData({
      locationAddress: '',
      locationLongitude: '',
      locationLatitude: '',
      locationAccuracy: '',
      businessName: '',
      orderLimit: '',
      isActive: true
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditModal = (settingsData) => {
    setIsEditMode(true);
    setCurrentSettings(settingsData);
    setFormData({
      locationAddress: settingsData.locationAddress || '',
      locationLongitude: settingsData.locationLongitude?.toString() || '',
      locationLatitude: settingsData.locationLatitude?.toString() || '',
      locationAccuracy: settingsData.locationAccuracy?.toString() || '',
      businessName: settingsData.businessName || '',
      orderLimit: settingsData.orderLimit?.toString() || '',
      isActive: settingsData.isActive
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentSettings(null);
    setFormData({
      locationAddress: '',
      locationLongitude: '',
      locationLatitude: '',
      locationAccuracy: '',
      businessName: '',
      orderLimit: '',
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
      const settingsData = {
        locationAddress: formData.locationAddress,
        locationLongitude: parseFloat(formData.locationLongitude),
        locationLatitude: parseFloat(formData.locationLatitude),
        locationAccuracy: parseFloat(formData.locationAccuracy),
        businessName: formData.businessName,
        orderLimit: formData.orderLimit ? parseInt(formData.orderLimit) : 0,
        isActive: formData.isActive
      };

      if (isEditMode) {
        const response = await settingsAPI.updateSettings(currentSettings._id, settingsData);
        if (response.success) {
          showNotification('success', 'Settings updated successfully');
          await loadSettings();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to update settings');
        }
      } else {
        const response = await settingsAPI.createSettings(settingsData);
        if (response.success) {
          showNotification('success', 'Settings created successfully');
          await loadSettings();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to create settings');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (settingsId) => {
    setDeleteConfirm({ show: true, settingsId });
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await settingsAPI.deleteSettings(deleteConfirm.settingsId);
      if (response.success) {
        showNotification('success', 'Settings deleted successfully');
        await loadSettings();
      } else {
        showNotification('error', response.message || 'Failed to delete settings');
      }
    } catch (error) {
      console.error('Error deleting settings:', error);
      showNotification('error', 'Failed to delete settings');
    } finally {
      setIsLoading(false);
      setDeleteConfirm({ show: false, settingsId: null });
    }
  };

  const settingsStats = [
    { 
      icon: Building2, 
      label: 'Business Name', 
      value: settings[0]?.businessName || 'Not Set', 
      color: 'blue' 
    },
    { 
      icon: MapPin, 
      label: 'Location Set', 
      value: settings[0]?.locationAddress ? 'Yes' : 'No', 
      color: 'green' 
    },
    { 
      icon: ShoppingCart, 
      label: 'Order Limit', 
      value: settings[0]?.orderLimit || 0, 
      color: 'orange' 
    },
    { 
      icon: CheckCircle, 
      label: 'Status', 
      value: settings[0]?.isActive ? 'Active' : 'Inactive', 
      color: settings[0]?.isActive ? 'green' : 'red' 
    }
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Settings?</h3>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm({ show: false, settingsId: null })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 text-sm">
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
        icon={SettingsIcon}
        title="Settings Management"
        subtitle="Configure business settings"
        showAddButton={currentUserRole === 'admin' && settings.length === 0}
        onAddClick={openAddModal}
        showAddButtonCondition={currentUserRole === 'admin'}
      />

      {/* Stats Cards */}
      <StatsCards stats={settingsStats} columns={4} />

      {/* Settings Display */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-amber-100">
            <SettingsIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm md:text-base text-gray-600 font-medium">No settings configured</p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Click "Add Settings" to create configuration</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4 md:p-6">
            {settings.map((settingsData) => (
              <div key={settingsData._id} className="space-y-4">
                {/* Business Info */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-amber-600" />
                      {settingsData.businessName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${settingsData.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {settingsData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Location Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      Location Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="text-sm font-medium text-gray-900">{settingsData.locationAddress}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Longitude</p>
                          <p className="text-sm font-medium text-gray-900">{settingsData.locationLongitude}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Latitude</p>
                          <p className="text-sm font-medium text-gray-900">{settingsData.locationLatitude}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Accuracy (meters)</p>
                        <p className="text-sm font-medium text-gray-900">{settingsData.locationAccuracy}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-600" />
                      Order Configuration
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Order Limit</p>
                        <p className="text-2xl font-bold text-amber-600">{settingsData.orderLimit || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Maximum concurrent orders</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {['admin', 'owner', 'manager'].includes(currentUserRole) && (
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => openEditModal(settingsData)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-100">
                      <Edit className="w-4 h-4" />
                      Edit Settings
                    </button>
                    {currentUserRole === 'admin' && (
                      <button
                        onClick={() => handleDelete(settingsData._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Settings
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
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
                  {isEditMode ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                </div>
                <h2 className="text-lg font-bold text-white">{isEditMode ? 'Edit Settings' : 'Add New Settings'}</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-3">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="My Awesome Cafe"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.businessName && touched.businessName ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                    />
                  </div>
                  {errors.businessName && touched.businessName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.businessName}
                    </p>
                  )}
                </div>

                {/* Get Current Location Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Get Current Location
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Click to automatically fill location fields with your current position
                  </p>
                </div>

                {/* Location Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <textarea
                      name="locationAddress"
                      value={formData.locationAddress}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="123 Main Street, City, Country"
                      rows="2"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 resize-none ${errors.locationAddress && touched.locationAddress ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                    />
                  </div>
                  {errors.locationAddress && touched.locationAddress && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.locationAddress}
                    </p>
                  )}
                </div>

                {/* Longitude & Latitude */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      name="locationLongitude"
                      value={formData.locationLongitude}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="73.8567"
                      className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.locationLongitude && touched.locationLongitude ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                    />
                    {errors.locationLongitude && touched.locationLongitude && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.locationLongitude}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      name="locationLatitude"
                      value={formData.locationLatitude}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="18.5204"
                      className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.locationLatitude && touched.locationLatitude ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                    />
                    {errors.locationLatitude && touched.locationLatitude && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.locationLatitude}
                      </p>
                    )}
                  </div>
                </div>

                {/* Accuracy & Order Limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location Accuracy (meters) *</label>
                    <input
                      type="number"
                      step="any"
                      name="locationAccuracy"
                      value={formData.locationAccuracy}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="10"
                      min="0"
                      className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.locationAccuracy && touched.locationAccuracy ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                    />
                    {errors.locationAccuracy && touched.locationAccuracy && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.locationAccuracy}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Order Limit</label>
                    <div className="relative">
                      <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        name="orderLimit"
                        value={formData.orderLimit}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="50"
                        min="0"
                        className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.orderLimit && touched.orderLimit ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                      />
                    </div>
                    {errors.orderLimit && touched.orderLimit && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.orderLimit}
                      </p>
                    )}
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
                    <span className="text-sm font-semibold text-gray-700">Active Settings</span>
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SettingsManagement;