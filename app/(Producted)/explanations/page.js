'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit, Trash2, Search, Filter, X, CheckCircle, AlertCircle, Loader,
  Eye, FileText, FolderOpen, LayoutDashboard, Calendar, IndianRupee,
  Save, Upload, Image as ImageIcon
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import{ explanationsAPI, explanationCategoriesAPI } from '@/lib/api-client';
import ViewControls from '@/components/ViewControls';
import StatsCards from '@/components/StatsCards';


const ExplanationsDashboard = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [activeTab, setActiveTab] = useState('explanations');
  const [viewMode, setViewMode] = useState('table');
  const [gridColumns, setGridColumns] = useState(3);

  // Explanations State
  const [explanations, setExplanations] = useState([]);
  const [filteredExplanations, setFilteredExplanations] = useState([]);
  const [searchTermExplanations, setSearchTermExplanations] = useState('');
  const [filterCategoryExp, setFilterCategoryExp] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Categories State
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTermCategories, setSearchTermCategories] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Form States
  const [categoryFormData, setCategoryFormData] = useState({ 
    name: '', 
    description: '', 
    icon: '📁' 
  });
  
  const [explanationFormData, setExplanationFormData] = useState({
    category: '',
    description: '',
    amount: '',
    totalAmountPaid: '',
    paymentMode: 'Cash',
    explanationDate: new Date().toISOString().split('T')[0],
  });

  // Common State
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!loading) {
      if (!user || user.role === 'staff') {
        router.push('/login');
        return;
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    loadExplanations();
    loadCategories();
  }, []);

  useEffect(() => {
    filterExplanations();
  }, [searchTermExplanations, filterCategoryExp, filterDateFrom, filterDateTo, explanations]);

  useEffect(() => {
    filterCategories();
  }, [searchTermCategories, categories]);

  const loadExplanations = async () => {
    try {
      setIsLoading(true);
      const response = await explanationsAPI.getAllExplanations();
      if (response.success) {
        setExplanations(response.data);
        setFilteredExplanations(response.data);
      }
    } catch (error) {
      console.error('Error loading explanations:', error);
      showNotification('error', 'Failed to load explanations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await explanationCategoriesAPI.getAllCategories();
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

  const filterExplanations = () => {
    let filtered = [...explanations];

    if (searchTermExplanations) {
      filtered = filtered.filter(item =>
        item.description?.toLowerCase().includes(searchTermExplanations.toLowerCase())
      );
    }

    if (filterCategoryExp !== 'all') {
      filtered = filtered.filter(item => 
        (item.category?._id || item.category) === filterCategoryExp
      );
    }

    // Date filtering
    if (filterDateFrom) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.explanationDate);
        const fromDate = new Date(filterDateFrom);
        return itemDate >= fromDate;
      });
    }

    if (filterDateTo) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.explanationDate);
        const toDate = new Date(filterDateTo);
        return itemDate <= toDate;
      });
    }

    setFilteredExplanations(filtered);
  };

  const filterCategories = () => {
    let filtered = [...categories];

    if (searchTermCategories) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTermCategories.toLowerCase())
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

  const openAddExplanationModal = () => {
    setModalType('explanation');
    setIsEditMode(false);
    setCurrentItem(null);
    setExplanationFormData({
      category: categories.length > 0 ? categories[0]._id : '',
      description: '',
      amount: '',
      totalAmountPaid: '',
      paymentMode: 'Cash',
      explanationDate: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditExplanationModal = (explanation) => {
    setModalType('explanation');
    setIsEditMode(true);
    setCurrentItem(explanation);
    setExplanationFormData({
      category: explanation.category?._id || explanation.category,
      description: explanation.description || '',
      amount: explanation.amount,
      totalAmountPaid: explanation.totalAmountPaid,
      paymentMode: explanation.paymentMode || 'Cash',
      explanationDate: new Date(explanation.explanationDate).toISOString().split('T')[0],
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
      name: '',
      description: '',
      icon: '📁',
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
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📁',
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

  const handleExplanationInputChange = (e) => {
    const { name, value } = e.target;
    setExplanationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExplanationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...explanationFormData,
        userId: user._id,
        amount: parseFloat(explanationFormData.amount),
        totalAmountPaid: parseFloat(explanationFormData.totalAmountPaid),
      };

      if (isEditMode) {
        const response = await explanationsAPI.updateExplanation(currentItem._id, data);
        if (response.success) {
          showNotification('success', 'Explanation updated successfully');
          await loadExplanations();
          closeModal();
        } else {
          showNotification('error', response.error || 'Failed to update explanation');
        }
      } else {
        const response = await explanationsAPI.createExplanation(data);
        if (response.success) {
          showNotification('success', 'Explanation created successfully');
          await loadExplanations();
          closeModal();
        } else {
          showNotification('error', response.error || 'Failed to create explanation');
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
    setIsLoading(true);

    try {
      const data = {
        ...categoryFormData,
        userId: user._id,
      };

      if (isEditMode) {
        const response = await explanationCategoriesAPI.updateCategory(currentItem._id, data);
        if (response.success) {
          showNotification('success', 'Category updated successfully');
          await loadCategories();
          closeModal();
        } else {
          showNotification('error', response.error || 'Failed to update category');
        }
      } else {
        const response = await explanationCategoriesAPI.createCategory(data);
        if (response.success) {
          showNotification('success', 'Category created successfully');
          await loadCategories();
          closeModal();
        } else {
          showNotification('error', response.error || 'Failed to create category');
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

      if (deleteConfirm.type === 'explanation') {
        const response = await explanationsAPI.deleteExplanation(deleteConfirm.id);
        if (response.success) {
          showNotification('success', 'Explanation deleted successfully');
          await loadExplanations();
        } else {
          showNotification('error', response.error || 'Failed to delete explanation');
        }
      } else if (deleteConfirm.type === 'category') {
        const response = await explanationCategoriesAPI.deleteCategory(deleteConfirm.id);
        if (response.success) {
          showNotification('success', 'Category deleted successfully');
          await loadCategories();
        } else {
          showNotification('error', response.error || 'Failed to delete category');
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

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getTotalAmount = () => {
    return filteredExplanations.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const getTotalPaid = () => {
    return filteredExplanations.reduce((sum, exp) => sum + (exp.totalAmountPaid || 0), 0);
  };

  const handleResetFilters = () => {
    setSearchTermExplanations('');
    setFilterCategoryExp('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const explanationStats = [
    {
      icon: FileText,
      label: 'Total Explanations',
      value: explanations.length,
      color: 'blue'
    },
    {
      icon: IndianRupee,
      label: 'Total Amount',
      value: `₹${getTotalAmount().toFixed(2)}`,
      color: 'orange'
    },
    {
      icon: CheckCircle,
      label: 'Total Paid',
      value: `₹${getTotalPaid().toFixed(2)}`,
      color: 'green'
    },
    {
      icon: FolderOpen,
      label: 'Categories',
      value: categories.length,
      color: 'purple'
    }
  ];

  const categoryStats = [
    {
      icon: FolderOpen,
      label: 'Total Categories',
      value: filteredCategories.length,
      color: 'blue'
    }
  ];

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-3 md:p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-3 right-3 z-50 animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm max-w-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-medium">{notification.message}</span>
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete {deleteConfirm.type === 'explanation' ? 'Explanation' : 'Category'}?</h3>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm({ show: false, id: null, type: '' })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="Explanations Dashboard"
        subtitle="Manage explanations & categories"
        showAddButton={true}
        addButtonText="Add"
        onAddClick={activeTab === 'explanations' ? openAddExplanationModal : openAddCategoryModal}
      />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-3 md:mb-4">
        <div className="bg-white rounded-xl p-1.5 md:p-2 shadow-md border border-amber-100 flex gap-1.5 md:gap-2">
          <button
            onClick={() => setActiveTab('explanations')}
            className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all ${activeTab === 'explanations'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Explanations</span>
            <span className="sm:hidden">Explain</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all ${activeTab === 'categories'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Category</span>
          </button>
        </div>
      </div>

      {/* Explanations Tab */}
      {activeTab === 'explanations' && (
        <>
          {/* Stats Cards */}
          <StatsCards stats={explanationStats} columns={4} />

          {/* View Controls & Filters */}
          <ViewControls
            title="Explanations"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            availableColumns={[2, 3, 4]}
            searchValue={searchTermExplanations}
            onSearchChange={setSearchTermExplanations}
            searchPlaceholder="Search explanations..."
            filters={[
              {
                type: 'select',
                icon: Filter,
                value: filterCategoryExp,
                onChange: setFilterCategoryExp,
                options: [
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat._id, label: cat.name }))
                ]
              },
              {
                type: 'date',
                icon: Calendar,
                value: filterDateFrom,
                onChange: setFilterDateFrom,
                placeholder: 'From Date'
              },
              {
                type: 'date',
                icon: Calendar,
                value: filterDateTo,
                onChange: setFilterDateTo,
                placeholder: 'To Date'
              }
            ]}
            onReset={handleResetFilters}
          />

          {/* Explanations Display */}
          <div className="max-w-7xl mx-auto">
            {viewMode === 'grid' ? (
              // Grid View
              <div
                className={`grid gap-2 md:gap-3 ${gridColumns === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : gridColumns === 3
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {filteredExplanations.length === 0 ? (
                  <div className="col-span-full">
                    <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-md border border-amber-100">
                      <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                        <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No explanations found</p>
                      <p className="text-gray-500 text-xs md:text-sm">Try adjusting filters or add a new explanation</p>
                    </div>
                  </div>
                ) : (
                  filteredExplanations.map((explanation) => (
                    <div
                      key={explanation._id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-all group"
                    >
                      {/* CONTENT */}
                      <div className="p-2.5 md:p-3 lg:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-2 flex-1">
                            {explanation.description}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 mb-2">
                          <div className="bg-amber-50 border border-amber-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg flex items-center gap-1">
                            <FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600" />
                            <span className="text-[10px] md:text-[11px] font-bold text-amber-700">
                              {getCategoryName(explanation.category?._id || explanation.category)}
                            </span>
                          </div>
                        </div>

                        {/* AMOUNT + PAID */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500">Amount</span>
                            <div className="flex items-center gap-0.5">
                              <IndianRupee className="w-3 h-3 text-blue-600" />
                              <span className="text-xs md:text-sm font-bold text-blue-600">
                                {explanation.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500">Paid</span>
                            <div className="flex items-center gap-0.5">
                              <IndianRupee className="w-3 h-3 text-green-600" />
                              <span className="text-xs md:text-sm font-bold text-green-600">
                                {explanation.totalAmountPaid.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* DATE + PAYMENT MODE */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs">
                            <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {new Date(explanation.explanationDate).toLocaleDateString()}
                          </div>
                          <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-purple-100 border border-purple-300 text-purple-700 text-[9px] md:text-[11px] rounded-lg font-semibold uppercase">
                            {explanation.paymentMode}
                          </span>
                        </div>

                        {/* ACTIONS */}
                        <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                          <button
                            onClick={() => openEditExplanationModal(explanation)}
                            className="flex items-center justify-center px-1.5 md:px-2 py-1.5 md:py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(explanation._id, "explanation")}
                            className="flex items-center justify-center px-1.5 md:px-2 py-1.5 md:py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Table View
              <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                      <tr>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Category</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Description</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Amount</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Paid</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden md:table-cell">Payment</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Date</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredExplanations.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mb-3 flex items-center justify-center">
                                <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No explanations found</p>
                              <p className="text-gray-500 text-xs md:text-sm">Try adjusting filters or add a new explanation</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredExplanations.map((explanation) => (
                          <tr key={explanation._id} className="hover:bg-amber-50/50 transition-colors">
                            {/* Category */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                <FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600" />
                                <span className="text-[10px] md:text-xs font-bold text-amber-700">
                                  {getCategoryName(explanation.category?._id || explanation.category)}
                                </span>
                              </div>
                            </td>

                            {/* Description */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <span className="font-medium text-gray-900 text-xs md:text-sm line-clamp-2">
                                {explanation.description}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center gap-0.5 md:gap-1">
                                <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                                <span className="text-xs md:text-sm font-bold text-blue-600">
                                  {explanation.amount.toFixed(2)}
                                </span>
                              </div>
                            </td>

                            {/* Paid */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center gap-0.5 md:gap-1">
                                <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                                <span className="text-xs md:text-sm font-bold text-green-600">
                                  {explanation.totalAmountPaid.toFixed(2)}
                                </span>
                              </div>
                            </td>

                            {/* Payment Mode */}
                            <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                              <span className="inline-flex px-2 py-1 bg-purple-100 border border-purple-300 text-purple-700 text-[10px] rounded-lg font-semibold uppercase">
                                {explanation.paymentMode}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                              <div className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                <span className="text-xs text-gray-700">
                                  {new Date(explanation.explanationDate).toLocaleDateString()}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center justify-center gap-1 md:gap-2">
                                <button
                                  onClick={() => openEditExplanationModal(explanation)}
                                  className="p-1.5 md:p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(explanation._id, "explanation")}
                                  className="p-1.5 md:p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
            )}
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          {/* Stats Cards */}
          <StatsCards stats={categoryStats} columns={1} />

          <ViewControls
            title="Categories"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            availableColumns={[2, 3, 4, 5]}
            searchValue={searchTermCategories}
            onSearchChange={setSearchTermCategories}
            searchPlaceholder="Search categories..."
            showReset={false}
          />

          {/* Categories Display */}
          <div className="max-w-7xl mx-auto">
            {viewMode === 'grid' ? (
              // Grid View
              <div className={`grid gap-2 md:gap-3 ${gridColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                gridColumns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                  gridColumns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
              }`}>
                {filteredCategories.length === 0 ? (
                  <div className="col-span-full">
                    <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-md border border-amber-100">
                      <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No categories found</p>
                      <p className="text-gray-500 text-xs md:text-sm">Add your first category to get started</p>
                    </div>
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div
                      key={category._id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-all group"
                    >
                      <div className="relative h-36 md:h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center">
                        <span className="text-5xl md:text-6xl">{category.icon || '📁'}</span>
                      </div>

                      <div className="p-3 md:p-4 lg:p-5">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                          <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 line-clamp-1">{category.name}</h3>
                        </div>

                        {category.description && (
                          <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 leading-relaxed">{category.description}</p>
                        )}

                        <div className="flex gap-1.5 md:gap-2 pt-3 md:pt-4 border-t border-gray-100">
                          <button
                            onClick={() => openEditCategoryModal(category)}
                            className="flex-1 px-2 md:px-3 py-2 md:py-2.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 md:gap-2 hover:bg-blue-100 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(category._id, 'category')}
                            className="flex-1 px-2 md:px-3 py-2 md:py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 md:gap-2 hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Table View for Categories
              <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                      <tr>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Icon</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Name</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Description</th>
                        <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mb-3 flex items-center justify-center">
                                <FolderOpen className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No categories found</p>
                              <p className="text-gray-500 text-xs md:text-sm">Add your first category to get started</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCategories.map((category) => (
                          <tr key={category._id} className="hover:bg-amber-50/50 transition-colors">
                            {/* Icon */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                <span className="text-2xl md:text-3xl">{category.icon || '📁'}</span>
                              </div>
                            </td>

                            {/* Name */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <span className="font-bold text-gray-900 text-xs md:text-sm">{category.name}</span>
                            </td>

                            {/* Description */}
                            <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                              <span className="text-xs text-gray-600 line-clamp-2">
                                {category.description || 'No description'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center justify-center gap-1 md:gap-2">
                                <button
                                  onClick={() => openEditCategoryModal(category)}
                                  className="p-1.5 md:p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(category._id, 'category')}
                                  className="p-1.5 md:p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
            )}
          </div>
        </>
      )}

      {/* Modal for Explanation Form */}
      {isModalOpen && modalType === 'explanation' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="bg-white/20 p-1 md:p-1.5 rounded-lg">
                  {isEditMode ? <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />}
                </div>
                <h2 className="text-base md:text-lg font-bold text-white">{isEditMode ? 'Edit Explanation' : 'Add Explanation'}</h2>
              </div>
              <button onClick={closeModal} className="p-1 md:p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleExplanationSubmit} className="p-3 md:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={explanationFormData.category}
                    onChange={handleExplanationInputChange}
                    className="w-full px-2.5 md:px-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:border-amber-500 focus:ring-amber-200"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={explanationFormData.description}
                    onChange={handleExplanationInputChange}
                    placeholder="Enter description..."
                    rows={3}
                    className="w-full px-2.5 md:px-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                    <input
                      type="number"
                      name="amount"
                      value={explanationFormData.amount}
                      onChange={handleExplanationInputChange}
                      placeholder="1000"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Paid Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                    <input
                      type="number"
                      name="totalAmountPaid"
                      value={explanationFormData.totalAmountPaid}
                      onChange={handleExplanationInputChange}
                      placeholder="1000"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Payment Mode *</label>
                  <select
                    name="paymentMode"
                    value={explanationFormData.paymentMode}
                    onChange={handleExplanationInputChange}
                    className="w-full px-2.5 md:px-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:border-amber-500 focus:ring-amber-200"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                    <input
                      type="date"
                      name="explanationDate"
                      value={explanationFormData.explanationDate}
                      onChange={handleExplanationInputChange}
                      className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-xs md:text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-xs md:text-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditMode ? 'Update Explanation' : 'Create Explanation'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Category Form */}
      {isModalOpen && modalType === 'category' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="bg-white/20 p-1 md:p-1.5 rounded-lg">
                  {isEditMode ? <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />}
                </div>
                <h2 className="text-base md:text-lg font-bold text-white">{isEditMode ? 'Edit Category' : 'Add Category'}</h2>
              </div>
              <button onClick={closeModal} className="p-1 md:p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-3 md:p-4">
              <div className="grid grid-cols-1 gap-2.5 md:gap-3">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="Office Supplies"
                    className="w-full px-2.5 md:px-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Icon</label>
                  <input
                    type="text"
                    name="icon"
                    value={categoryFormData.icon}
                    onChange={handleCategoryInputChange}
                    placeholder="📁"
                    className="w-full px-2.5 md:px-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  />
                  <p className="mt-1 text-[10px] md:text-xs text-gray-500">Enter an emoji or leave blank</p>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    placeholder="Category description..."
                    rows={3}
                    className="w-full px-2.5 md:px-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-xs md:text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-xs md:text-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditMode ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplanationsDashboard;