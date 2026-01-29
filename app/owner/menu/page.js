'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed, Folder, Plus, Edit, Trash2, Search, Filter, X, Save,
  CheckCircle, AlertCircle, Loader, ChevronDown, IndianRupee, Clock, Tag,
  Star, Upload, Image as ImageIcon, Coffee, Sparkles, IceCream, Droplets, 
  Milk, LayoutDashboard, Eye, EyeOff
} from 'lucide-react';
import { menuItemsAPI, categoriesAPI } from '@/lib/api-client';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Icon options for categories
const iconOptions = [
  { value: 'Coffee', label: 'Coffee', Icon: Coffee },
  { value: 'Sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'IceCream', label: 'Ice Cream', Icon: IceCream },
  { value: 'Droplets', label: 'Droplets', Icon: Droplets },
  { value: 'Milk', label: 'Milk', Icon: Milk },
];

const MenuDashboard = () => {
  const [activeTab, setActiveTab] = useState('menu');

  // Menu Items State
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTermItems, setSearchTermItems] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailable, setFilterAvailable] = useState('all');
  const [filterMostSell, setFilterMostSell] = useState('all');

  // Categories State
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTermCategories, setSearchTermCategories] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalType, setModalType] = useState('');

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Common State
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Menu Item Form Data
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imgURL: '',
    available: true,
    mostSell: false,
    isActive: true,
    tags: '',
    preparationTime: 15
  });

  // Category Form Data
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    icon: 'Coffee',
    description: '',
    imgURL: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    loadCategories();
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchTermItems, filterCategory, filterAvailable, filterMostSell, menuItems]);

  useEffect(() => {
    filterCategories();
  }, [searchTermCategories, categories]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoriesAPI.getAllCategories();
      if (response.success) {
        setCategories(response.data);
        setFilteredCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showNotification('error', 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await menuItemsAPI.getAllMenuItems();
      if (response.success) {
        setMenuItems(response.data);
        setFilteredItems(response.data);
      } else {
        showNotification('error', 'Failed to load menu items');
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      showNotification('error', 'Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  // Cloudinary Image Upload
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Image size must be less than 5MB');
      return;
    }

    const imageUrl = await uploadToCloudinary(file);
    if (imageUrl) {
      if (type === 'menu') {
        setMenuFormData(prev => ({ ...prev, imgURL: imageUrl }));
      } else if (type === 'category') {
        setCategoryFormData(prev => ({ ...prev, imgURL: imageUrl }));
      }
      showNotification('success', 'Image uploaded successfully');
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    if (searchTermItems) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTermItems.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTermItems.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    if (filterAvailable !== 'all') {
      const isAvailable = filterAvailable === 'available';
      filtered = filtered.filter(item => item.available === isAvailable);
    }

    if (filterMostSell === 'true') {
      filtered = filtered.filter(item => item.mostSell);
    }

    setFilteredItems(filtered);
  };

  const filterCategories = () => {
    let filtered = [...categories];

    if (searchTermCategories) {
      filtered = filtered.filter(category =>
        category.id.toLowerCase().includes(searchTermCategories.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Validation functions
  const validateMenuName = (name) => {
    if (!name) return 'Item name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validatePrice = (price) => {
    if (!price) return 'Price is required';
    if (parseFloat(price) < 0) return 'Price must be positive';
    return '';
  };

  const validateMenuCategory = (category) => {
    if (!category) return 'Category is required';
    return '';
  };

  const validateCategoryId = (id) => {
    if (!id) return 'Category ID is required';
    if (!/^[a-z0-9-]+$/.test(id)) return 'ID must contain only lowercase letters, numbers, and hyphens';
    const duplicate = categories.find(c =>
      c.id === id && (!isEditMode || c._id !== currentItem._id)
    );
    if (duplicate) return 'Category ID already exists';
    return '';
  };

  const validateField = (name, value, type) => {
    let error = '';

    if (type === 'menu') {
      switch (name) {
        case 'name':
          error = validateMenuName(value);
          break;
        case 'price':
          error = validatePrice(value);
          break;
        case 'category':
          error = validateMenuCategory(value);
          break;
      }
    } else if (type === 'category') {
      switch (name) {
        case 'id':
          error = validateCategoryId(value);
          break;
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleMenuInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setMenuFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (touched[name]) {
      validateField(name, fieldValue, 'menu');
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setCategoryFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (touched[name]) {
      validateField(name, fieldValue, 'category');
    }
  };

  const handleBlur = (e, type) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value, type);
  };

  const validateMenuForm = () => {
    const nameError = validateMenuName(menuFormData.name);
    const priceError = validatePrice(menuFormData.price);
    const categoryError = validateMenuCategory(menuFormData.category);

    const newErrors = {
      name: nameError,
      price: priceError,
      category: categoryError
    };

    setErrors(newErrors);
    setTouched({ name: true, price: true, category: true });

    return !Object.values(newErrors).some(error => error !== '');
  };

  const validateCategoryForm = () => {
    const idError = validateCategoryId(categoryFormData.id);

    const newErrors = {
      id: idError
    };

    setErrors(newErrors);
    setTouched({ id: true });

    return !Object.values(newErrors).some(error => error !== '');
  };

  const openAddMenuModal = () => {
    setModalType('menu');
    setIsEditMode(false);
    setCurrentItem(null);
    setMenuFormData({
      name: '',
      price: '',
      category: categories.length > 0 ? categories[0].id : '',
      description: '',
      imgURL: '',
      available: true,
      mostSell: false,
      isActive: true,
      tags: '',
      preparationTime: 15
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditMenuModal = (item) => {
    setModalType('menu');
    setIsEditMode(true);
    setCurrentItem(item);
    setMenuFormData({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || '',
      imgURL: item.imgURL || '',
      available: item.available,
      mostSell: item.mostSell,
      isActive: item.isActive,
      tags: item.tags?.join(', ') || '',
      preparationTime: item.preparationTime || 15
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const openAddCategoryModal = () => {
    setModalType('category');
    setIsEditMode(false);
    setCurrentItem(null);
    setCategoryFormData({
      id: '',
      icon: 'Coffee',
      description: '',
      imgURL: '',
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditCategoryModal = (category) => {
    setModalType('category');
    setIsEditMode(true);
    setCurrentItem(category);
    setCategoryFormData({
      id: category.id,
      icon: category.icon,
      description: category.description || '',
      imgURL: category.imgURL || '',
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentItem(null);
    setModalType('');
    setErrors({});
    setTouched({});
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();

    if (!validateMenuForm()) {
      showNotification('error', 'Please fix all errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      const tagsArray = menuFormData.tags
        ? menuFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const itemData = {
        name: menuFormData.name,
        price: parseFloat(menuFormData.price),
        category: menuFormData.category,
        description: menuFormData.description,
        imgURL: menuFormData.imgURL,
        available: menuFormData.available,
        mostSell: menuFormData.mostSell,
        isActive: menuFormData.isActive,
        tags: tagsArray,
        preparationTime: parseInt(menuFormData.preparationTime) || 15
      };

      if (isEditMode) {
        const response = await menuItemsAPI.updateMenuItem(currentItem._id, itemData);

        if (response.success) {
          showNotification('success', 'Menu item updated successfully');
          await loadMenuItems();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to update menu item');
        }
      } else {
        const response = await menuItemsAPI.createMenuItem(itemData);

        if (response.success) {
          showNotification('success', 'Menu item created successfully');
          await loadMenuItems();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to create menu item');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    if (!validateCategoryForm()) {
      showNotification('error', 'Please fix all errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        const response = await categoriesAPI.updateCategory(currentItem._id, categoryFormData);

        if (response.success) {
          showNotification('success', 'Category updated successfully');
          await loadCategories();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to update category');
        }
      } else {
        const response = await categoriesAPI.createCategory(categoryFormData);

        if (response.success) {
          showNotification('success', 'Category created successfully');
          await loadCategories();
          closeModal();
        } else {
          showNotification('error', response.message || 'Failed to create category');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id, type) => {
    setDeleteConfirm({ show: true, id, type });
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);

      if (deleteConfirm.type === 'menu') {
        const response = await menuItemsAPI.deleteMenuItem(deleteConfirm.id);

        if (response.success) {
          showNotification('success', 'Menu item deleted successfully');
          await loadMenuItems();
        } else {
          showNotification('error', response.message || 'Failed to delete menu item');
        }
      } else if (deleteConfirm.type === 'category') {
        const response = await categoriesAPI.deleteCategory(deleteConfirm.id);

        if (response.success) {
          showNotification('success', 'Category deleted successfully');
          await loadCategories();
        } else {
          showNotification('error', response.error.message || 'Failed to delete category');
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('error', 'Failed to delete');
    } finally {
      setIsLoading(false);
      setDeleteConfirm({ show: false, id: null, type: '' });
    }
  };

  const toggleAvailability = async (itemId) => {
    const item = menuItems.find(i => i._id === itemId);

    try {
      setIsLoading(true);
      const response = await menuItemsAPI.updateMenuItem(itemId, {
        available: !item.available
      });

      if (response.success) {
        showNotification('success', `Item ${!item.available ? 'marked as available' : 'marked as unavailable'}`);
        await loadMenuItems();
      } else {
        showNotification('error', response.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      showNotification('error', 'Failed to update availability');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getIconComponent = (iconName) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.Icon : Coffee;
  };

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

      {/* Delete Confirmation */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete {deleteConfirm.type === 'menu' ? 'Item' : 'Category'}?</h3>
              <p className="text-gray-600">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null, type: '' })}
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
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">
                Menu Dashboard
              </h1>
              <p className="text-gray-600 font-medium">Manage your cafe menu and categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 max-w-7xl mx-auto">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'menu'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
              : 'bg-white/80 backdrop-blur-lg border-2 border-amber-100 text-gray-700 hover:bg-white'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
              : 'bg-white/80 backdrop-blur-lg border-2 border-amber-100 text-gray-700 hover:bg-white'
          }`}
        >
          <Folder className="w-5 h-5" />
          Categories
        </button>
      </div>

      {/* Menu Items Tab */}
      {activeTab === 'menu' && (
        <>
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border-2 border-amber-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
                <button
                  onClick={openAddMenuModal}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-orange-600 hover:to-rose-600 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTermItems}
                    onChange={(e) => setSearchTermItems(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.id}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>

                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={filterAvailable}
                    onChange={(e) => setFilterAvailable(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Items</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>

                <div className="relative">
                  <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={filterMostSell}
                    onChange={(e) => setFilterMostSell(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Items</option>
                    <option value="true">Best Sellers</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Total Items</p>
                  <p className="text-2xl font-bold text-blue-700">{menuItems.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Available</p>
                  <p className="text-2xl font-bold text-green-700">
                    {menuItems.filter(i => i.available).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Best Sellers</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {menuItems.filter(i => i.mostSell).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Categories</p>
                  <p className="text-2xl font-bold text-purple-700">{categories.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.length === 0 ? (
                <div className="col-span-full">
                  <div className="bg-white/80 backdrop-blur-lg border-2 border-amber-100 rounded-3xl p-12 text-center shadow-lg">
                    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <UtensilsCrossed className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">No menu items found</p>
                    <p className="text-gray-600 text-sm">Try adjusting your filters or add a new item</p>
                  </div>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const category = getCategoryById(item.category);
                  return (
                    <div
                      key={item._id}
                      className="bg-white/80 backdrop-blur-lg border-2 border-amber-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-amber-300 transition-all group"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {item.imgURL ? (
                          <img
                            src={item.imgURL}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        {item.mostSell && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Star className="w-3 h-3" fill="white" />
                            Best Seller
                          </div>
                        )}
                        {!item.available && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              Unavailable
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                          {category && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1">
                                {React.createElement(getIconComponent(category.icon), { className: "w-3 h-3 text-amber-600" })}
                                <span className="text-xs font-bold text-amber-700">{category.id}</span>
                              </div>
                            </div>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-amber-600" />
                            <span className="text-2xl font-bold text-amber-600">₹{item.price}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-semibold">{item.preparationTime}m</span>
                          </div>
                        </div>

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 border border-gray-300 text-gray-700 text-xs rounded-lg font-semibold"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => toggleAvailability(item._id)}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-bold mb-3 transition-all ${
                            item.available
                              ? 'bg-green-100 border-2 border-green-300 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 border-2 border-red-300 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {item.available ? (
                            <span className="flex items-center justify-center gap-2">
                              <Eye className="w-4 h-4" />
                              Available
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              Unavailable
                            </span>
                          )}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditMenuModal(item)}
                            className="flex-1 px-4 py-2 bg-blue-100 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center gap-2 font-bold"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, 'menu')}
                            className="flex-1 px-4 py-2 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center gap-2 font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border-2 border-amber-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                <button
                  onClick={openAddCategoryModal}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-orange-600 hover:to-rose-600 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Category
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTermCategories}
                  onChange={(e) => setSearchTermCategories(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                />
              </div>

              <p className="text-gray-700 font-semibold">
                <span className="text-amber-600">{filteredCategories.length}</span> categories found
              </p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.length === 0 ? (
                <div className="col-span-full">
                  <div className="bg-white/80 backdrop-blur-lg border-2 border-amber-100 rounded-3xl p-12 text-center shadow-lg">
                    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <Folder className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">No categories found</p>
                    <p className="text-gray-600 text-sm">Add your first category to get started</p>
                  </div>
                </div>
              ) : (
                filteredCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <div
                      key={category._id}
                      className="bg-white/80 backdrop-blur-lg border-2 border-amber-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-amber-300 transition-all group"
                    >
                      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {category.imgURL ? (
                          <img
                            src={category.imgURL}
                            alt={category.id}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconComponent className="w-20 h-20 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{category.id}</h3>
                            </div>
                          </div>
                         
                        </div>

                        {category.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>
                        )}

                        <div className="flex gap-2 pt-4 border-t-2 border-gray-200">
                          <button
                            onClick={() => openEditCategoryModal(category)}
                            className="flex-1 px-4 py-2 bg-blue-100 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center gap-2 font-bold"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category._id, 'category')}
                            className="flex-1 px-4 py-2 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center gap-2 font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal for Menu Items */}
      {isModalOpen && modalType === 'menu' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-8 animate-scale-in">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  {isEditMode ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Item Image
                  </label>
                  <div className="relative">
                    {menuFormData.imgURL ? (
                      <div className="relative h-80 rounded-xl overflow-hidden border-2 border-gray-300 group bg-gray-50">
                        <img
                          src={menuFormData.imgURL}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Change Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-gray-600 font-semibold">Click to upload image</span>
                        <span className="text-gray-500 text-sm">PNG, JPG up to 5MB</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'menu')}
                      className="hidden"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Loader className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
                          <p className="text-gray-900 font-semibold">Uploading... {uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={menuFormData.name}
                    onChange={handleMenuInputChange}
                    onBlur={(e) => handleBlur(e, 'menu')}
                    placeholder="Cappuccino"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.name && touched.name
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                    }`}
                  />
                  {errors.name && touched.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="number"
                      name="price"
                      value={menuFormData.price}
                      onChange={handleMenuInputChange}
                      onBlur={(e) => handleBlur(e, 'menu')}
                      placeholder="150"
                      min="0"
                      step="0.01"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.price && touched.price
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                      }`}
                    />
                  </div>
                  {errors.price && touched.price && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={menuFormData.category}
                    onChange={handleMenuInputChange}
                    onBlur={(e) => handleBlur(e, 'menu')}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 text-gray-900 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.category && touched.category
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.id}</option>
                    ))}
                  </select>
                  {errors.category && touched.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Preparation Time (minutes)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="number"
                      name="preparationTime"
                      value={menuFormData.preparationTime}
                      onChange={handleMenuInputChange}
                      min="1"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={menuFormData.description}
                    onChange={handleMenuInputChange}
                    placeholder="Rich espresso with steamed milk..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all resize-none"
                  />
                </div>

                {/* <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="tags"
                      value={menuFormData.tags}
                      onChange={handleMenuInputChange}
                      placeholder="hot, coffee, popular"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div> */}

                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="available"
                      checked={menuFormData.available}
                      onChange={handleMenuInputChange}
                      className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">
                      Available
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="mostSell"
                      checked={menuFormData.mostSell}
                      onChange={handleMenuInputChange}
                      className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">
                      Best Seller
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={menuFormData.isActive}
                      onChange={handleMenuInputChange}
                      className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">
                      Active
                    </span>
                  </label>
                </div>
              </div>

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
                      {isEditMode ? 'Update Item' : 'Create Item'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Categories */}
      {isModalOpen && modalType === 'category' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 animate-scale-in">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  {isEditMode ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit Category' : 'Add New Category'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="relative">
                    {categoryFormData.imgURL ? (
                      <div className="relative h-80 rounded-xl overflow-hidden border-2 border-gray-300 group bg-gray-50">
                        <img
                          src={categoryFormData.imgURL}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Change Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-gray-600 font-semibold">Click to upload image</span>
                        <span className="text-gray-500 text-sm">PNG, JPG up to 5MB</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'category')}
                      className="hidden"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Loader className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
                          <p className="text-gray-900 font-semibold">Uploading... {uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category ID *
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={categoryFormData.id}
                    onChange={handleCategoryInputChange}
                    onBlur={(e) => handleBlur(e, 'category')}
                    placeholder="hot-beverages"
                    disabled={isEditMode}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.id && touched.id
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'
                    } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {errors.id && touched.id && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      {errors.id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Icon *
                  </label>
                  <select
                    name="icon"
                    value={categoryFormData.icon}
                    onChange={handleCategoryInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    {iconOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

               

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    placeholder="Category description..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all resize-none"
                  />
                </div>


              </div>

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
                      {isEditMode ? 'Update Category' : 'Create Category'}
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
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default MenuDashboard;