'use client';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Plus, Search, Filter, ChevronDown, Clock,
  CheckCircle, AlertCircle, Loader, Eye, TrendingUp, Users,
  IndianRupee, UtensilsCrossed, X, ShoppingBag, Trash2,
  Package, Utensils, Minus, ShoppingCart, Send, Receipt, Edit2,
  LayoutGrid, List, EyeOff
} from 'lucide-react';
import { sessionsAPI, ordersAPI, tablesAPI, menuItemsAPI, categoriesAPI } from '@/lib/api-client';
import PageHeader from '@/components/PageHeader';
import StatsCards from '@/components/StatsCards';
import ViewControls from '@/components/ViewControls';
import BillComponent from '@/components/BillComponent';

// ============= TABLE DETAIL MODAL COMPONENT =============
export const TableDetailModal = ({ table, isOpen, onClose, onUpdate }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showBill, setShowBill] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Menu & Cart States
  const [showMenuView, setShowMenuView] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('__all__');
  const [showDeleteOrderConfirm, setShowDeleteOrderConfirm] = useState(null);

  // Item Management States
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(null);
  const [showEditItemModal, setShowEditItemModal] = useState(null);
  const [editItemQuantity, setEditItemQuantity] = useState(1);
  const [editItemInstructions, setEditItemInstructions] = useState('');

  // View Mode States for Orders
  const [ordersViewMode, setOrdersViewMode] = useState('grid'); // 'grid' or 'table'
  const [ordersGridColumns, setOrdersGridColumns] = useState(1); // 1, 2, or 3 columns for orders

  // View Mode States for Menu
  const [menuViewMode, setMenuViewMode] = useState('grid'); // 'grid' or 'table'
  const [menuGridColumns, setMenuGridColumns] = useState(3); // 2, 3, or 4 columns for menu
  const [menuSearchTerm, setMenuSearchTerm] = useState(''); // search for menu items

  useEffect(() => {
    if (isOpen && table) {
      if (table.status === 'occupied') {
        loadSession();
        setShowMenuView(false);
      } else {
        setShowMenuView(true);
        loadCategories();
        loadMenuItems();
      }
    } else {
      setSession(null);
      setCart({});
      setShowMenuView(false);
      setEditingOrderId(null);
    }
  }, [isOpen, table]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionsAPI.getAllSessions({
        tableId: table._id,
        status: 'active'
      });

      if (response.success && response.data.length > 0) {
        const sessionResponse = await sessionsAPI.getSession(response.data[0]._id);
        if (sessionResponse.success) {
          setSession(sessionResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      showNotification('error', 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriesAPI.getAllCategories();

      if (response.success) {
        setCategories([
          { id: '__all__', icon: 'list', imgURL: '', description: 'All Items' }, 
          ...(response.data || [])
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenuItems(true);
      const response = await menuItemsAPI.getAllMenuItems();

      if (response.success) {
        setMenuItems(response.data || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoadingMenuItems(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  const handleAddToCart = (itemId) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId] -= 1;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const handlePlaceOrder = async () => {
    if (Object.keys(cart).length === 0) {
      showNotification('error', 'Please add at least one item to cart');
      return;
    }

    try {
      setIsLoading(true);
      let currentSession = session;

      if (!currentSession) {
        const sessionResponse = await sessionsAPI.createSession({
          tableId: table._id,
          customerCount: 1
        });
        if (!sessionResponse.success) return;
        currentSession = sessionResponse.data;
      }

      const items = Object.entries(cart).map(([itemId, quantity]) => ({
        menuItemId: itemId,
        quantity
      }));

      const orderResponse = await ordersAPI.createOrder({
        sessionId: currentSession._id,
        items,
        orderType: 'dine-in'
      });

      if (orderResponse.success) {
        showNotification('success', 'Order placed successfully');
        setCart({});
        setShowMenuView(false);
        const updatedSession = await sessionsAPI.getSession(currentSession._id);
        if (updatedSession.success) setSession(updatedSession.data);
        onUpdate();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('error', 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setSession(prev => ({
        ...prev,
        orders: prev.orders.map(order =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      }));

      const response = await ordersAPI.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        showNotification('success', 'Order status updated');
        await loadSession();
      } else {
        await loadSession();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      await loadSession();
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.deleteOrder(orderId);
      if (response.success) {
        showNotification('success', 'Order deleted successfully');
        setShowDeleteOrderConfirm(null);
        await loadSession();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItemToOrder = async (orderId) => {
    if (Object.keys(cart).length === 0) {
      showNotification('error', 'Please add at least one item to cart');
      return;
    }

    try {
      setIsLoading(true);

      for (const [menuItemId, quantity] of Object.entries(cart)) {
        const response = await ordersAPI.addItemToOrder(orderId, {
          menuItemId,
          quantity
        });

        if (response.error || !response.success) {
          showNotification('error', `Failed to add item: ${response.error || response.message}`);
          return;
        }
      }

      showNotification('success', 'Items added to order successfully');
      setCart({});
      setEditingOrderId(null);
      setShowMenuView(false);
      await loadSession();
      onUpdate();
    } catch (error) {
      console.error('Error adding items to order:', error);
      showNotification('error', 'Failed to add items to order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditItem = (order, item) => {
    setShowEditItemModal({ orderId: order._id, item });
    setEditItemQuantity(item.quantity);
    setEditItemInstructions(item.specialInstructions || '');
  };

  const handleUpdateOrderItem = async () => {
    if (!showEditItemModal) return;

    try {
      setIsLoading(true);
      const { orderId, item } = showEditItemModal;

      const updateData = {
        quantity: editItemQuantity,
        specialInstructions: editItemInstructions
      };

      const response = await ordersAPI.updateOrderItem(orderId, item._id, updateData);

      if (response.success || (response.data && !response.error)) {
        showNotification('success', response.message || 'Item updated successfully');
        setShowEditItemModal(null);
        await loadSession();
        onUpdate();
      } else {
        showNotification('error', response.error || response.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating order item:', error);
      showNotification('error', 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrderItem = async () => {
    if (!showDeleteItemConfirm) return;

    try {
      setIsLoading(true);
      const { orderId, itemId } = showDeleteItemConfirm;

      const response = await ordersAPI.deleteOrderItem(orderId, itemId);

      if (response.success || (response.data && !response.error)) {
        showNotification('success', response.message || 'Item removed from order');
        setShowDeleteItemConfirm(null);
        await loadSession();
        onUpdate();
      } else {
        showNotification('error', response.error || response.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error deleting order item:', error);
      showNotification('error', 'Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionsAPI.completeSession(session._id, { paymentMethod });
      if (response.success) {
        showNotification('success', 'Session completed successfully');
        setShowCompleteConfirm(false);
        // Await parent update to refresh table data before closing
        await onUpdate();
        onClose();
      } else {
        showNotification('error', response.message || 'Failed to complete session');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      showNotification('error', 'Failed to complete session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionsAPI.deleteSession(session._id);
      if (response.success) {
        showNotification('success', 'Session cancelled successfully');
        setShowCancelConfirm(false);
        // Await parent update to refresh table data before closing
        await onUpdate();
        onClose();
      } else {
        showNotification('error', response.message || 'Failed to cancel session');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      showNotification('error', 'Failed to cancel session');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeOrders = session?.orders?.filter(o => o.orderStatus !== 'cancelled') || [];
  const sessionDuration = session ? Math.floor((new Date() - new Date(session.startTime)) / 1000 / 60) : 0;
  const sessionTotal = activeOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);
  const cartTotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find(m => m._id === itemId);
    return sum + ((item?.price || 0) * qty);
  }, 0);
  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === '__all__' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) || 
                          item.description?.toLowerCase().includes(menuSearchTerm.toLowerCase());
    return matchesCategory && item.available && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-3">
      {notification.show && (
        <div className={`fixed top-3 right-3 z-[70] animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-3 md:px-4 py-2 md:py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs md:text-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="bg-white rounded-t-xl sm:rounded-2xl max-w-4xl w-full h-full sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 md:px-5 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Table {table.tableNumber}</h2>
            <h2 className="text-lg md:text-xl font-bold text-white">Table ID {table._id}</h2>
            <p className="text-white/90 text-xs md:text-sm">Floor {table.floorNumber} • {table.capacity} seats</p>
          </div>
          <button onClick={() => {
            onUpdate();
            onClose();
          }} className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>

        {showMenuView ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Category Bar */}
            <div className="border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
              <div className="overflow-x-auto scrollbar-thin">
                <div className="flex gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 min-w-max">
                  {isLoadingCategories ? (
                    <Loader className="w-4 h-4 md:w-5 md:h-5 text-amber-600 animate-spin" />
                  ) : (
                    categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 md:gap-1.5 transition-transform hover:scale-105"
                      >
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 transition ${selectedCategory === cat.id ? 'border-amber-500 shadow-md' : 'border-gray-200'
                          }`}>
                          {cat.imgURL ? (
                            <img src={cat.imgURL} alt={cat.id} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-base md:text-xl">
                              {cat.id === 'all' ? '🍽️' : '✨'}
                            </div>
                          )}
                        </div>
                        <p className={`text-[10px] md:text-xs font-semibold max-w-[60px] text-center truncate ${selectedCategory === cat.id ? 'text-amber-600' : 'text-gray-700'
                          }`}>
                          {cat.description || cat.id}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* View Controls */}
              <div className="border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10 px-3 md:px-4 py-2 md:py-3 space-y-2 md:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">Menu Items ({filteredMenuItems.length})</h3>
                  
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setMenuViewMode('grid')}
                        className={`p-1.5 md:p-2 rounded transition-all ${menuViewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Grid view"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setMenuViewMode('table')}
                        className={`p-1.5 md:p-2 rounded transition-all ${menuViewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Table view"
                      >
                        <List className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Grid Column Selector - Only show in grid mode */}
                    {menuViewMode === 'grid' && (
                      <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setMenuGridColumns(2)}
                          className={`p-1.5 rounded transition-all ${menuGridColumns === 2 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                          title="2 columns"
                        >
                          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="3" width="9" height="6" strokeWidth="2" />
                            <rect x="13" y="3" width="9" height="6" strokeWidth="2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setMenuGridColumns(3)}
                          className={`p-1.5 rounded transition-all ${menuGridColumns === 3 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                          title="3 columns"
                        >
                          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="3" width="5.5" height="6" strokeWidth="2" />
                            <rect x="9.25" y="3" width="5.5" height="6" strokeWidth="2" />
                            <rect x="16.5" y="3" width="5.5" height="6" strokeWidth="2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setMenuGridColumns(4)}
                          className={`p-1.5 rounded transition-all ${menuGridColumns === 4 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                          title="4 columns"
                        >
                          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="1.5" y="3" width="4" height="6" strokeWidth="2" />
                            <rect x="7" y="3" width="4" height="6" strokeWidth="2" />
                            <rect x="12.5" y="3" width="4" height="6" strokeWidth="2" />
                            <rect x="18" y="3" width="4" height="6" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Menu Items Content */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4">
              {isLoadingMenuItems ? (
                <div className="flex items-center justify-center h-48">
                  <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="text-center py-10">
                  <Utensils className="w-10 h-10 md:w-12 md:h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm md:text-base">No items available</p>
                </div>
              ) : menuViewMode === 'grid' ? (
                <div className={`grid gap-2 md:gap-3 ${menuGridColumns === 2 ? 'grid-cols-2 md:grid-cols-2' :
                  menuGridColumns === 3 ? 'grid-cols-2 md:grid-cols-3' :
                    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  }`}>
                  {filteredMenuItems.map((item) => (
                    <div key={item._id} className="bg-white rounded-xl overflow-hidden shadow border border-gray-200 hover:shadow-lg transition">
                      <div className="relative h-28 md:h-32 bg-gray-100">
                        {item.imgURL && item.imgURL !== '/images/default-item.jpg' ? (
                          <img src={item.imgURL} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                            <Utensils className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                          </div>
                        )}
                        {item.mostSell && (
                          <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2 bg-red-500 text-white px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold">
                            🔥
                          </div>
                        )}
                      </div>
                      <div className="p-2 md:p-3">
                        <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                        <div className="flex items-center justify-between mb-1.5 md:mb-2">
                          <span className="text-base md:text-lg font-bold text-amber-600">₹{item.price?.toFixed(0)}</span>
                          {item.preparationTime && (
                            <span className="text-[10px] md:text-xs bg-amber-50 text-amber-700 px-1 md:px-1.5 py-0.5 rounded">
                              {item.preparationTime}m
                            </span>
                          )}
                        </div>
                        {cart[item._id] ? (
                          <div className="flex items-center gap-1 md:gap-1.5 bg-amber-500 rounded-lg p-1 md:p-1.5">
                            <button onClick={() => handleRemoveFromCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 md:p-1 rounded">
                              <Minus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <span className="flex-1 text-center text-white font-bold text-xs md:text-sm">{cart[item._id]}</span>
                            <button onClick={() => handleAddToCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 md:p-1 rounded">
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item._id)}
                            className="w-full py-1 md:py-1.5 px-2 rounded-lg font-semibold text-xs md:text-sm flex items-center justify-center gap-1 md:gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Table View for Menu Items
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                        <tr>
                          <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Item</th>
                          <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Price</th>
                          <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700 hidden sm:table-cell">Time</th>
                          <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredMenuItems.map((item) => (
                          <tr key={item._id} className="hover:bg-amber-50/50 transition-colors">
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center gap-2">
                                {item.imgURL && item.imgURL !== '/images/default-item.jpg' ? (
                                  <img src={item.imgURL} alt={item.name} className="w-8 h-8 md:w-10 md:h-10 rounded object-cover" />
                                ) : (
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                    <Utensils className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900 text-xs md:text-sm">{item.name}</p>
                                  {item.mostSell && <span className="text-[10px] text-red-500 font-bold">🔥 Popular</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                              <span className="font-bold text-amber-600 text-sm md:text-base">₹{item.price?.toFixed(0)}</span>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-center hidden sm:table-cell">
                              {item.preparationTime && (
                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                                  {item.preparationTime}m
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center justify-center gap-1 md:gap-2">
                                {cart[item._id] ? (
                                  <div className="flex items-center gap-0.5 md:gap-1 bg-amber-500 rounded-lg p-0.5 md:p-1">
                                    <button onClick={() => handleRemoveFromCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 rounded">
                                      <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                    <span className="text-white font-bold text-xs md:text-sm px-1">{cart[item._id]}</span>
                                    <button onClick={() => handleAddToCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 rounded">
                                      <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(item._id)}
                                    className="py-1 md:py-1.5 px-2 md:px-3 rounded-lg font-semibold text-xs md:text-sm bg-amber-500 text-white hover:bg-amber-600"
                                  >
                                    <Plus className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                                    Add
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
            </div>

            {/* Cart Footer */}
            <div className="border-t-2 border-amber-500 bg-white p-3 md:p-4 flex-shrink-0 shadow-lg">
              {cartItemsCount > 0 ? (
                <div className="mb-2 md:mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-gray-600 text-[10px] md:text-xs">Items: {cartItemsCount}</p>
                      <p className="text-xl md:text-2xl font-bold text-amber-600">₹{cartTotal}</p>
                    </div>
                    <button onClick={() => setCart({})} className="text-xs text-red-600 font-semibold px-2 md:px-3 py-1 md:py-1.5 bg-red-50 rounded-lg">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1 max-h-16 overflow-y-auto bg-amber-50 p-1.5 md:p-2 rounded-lg">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = menuItems.find(m => m._id === itemId);
                      return (
                        <div key={itemId} className="flex justify-between text-[10px] md:text-xs">
                          <span className="text-gray-700">{item?.name} × {qty}</span>
                          <span className="font-bold text-gray-900">₹{((item?.price || 0) * qty).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 md:py-3 mb-2 md:mb-3">
                  <p className="text-gray-500 text-xs md:text-sm">Cart is empty</p>
                </div>
              )}
              <div className="flex gap-2">
                {session && (
                  <button
                    onClick={() => {
                      setShowMenuView(false);
                      setEditingOrderId(null);
                    }}
                    className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-xs md:text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={editingOrderId ? () => handleAddItemToOrder(editingOrderId) : handlePlaceOrder}
                  disabled={isLoading || cartItemsCount === 0}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-bold text-xs md:text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
                >
                  {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : (
                    <>{editingOrderId ? <><Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />Add to Order</> : <><Send className="w-3.5 h-3.5 md:w-4 md:h-4" />Place Order</>}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
              </div>
            ) : session ? (
              <>
                {/* Session Info */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-3 md:mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                    <div>
                      <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Session ID</p>
                      <p className="font-bold text-gray-900 text-xs md:text-sm truncate">{session.sessionId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Orders</p>
                      <p className="font-bold text-gray-900">{activeOrders.length}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Total</p>
                      <p className="font-bold text-amber-600 text-base md:text-lg">₹{sessionTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Orders Section */}
                <div className="mb-3 md:mb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 md:mb-3">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                      Orders ({activeOrders.length})
                    </h3>

                    {activeOrders.length > 0 && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                          <button
                            onClick={() => setOrdersViewMode('grid')}
                            className={`p-1.5 md:p-2 rounded transition-all ${ordersViewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                            title="Card view"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => setOrdersViewMode('table')}
                            className={`p-1.5 md:p-2 rounded transition-all ${ordersViewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                            title="Table view"
                          >
                            <List className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Grid Column Selector - Only show in grid mode */}
                        {ordersViewMode === 'grid' && (
                          <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                              onClick={() => setOrdersGridColumns(1)}
                              className={`p-1.5 rounded transition-all ${ordersGridColumns === 1 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                              title="1 column"
                            >
                              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="6" strokeWidth="2" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setOrdersGridColumns(2)}
                              className={`p-1.5 rounded transition-all ${ordersGridColumns === 2 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                              title="2 columns"
                            >
                              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="3" width="9" height="6" strokeWidth="2" />
                                <rect x="13" y="3" width="9" height="6" strokeWidth="2" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setOrdersGridColumns(3)}
                              className={`p-1.5 rounded transition-all ${ordersGridColumns === 3 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                              title="3 columns"
                            >
                              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="3" width="5.5" height="6" strokeWidth="2" />
                                <rect x="9.25" y="3" width="5.5" height="6" strokeWidth="2" />
                                <rect x="16.5" y="3" width="5.5" height="6" strokeWidth="2" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {activeOrders.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs md:text-sm">No orders yet</p>
                    </div>
                  ) : ordersViewMode === 'grid' ? (
                    <div className={`grid gap-2 md:gap-3 ${ordersGridColumns === 1 ? 'grid-cols-1' :
                      ordersGridColumns === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                        'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      }`}>
                      {activeOrders.map((order) => (
                        <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4">
                          <div className="flex items-start justify-between mb-2 md:mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm md:text-base">{order.orderId}</h4>
                              <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                {new Date(order.orderedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <select
                                value={order.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border cursor-pointer ${order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  order.orderStatus === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                  }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="preparing">Preparing</option>
                                <option value="served">Served</option>
                              </select>
                              <button
                                onClick={() => {
                                  setEditingOrderId(order._id);
                                  setShowMenuView(true);
                                  if (!menuItems.length) loadMenuItems();
                                  if (!categories.length) loadCategories();
                                }}
                                className="p-1 md:p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="Add items to this order"
                              >
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button onClick={() => setShowDeleteOrderConfirm(order._id)} className="p-1 md:p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Order Items Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs md:text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Item</th>
                                  <th className="text-center py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Qty</th>
                                  <th className="text-right py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Price</th>
                                  <th className="text-right py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Total</th>
                                  <th className="text-center py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2">
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        {item.menuItem?.imgURL && item.menuItem.imgURL !== '/images/default-item.jpg' ? (
                                          <img src={item.menuItem.imgURL} alt={item.name} className="w-6 h-6 md:w-8 md:h-8 rounded object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                            <Utensils className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                          </div>
                                        )}
                                        <span className="font-medium text-gray-900 text-[10px] md:text-xs">{item.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-center font-semibold text-gray-700">{item.quantity}</td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-right text-gray-600">₹{item.price}</td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-right font-bold text-amber-600">₹{item.subtotal.toFixed(2)}</td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2">
                                      <div className="flex items-center justify-center gap-0.5 md:gap-1">
                                        <button
                                          onClick={() => handleOpenEditItem(order, item)}
                                          className="p-0.5 md:p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                          title="Edit item"
                                        >
                                          <Edit2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                        </button>
                                        <button
                                          onClick={() => setShowDeleteItemConfirm({ orderId: order._id, itemId: item._id })}
                                          className="p-0.5 md:p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                          title="Remove item"
                                        >
                                          <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="pt-2 md:pt-3 mt-2 md:mt-3 border-t border-gray-200 flex items-center justify-between">
                            <span className="flex items-center gap-1 bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium text-blue-700">
                              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />{order.estimatedTime} mins
                            </span>
                            <div className="text-right">
                              <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Order Total</p>
                              <span className="text-lg md:text-xl font-bold text-amber-600">₹{order.orderAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Table View for Orders
                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                            <tr>
                              <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Order ID</th>
                              <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden sm:table-cell">Time</th>
                              <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden md:table-cell">Items</th>
                              <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Status</th>
                              <th className="px-3 md:px-4 py-2.5 md:py-3 text-right text-xs md:text-sm font-bold text-gray-700">Amount</th>
                              <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {activeOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-amber-50/50 transition-colors">
                                {/* Order ID */}
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <span className="font-bold text-gray-900 text-xs md:text-sm">{order.orderId}</span>
                                </td>

                                {/* Time */}
                                <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    {new Date(order.orderedAt).toLocaleTimeString()}
                                  </div>
                                </td>

                                {/* Items Count */}
                                <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                                  <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                                    <Package className="w-3 h-3" />
                                    {order.items.length} items
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <div className="flex justify-center">
                                    <select
                                      value={order.orderStatus}
                                      onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border cursor-pointer ${order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        order.orderStatus === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          'bg-green-50 text-green-700 border-green-200'
                                        }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="preparing">Preparing</option>
                                      <option value="served">Served</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Amount */}
                                <td className="px-3 md:px-4 py-2 md:py-3 text-right">
                                  <div className="flex items-center justify-end gap-0.5 md:gap-1">
                                    <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                    <span className="text-sm md:text-base font-bold text-amber-600">
                                      {order.orderAmount.toFixed(2)}
                                    </span>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <div className="flex items-center justify-center gap-1 md:gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingOrderId(order._id);
                                        setShowMenuView(true);
                                        if (!menuItems.length) loadMenuItems();
                                        if (!categories.length) loadCategories();
                                      }}
                                      className="p-1 md:p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                      title="Add items"
                                    >
                                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteOrderConfirm(order._id)}
                                      className="p-1 md:p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                      title="Delete order"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowMenuView(true);
                      setEditingOrderId(null);
                      if (!menuItems.length) loadMenuItems();
                      if (!categories.length) loadCategories();
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />New Order
                  </button>
                  <button
                    onClick={() => setShowBill(true)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm"
                  >
                    <Receipt className="w-4 h-4 md:w-5 md:h-5" />Bill
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="bg-red-100 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 text-sm md:text-base">No active session</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Item Modal */}
      {showEditItemModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Edit Item</h3>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Item</label>
                <p className="text-gray-900 font-medium text-sm md:text-base">{showEditItemModal.item.name}</p>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => setEditItemQuantity(Math.max(1, editItemQuantity - 1))}
                    className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={editItemQuantity}
                    onChange={(e) => setEditItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-lg md:text-xl font-bold py-1.5 md:py-2 border-2 rounded-lg"
                  />
                  <button
                    onClick={() => setEditItemQuantity(editItemQuantity + 1)}
                    className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Special Instructions (Optional)</label>
                <textarea
                  value={editItemInstructions}
                  onChange={(e) => setEditItemInstructions(e.target.value)}
                  placeholder="e.g., Extra spicy, No onions..."
                  className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border-2 rounded-lg resize-none text-xs md:text-sm"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={() => setShowEditItemModal(null)}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 rounded-lg font-semibold text-xs md:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrderItem}
                disabled={isLoading}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-blue-500 text-white rounded-lg font-bold text-xs md:text-sm disabled:opacity-50"
              >
                {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" /> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation */}
      {showDeleteItemConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full">
            <div className="text-center mb-4 md:mb-5">
              <h3 className="text-lg md:text-xl font-bold mb-2">Remove Item?</h3>
              <p className="text-gray-600 text-xs md:text-sm">This will remove this item from the order.</p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={() => setShowDeleteItemConfirm(null)} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 rounded-lg font-semibold text-xs md:text-sm">Cancel</button>
              <button onClick={handleDeleteOrderItem} disabled={isLoading} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-500 text-white rounded-lg font-bold text-xs md:text-sm">
                {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Component */}
      {showBill && session && (
        <BillComponent
          session={session}
          table={table}
          hotelName="Our Cafe"
          isLoading={isLoading}
          onPrint={() => {
            // Bill print functionality is handled by the component
          }}
          onConfirm={() => {
            setShowBill(false);
            setShowCompleteConfirm(true);
          }}
          onCancel={() => setShowBill(false)}
        />
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full">
            <div className="text-center mb-4 md:mb-5">
              <div className="bg-green-100 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Complete Session?</h3>
              <p className="text-xl md:text-2xl font-bold text-green-600">₹{sessionTotal.toFixed(2)}</p>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full mt-3 px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 border-2 rounded-lg text-xs md:text-sm">
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
              </select>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 rounded-lg font-semibold text-xs md:text-sm">Cancel</button>
              <button onClick={handleCompleteSession} disabled={isLoading} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-green-500 text-white rounded-lg font-bold text-xs md:text-sm">
                {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" /> : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full">
            <div className="text-center mb-4 md:mb-5">
              <h3 className="text-lg md:text-xl font-bold mb-2">Cancel Session?</h3>
              <p className="text-gray-600 text-xs md:text-sm">This will cancel all orders and free the table.</p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 rounded-lg font-semibold text-xs md:text-sm">Go Back</button>
              <button onClick={handleCancelSession} disabled={isLoading} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-500 text-white rounded-lg font-bold text-xs md:text-sm">
                {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {showDeleteOrderConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 max-w-sm w-full">
            <div className="text-center mb-4 md:mb-5">
              <h3 className="text-lg md:text-xl font-bold mb-2">Delete Order?</h3>
              <p className="text-gray-600 text-xs md:text-sm">This will remove this order from the session.</p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={() => setShowDeleteOrderConfirm(null)} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 rounded-lg font-semibold text-xs md:text-sm">Cancel</button>
              <button onClick={() => handleDeleteOrder(showDeleteOrderConfirm)} disabled={isLoading} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-500 text-white rounded-lg font-bold text-xs md:text-sm">
                {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s; }
      `}</style>
    </div>
  );
};

// ============= MAIN DASHBOARD COMPONENT =============
const TableOrderManagementDashboard = () => {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');

  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
  const [gridColumns, setGridColumns] = useState(4); // 2, 3, 4, 5, or 6 columns

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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [tablesRes, sessionsRes, ordersRes, completedSessionsRes] = await Promise.all([
        tablesAPI.getAllTables(),
        sessionsAPI.getAllSessions({ status: 'active' }),
        ordersAPI.getAllOrders({ status: 'pending' }),
        sessionsAPI.getAllSessions({
          status: 'completed',
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString()
        })
      ]);

      if (tablesRes.success) setTables(tablesRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (completedSessionsRes.success) setCompletedSessions(completedSessionsRes.data);

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

  const todayRevenue = completedSessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    activeSessions: sessions.length,
    pendingOrders: orders.length,
    todayRevenue: todayRevenue
  };
  const tableOrderStats = [
    { 
      icon: UtensilsCrossed, 
      label: 'Tables', 
      value: stats.totalTables, 
      color: 'blue' 
    },
    { 
      icon: Users, 
      label: 'Occupied', 
      value: stats.occupiedTables, 
      color: 'red' 
    },
    { 
      icon: CheckCircle, 
      label: 'Active', 
      value: stats.activeSessions, 
      color: 'green' 
    },
    { 
      icon: ShoppingBag, 
      label: 'Pending', 
      value: stats.pendingOrders, 
      color: 'orange' 
    },
    { 
      icon: IndianRupee, 
      label: 'Today', 
      value: `₹${stats.todayRevenue.toFixed(0)}`, 
      color: 'purple' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-3 md:p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-3 right-3 z-50 animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-3 md:px-5 py-2 md:py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs md:text-sm max-w-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="Tables Order Management"
        subtitle="Manage tables, sessions & orders"
      />

      {/* Stats Cards */}
     <StatsCards stats={tableOrderStats} columns={5} />


      {/* Filters & View Controls */}
      <ViewControls
        title="Tables"
        itemCount={filteredTables.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridColumns={gridColumns}
        onGridColumnsChange={setGridColumns}
        availableColumns={[2, 3, 4, 5, 6]}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tables..."
        filters={[
          {
            type: 'select',
            icon: Filter,
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'available', label: 'Available' },
              { value: 'occupied', label: 'Occupied' }
            ]
          },
          {
            type: 'select',
            icon: Filter,
            value: filterFloor,
            onChange: setFilterFloor,
            options: [
              { value: 'all', label: 'All Floors' },
              ...uniqueFloors.map(floor => ({ 
                value: floor, 
                label: `Floor ${floor}` 
              }))
            ]
          }
        ]}
        showReset={false}
      />

      {/* Tables Display */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className={`grid gap-2 md:gap-3 ${gridColumns === 2 ? 'grid-cols-2' :
            gridColumns === 3 ? 'grid-cols-2 md:grid-cols-3' :
              gridColumns === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                gridColumns === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`}>
            {filteredTables.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-md border border-amber-100">
                  <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No tables found</p>
                  <p className="text-gray-500 text-xs md:text-sm">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              filteredTables.map((table) => {
                const tableSession = sessions.find(s => s.table._id === table._id);
                const isOccupied = table.status === 'occupied';

                return (
                  <button
                    key={table._id}
                    onClick={() => handleTableClick(table)}
                    className={`relative p-3 md:p-4 rounded-xl border-2 shadow-md transition-all hover:scale-105 hover:shadow-lg ${isOccupied
                      ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                      : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300'
                      }`}
                  >
                    <div className="text-center">
                      <div className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-1.5 md:mb-2 rounded-full flex items-center justify-center ${isOccupied ? 'bg-red-200' : 'bg-green-200'
                        }`}>
                        <UtensilsCrossed className={`w-5 h-5 md:w-6 md:h-6 ${isOccupied ? 'text-red-700' : 'text-green-700'
                          }`} />
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-gray-900 mb-0.5">
                        T{table.tableNumber}
                      </h3>
                      <p className="text-[10px] md:text-xs text-gray-600 mb-1 md:mb-1.5">Floor {table.floorNumber}</p>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold inline-block ${isOccupied ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                        {isOccupied ? 'Busy' : 'Free'}
                      </div>
                      {/* {tableSession && (
                        <div className="mt-1.5 md:mt-2 text-xs md:text-sm text-gray-700 font-bold">
                          ₹{tableSession.totalAmount?.toFixed(0) || '0'}
                        </div>
                      )} */}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <tr>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Table</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden sm:table-cell">Floor</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden md:table-cell">Capacity</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Status</th>
                    <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Session</th>
                    {/* <th className="px-3 md:px-4 py-2.5 md:py-3 text-right text-xs md:text-sm font-bold text-gray-700">Amount</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTables.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mb-3 flex items-center justify-center">
                            <UtensilsCrossed className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No tables found</p>
                          <p className="text-gray-500 text-xs md:text-sm">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTables.map((table) => {
                      const tableSession = sessions.find(s => s.table._id === table._id);
                      const isOccupied = table.status === 'occupied';

                      return (
                        <tr
                          key={table._id}
                          className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                          onClick={() => handleTableClick(table)}
                        >
                          {/* Table Number */}
                          <td className="px-3 md:px-4 py-2 md:py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${isOccupied ? 'bg-red-100' : 'bg-green-100'
                                }`}>
                                <UtensilsCrossed className={`w-4 h-4 md:w-5 md:h-5 ${isOccupied ? 'text-red-700' : 'text-green-700'
                                  }`} />
                              </div>
                              <span className="font-bold text-gray-900 text-xs md:text-sm">Table {table.tableNumber}</span>
                            </div>
                          </td>

                          {/* Floor */}
                          <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                            <span className="text-xs md:text-sm text-gray-700">Floor {table.floorNumber}</span>
                          </td>

                          {/* Capacity */}
                          <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gray-600" />
                              <span className="text-xs md:text-sm text-gray-700">{table.capacity}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 md:px-4 py-2 md:py-3">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg font-bold text-[10px] md:text-xs ${isOccupied
                                ? 'bg-red-100 border border-red-300 text-red-700'
                                : 'bg-green-100 border border-green-300 text-green-700'
                                }`}>
                                {isOccupied ? (
                                  <>
                                    <EyeOff className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    <span className="hidden sm:inline">Busy</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    <span className="hidden sm:inline">Free</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Session ID */}
                          <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                            {tableSession ? (
                              <span className="text-xs text-gray-700 font-mono">{tableSession.sessionId}</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>

                          {/* Amount */}
                          {/* <td className="px-3 md:px-4 py-2 md:py-3 text-right">
                            {tableSession ? (
                              <div className="flex items-center justify-end gap-0.5 md:gap-1">
                                <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                <span className="text-xs md:text-sm font-bold text-amber-600">
                                  {tableSession.totalAmount?.toFixed(0) || '0'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td> */}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default TableOrderManagementDashboard;