'use client';
import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Edit, Trash2, Search, Filter, X,
  Save, MapPin, Users, CheckCircle, AlertCircle,
  Loader, ChevronDown, QrCode, Download, FileDown
} from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
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

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    filterTables();
  }, [searchTerm, filterStatus, filterFloor, tables]);

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

  const filterTables = () => {
    let filtered = [...tables];
    if (searchTerm) {
      filtered = filtered.filter(table =>
        table.tableNumber.toString().includes(searchTerm) ||
        table.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(table => table.status === filterStatus);
    }
    if (filterFloor !== 'all') {
      filtered = filtered.filter(table => table.floorNumber === parseInt(filterFloor));
    }
    setFilteredTables(filtered);
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const validateTableNumber = (tableNumber) => {
    if (!tableNumber) return 'Table number is required';
    if (tableNumber < 1) return 'Table number must be positive';
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
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

  const downloadQRCodeImage = () => {
    const link = document.createElement('a');
    link.download = `table-${qrModal.table.tableNumber}-qr.png`;
    link.href = qrModal.qrDataUrl;
    link.click();
    showNotification('success', 'QR Code image downloaded');
  };

  const downloadQRCodePDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Background gradient effect
      pdf.setFillColor(255, 248, 241);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Decorative border
      pdf.setDrawColor(251, 146, 60);
      pdf.setLineWidth(1);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

      // Cafe Name
      pdf.setFontSize(28);
      pdf.setTextColor(234, 88, 12);
      pdf.setFont('helvetica', 'bold');
      const cafeName = 'My Cafe';
      const cafeNameWidth = pdf.getTextWidth(cafeName);
      pdf.text(cafeName, (pageWidth - cafeNameWidth) / 2, 30);

      // Decorative line under cafe name
      pdf.setDrawColor(251, 146, 60);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 30, 33, pageWidth / 2 + 30, 33);

      // Table Information
      pdf.setFontSize(20);
      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'bold');
      const tableText = `Table ${qrModal.table.tableNumber}`;
      const tableTextWidth = pdf.getTextWidth(tableText);
      pdf.text(tableText, (pageWidth - tableTextWidth) / 2, 45);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      const floorText = `Floor ${qrModal.table.floorNumber} • ${qrModal.table.capacity} Seats`;
      const floorTextWidth = pdf.getTextWidth(floorText);
      pdf.text(floorText, (pageWidth - floorTextWidth) / 2, 52);

      // QR Code with border
      const qrSize = 100;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 65;
      
      // QR Code background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 3, 3, 'F');
      
      // QR Code border
      pdf.setDrawColor(251, 146, 60);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 3, 3, 'S');

      // Add QR Code
      pdf.addImage(qrModal.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // "SCAN ME" Text with icon effect
      pdf.setFontSize(24);
      pdf.setTextColor(234, 88, 12);
      pdf.setFont('helvetica', 'bold');
      const scanText = 'SCAN ME';
      const scanTextWidth = pdf.getTextWidth(scanText);
      pdf.text(scanText, (pageWidth - scanTextWidth) / 2, qrY + qrSize + 20);

      

      // Instructions
      pdf.setFontSize(14);
      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      const instruction1 = 'Scan this QR code to';
      const instruction2 = 'view our digital menu';
      const inst1Width = pdf.getTextWidth(instruction1);
      const inst2Width = pdf.getTextWidth(instruction2);
      pdf.text(instruction1, (pageWidth - inst1Width) / 2, qrY + qrSize + 32);
      pdf.text(instruction2, (pageWidth - inst2Width) / 2, qrY + qrSize + 40);


      // Bottom decorative section
      pdf.setFillColor(251, 146, 60);
      pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');

      // Footer text
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      const footerText = 'Enjoy Your Meal!';
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const subFooter = 'Scan • Order • Enjoy';
      const subFooterWidth = pdf.getTextWidth(subFooter);
      pdf.text(subFooter, (pageWidth - subFooterWidth) / 2, pageHeight - 8);

      // Save PDF
      pdf.save(`Table-${qrModal.table.tableNumber}-QR-Menu.pdf`);
      showNotification('success', 'QR Code PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('error', 'Failed to generate PDF');
    }
  };

  const uniqueFloors = [...new Set(tables.map(t => t.floorNumber))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-3 sm:p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-3 right-3 z-50 animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Table?</h3>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm({ show: false, tableId: null })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 text-sm">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Table QR Code</h3>
              <button onClick={() => setQrModal({ show: false, table: null, qrDataUrl: '' })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg mb-3 border border-amber-200">
                <img src={qrModal.qrDataUrl} alt="QR Code" className="w-full h-auto" />
              </div>
              <p className="text-gray-900 font-bold text-base">Table {qrModal.table?.tableNumber}</p>
              <p className="text-sm text-gray-600">Floor {qrModal.table?.floorNumber} • {qrModal.table?.capacity} Seats</p>
              <p className="text-xs text-gray-500 mt-1">Scan to view digital menu</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={downloadQRCodePDF}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
              >
                <FileDown className="w-4 h-4" />
                Download PDF (Print & Stick)
              </button>
              <button
                onClick={downloadQRCodeImage}
                className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Download Image Only
              </button>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-gray-700 text-center">
                💡 <strong>Tip:</strong> Download PDF, print it, and stick on your table for easy customer access!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-3">
        <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 rounded-lg flex-shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Table Management</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Manage tables & seating</p>
              </div>
            </div>
            <button onClick={openAddModal} className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-2 rounded-lg font-semibold text-sm flex-shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-3">
  <div className="bg-white rounded-xl p-3 shadow-md border border-amber-100 space-y-3">

    {/* ================= FILTER ROW ================= */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">

      {/* Search */}
      <div className="md:col-span-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Status */}
      <div className="md:col-span-3 relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Floor */}
      <div className="md:col-span-3 relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Floors</option>
          {uniqueFloors.map((floor) => (
            <option key={floor} value={floor}>
              Floor {floor}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

    </div>

    {/* ================= STATS ================= */}

    {/* 📱 MOBILE */}
    <div className="md:hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
        <div className="grid grid-cols-4 gap-3 text-center">

          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg font-bold text-amber-700">{tables.length}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600">Available</p>
            <p className="text-lg font-bold text-green-700">
              {tables.filter(t => t.status === 'available').length}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-600">Occupied</p>
            <p className="text-lg font-bold text-red-700">
              {tables.filter(t => t.status === 'occupied').length}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-600">Capacity</p>
            <p className="text-lg font-bold text-purple-700">
              {tables.reduce((sum, t) => sum + t.capacity, 0)}
            </p>
          </div>

        </div>
      </div>
    </div>

    {/* 🖥️ DESKTOP */}
    <div className="hidden md:grid md:grid-cols-4 gap-2">

      <div className="bg-amber-50 border border-amber-200 rounded-lg py-2.5 text-center">
        <p className="text-xs text-gray-600">Total</p>
        <p className="text-lg font-bold text-amber-700">{tables.length}</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg py-2.5 text-center">
        <p className="text-xs text-gray-600">Available</p>
        <p className="text-lg font-bold text-green-700">
          {tables.filter(t => t.status === 'available').length}
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg py-2.5 text-center">
        <p className="text-xs text-gray-600">Occupied</p>
        <p className="text-lg font-bold text-red-700">
          {tables.filter(t => t.status === 'occupied').length}
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg py-2.5 text-center">
        <p className="text-xs text-gray-600">Capacity</p>
        <p className="text-lg font-bold text-purple-700">
          {tables.reduce((sum, t) => sum + t.capacity, 0)}
        </p>
      </div>

    </div>

  </div>
</div>


      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTables.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-xl p-8 text-center shadow-md border border-amber-100">
                <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-semibold">No tables found</p>
                <p className="text-gray-500 text-sm">Try adjusting filters or add a new table</p>
              </div>
            </div>
          ) : (
            filteredTables.map((table) => (
              <div key={table._id} className="bg-white rounded-xl p-3 shadow-md border border-amber-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg">
                      <UtensilsCrossed className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Table {table.tableNumber}</h3>
                      <p className="text-xs text-gray-500">Floor {table.floorNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => generateQRCode(table)}
                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                    title="QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs">Capacity: <strong>{table.capacity}</strong></span>
                  </div>
                  {table.location && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs">{table.location}</span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleTableStatus(table._id)}
                    className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold ${
                      table.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {table.status === 'available' ? 'Available' : 'Occupied'}
                  </button>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openEditModal(table)} className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                    <Edit className="w-3.5 h-3.5" />Edit
                  </button>
                  <button onClick={() => handleDelete(table._id)} className="flex-1 px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </div>

                {!table.isActive && (
                  <div className="mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold text-center">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  {isEditMode ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                </div>
                <h2 className="text-lg font-bold text-white">{isEditMode ? 'Edit Table' : 'Add New Table'}</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Table Number *</label>
                  <input
                    type="number"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="1"
                    min="1"
                    className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.tableNumber && touched.tableNumber ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                  />
                  {errors.tableNumber && touched.tableNumber && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.tableNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    name="floorNumber"
                    value={formData.floorNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="1"
                    min="1"
                    className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.floorNumber && touched.floorNumber ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                  />
                  {errors.floorNumber && touched.floorNumber && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.floorNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="4"
                      min="1"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 ${errors.capacity && touched.capacity ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-200'}`}
                    />
                  </div>
                  {errors.capacity && touched.capacity && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.capacity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Near window, Corner, etc."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-1"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active Table</span>
                  </label>
                </div>
              </div>

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
        .animate-slide-in { animation: slide-in 0.3s; }
      `}</style>
    </div>
  );
};

export default TableManagement;