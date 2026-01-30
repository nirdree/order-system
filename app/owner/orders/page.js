'use client';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Plus, Search, Filter, ChevronDown, Clock,
  CheckCircle, AlertCircle, Loader, Eye, TrendingUp, Users,
  IndianRupee, UtensilsCrossed, X, ShoppingBag
} from 'lucide-react';
import { sessionsAPI, ordersAPI } from '@/lib/api-client';
import { tablesAPI } from '@/lib/api-client';
import TableDetailModal from './TableDetailModal';

const OrderManagementDashboard = () => {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTablesList();
  }, [searchTerm, filterStatus, filterFloor, tables, sessions]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [tablesRes, sessionsRes, ordersRes] = await Promise.all([
        tablesAPI.getAllTables(),
        sessionsAPI.getAllSessions({ status: 'active' }),
        ordersAPI.getAllOrders({ status: 'pending' })
      ]);

      if (tablesRes.success) setTables(tablesRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTablesList = () => {
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

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    setIsTableModalOpen(true);
  };

  const uniqueFloors = [...new Set(tables.map(t => t.floorNumber))].sort((a, b) => a - b);

  // Stats
  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    activeSessions: sessions.length,
    pendingOrders: orders.length,
    todayRevenue: sessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
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

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border-2 border-amber-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Order Management</h1>
              <p className="text-gray-600 font-medium">Manage tables, sessions, and orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-lg border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <UtensilsCrossed className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Total Tables</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.totalTables}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg border-2 border-red-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Occupied</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.occupiedTables}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg border-2 border-green-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Active Sessions</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.activeSessions}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg border-2 border-orange-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Pending Orders</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg border-2 border-purple-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <IndianRupee className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Today's Revenue</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">₹{stats.todayRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border-2 border-amber-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
              />
            </div>

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
        </div>
      </div>

      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredTables.map((table) => {
              const tableSession = sessions.find(s => s.table._id === table._id);
              const isOccupied = table.status === 'occupied';
              
              return (
                <button
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  className={`relative p-6 rounded-2xl border-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl ${
                    isOccupied
                      ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                      : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      isOccupied ? 'bg-red-200' : 'bg-green-200'
                    }`}>
                      <UtensilsCrossed className={`w-8 h-8 ${
                        isOccupied ? 'text-red-700' : 'text-green-700'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Table {table.tableNumber}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Floor {table.floorNumber}</p>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                      isOccupied
                        ? 'bg-red-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {isOccupied ? 'Occupied' : 'Available'}
                    </div>
                    {tableSession && (
                      <div className="mt-3 text-xs text-gray-700 font-semibold">
                        ₹{tableSession.totalAmount?.toFixed(2) || '0.00'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table Detail Modal */}
      <TableDetailModal
        table={selectedTable}
        isOpen={isTableModalOpen}
        onClose={() => {
          setIsTableModalOpen(false);
          setSelectedTable(null);
        }}
        onUpdate={loadData}
      />

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default OrderManagementDashboard;