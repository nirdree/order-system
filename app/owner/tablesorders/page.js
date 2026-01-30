'use client';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Plus, Search, Filter, ChevronDown, Clock,
  CheckCircle, AlertCircle, Loader, Eye, TrendingUp, Users,
  IndianRupee, UtensilsCrossed, X, ShoppingBag, Trash2,
  Package, Utensils, Minus, ShoppingCart, Send, Receipt, Edit2
} from 'lucide-react';
import { sessionsAPI, ordersAPI, tablesAPI, menuItemsAPI } from '@/lib/api-client';

// ============= TABLE DETAIL MODAL COMPONENT =============
 export const TableDetailModal = ({ table, isOpen, onClose, onUpdate }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDeleteOrderConfirm, setShowDeleteOrderConfirm] = useState(null);
  
  // Item Management States
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(null);
  const [showEditItemModal, setShowEditItemModal] = useState(null);
  const [editItemQuantity, setEditItemQuantity] = useState(1);
  const [editItemInstructions, setEditItemInstructions] = useState('');

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
      const response = await fetch('/api/categories');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories([{ id: 'all', icon: 'list', imgURL: '', description: 'All Items' }, ...(data.data || [])]);
        }
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

  // NEW: Add item to existing order
  const handleAddItemToOrder = async (orderId) => {
    if (Object.keys(cart).length === 0) {
      showNotification('error', 'Please add at least one item to cart');
      return;
    }

    try {
      setIsLoading(true);
      
      // Add each item from cart to the order
      for (const [menuItemId, quantity] of Object.entries(cart)) {
        const response = await ordersAPI.addItemToOrder(orderId, {
          menuItemId,
          quantity
        });
        
        if (!response.success) {
          showNotification('error', `Failed to add item: ${response.message}`);
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

  // NEW: Open edit item modal
  const handleOpenEditItem = (order, item) => {
    setShowEditItemModal({ orderId: order._id, item });
    setEditItemQuantity(item.quantity);
    setEditItemInstructions(item.specialInstructions || '');
  };

  // NEW: Update order item
  const handleUpdateOrderItem = async () => {
    if (!showEditItemModal) return;

    try {
      setIsLoading(true);
      const { orderId, item } = showEditItemModal;

      const response = await ordersAPI.updateOrderItem(orderId, item._id, {
        quantity: editItemQuantity,
        specialInstructions: editItemInstructions
      });

      if (response.success) {
        showNotification('success', 'Item updated successfully');
        setShowEditItemModal(null);
        await loadSession();
        onUpdate();
      } else {
        showNotification('error', response.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating order item:', error);
      showNotification('error', 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Delete order item
  const handleDeleteOrderItem = async () => {
    if (!showDeleteItemConfirm) return;

    try {
      setIsLoading(true);
      const { orderId, itemId } = showDeleteItemConfirm;

      const response = await ordersAPI.deleteOrderItem(orderId, itemId);

      if (response.success) {
        showNotification('success', 'Item removed from order');
        setShowDeleteItemConfirm(null);
        await loadSession();
        onUpdate();
      } else {
        showNotification('error', response.message || 'Failed to remove item');
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
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error completing session:', error);
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
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
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
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesCategory && item.available;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-[70] animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Table {table.tableNumber}</h2>
            <h2 className="text-xl font-bold text-white">Table {table._id}</h2>
            <p className="text-white/90 text-sm">Floor {table.floorNumber} • {table.capacity} seats</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {showMenuView ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Category Bar */}
            <div className="border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
              <div className="overflow-x-auto scrollbar-thin">
                <div className="flex gap-3 px-4 py-3 min-w-max">
                  {isLoadingCategories ? (
                    <Loader className="w-5 h-5 text-amber-600 animate-spin" />
                  ) : (
                    categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                      >
                        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition ${
                          selectedCategory === cat.id ? 'border-amber-500 shadow-md' : 'border-gray-200'
                        }`}>
                          {cat.imgURL ? (
                            <img src={cat.imgURL} alt={cat.id} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg">
                              {cat.id === 'all' ? '🍽️' : '✨'}
                            </div>
                          )}
                        </div>
                        <p className={`text-xs font-semibold max-w-[60px] truncate ${
                          selectedCategory === cat.id ? 'text-amber-600' : 'text-gray-700'
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
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingMenuItems ? (
                <div className="flex items-center justify-center h-48">
                  <Loader className="w-7 h-7 text-amber-600 animate-spin" />
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="text-center py-10">
                  <Utensils className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-gray-500">No items available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredMenuItems.map((item) => (
                    <div key={item._id} className="bg-white rounded-xl overflow-hidden shadow border border-gray-200 hover:shadow-lg transition">
                      <div className="relative h-32 bg-gray-100">
                        {item.imgURL && item.imgURL !== '/images/default-item.jpg' ? (
                          <img src={item.imgURL} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                            <Utensils className="w-8 h-8 text-amber-500" />
                          </div>
                        )}
                        {item.mostSell && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                            🔥
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-amber-600">₹{item.price?.toFixed(0)}</span>
                          {item.preparationTime && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                              {item.preparationTime}m
                            </span>
                          )}
                        </div>
                        {cart[item._id] ? (
                          <div className="flex items-center gap-1.5 bg-amber-500 rounded-lg p-1.5">
                            <button onClick={() => handleRemoveFromCart(item._id)} className="text-white hover:bg-amber-600 p-1 rounded">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-center text-white font-bold text-sm">{cart[item._id]}</span>
                            <button onClick={() => handleAddToCart(item._id)} className="text-white hover:bg-amber-600 p-1 rounded">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item._id)}
                            className="w-full py-1.5 px-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="border-t-2 border-amber-500 bg-white p-4 flex-shrink-0 shadow-lg">
              {cartItemsCount > 0 ? (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-gray-600 text-xs">Items: {cartItemsCount}</p>
                      <p className="text-2xl font-bold text-amber-600">₹{cartTotal.toFixed(2)}</p>
                    </div>
                    <button onClick={() => setCart({})} className="text-xs text-red-600 font-semibold px-3 py-1.5 bg-red-50 rounded-lg">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1 max-h-16 overflow-y-auto bg-amber-50 p-2 rounded-lg">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = menuItems.find(m => m._id === itemId);
                      return (
                        <div key={itemId} className="flex justify-between text-xs">
                          <span className="text-gray-700">{item?.name} × {qty}</span>
                          <span className="font-bold text-gray-900">₹{((item?.price || 0) * qty).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 mb-3">
                  <p className="text-gray-500 text-sm">Cart is empty</p>
                </div>
              )}
              <div className="flex gap-2">
                {session && (
                  <button 
                    onClick={() => {
                      setShowMenuView(false);
                      setEditingOrderId(null);
                    }} 
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={editingOrderId ? () => handleAddItemToOrder(editingOrderId) : handlePlaceOrder}
                  disabled={isLoading || cartItemsCount === 0}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : (
                    <>{editingOrderId ? <><Plus className="w-4 h-4" />Add to Order</> : <><Send className="w-4 h-4" />Place Order</>}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-7 h-7 text-amber-600 animate-spin" />
              </div>
            ) : session ? (
              <>
                {/* Session Info */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs mb-0.5">Session ID</p>
                      <p className="font-bold text-gray-900 text-xs">{session.sessionId}</p>
                    </div>
                    {/* <div>
                      <p className="text-gray-600 text-xs mb-0.5">Duration</p>
                      <p className="font-bold text-gray-900">{sessionDuration} min</p>
                    </div> */}
                    <div>
                      <p className="text-gray-600 text-xs mb-0.5">Orders</p>
                      <p className="font-bold text-gray-900">{activeOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs mb-0.5">Total</p>
                      <p className="font-bold text-amber-600 text-base">₹{sessionTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Orders Section */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    Orders ({activeOrders.length})
                  </h3>
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeOrders.map((order) => (
                        <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900">{order.orderId}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(order.orderedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={order.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                  order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
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
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="Add items to this order"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button onClick={() => setShowDeleteOrderConfirm(order._id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Order Items Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Item</th>
                                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-700">Qty</th>
                                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Price</th>
                                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Total</th>
                                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center gap-2">
                                        {item.menuItem?.imgURL && item.menuItem.imgURL !== '/images/default-item.jpg' ? (
                                          <img src={item.menuItem.imgURL} alt={item.name} className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                            <Utensils className="w-4 h-4 text-amber-600" />
                                          </div>
                                        )}
                                        <span className="font-medium text-gray-900">{item.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center font-semibold text-gray-700">{item.quantity}</td>
                                    <td className="py-2 px-2 text-right text-gray-600">₹{item.price}</td>
                                    <td className="py-2 px-2 text-right font-bold text-amber-600">₹{item.subtotal.toFixed(2)}</td>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleOpenEditItem(order, item)}
                                          className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                          title="Edit item"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => setShowDeleteItemConfirm({ orderId: order._id, itemId: item._id })}
                                          className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                          title="Remove item"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                            <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium text-blue-700">
                              <Clock className="w-3 h-3" />{order.estimatedTime} mins
                            </span>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-0.5">Order Total</p>
                              <span className="text-xl font-bold text-amber-600">₹{order.orderAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-5 h-5" />New Order
                  </button>
                  <button 
                    onClick={() => setShowCompleteConfirm(true)} 
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    <Receipt className="w-5 h-5" />Bill
                  </button>
                  <button 
                    onClick={() => setShowCancelConfirm(true)} 
                    className="bg-red-100 text-red-700 px-4 py-3 rounded-xl font-bold hover:bg-red-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600">No active session</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Item Modal */}
      {showEditItemModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Edit Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item</label>
                <p className="text-gray-900 font-medium">{showEditItemModal.item.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditItemQuantity(Math.max(1, editItemQuantity - 1))}
                    className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={editItemQuantity}
                    onChange={(e) => setEditItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-xl font-bold py-2 border-2 rounded-lg"
                  />
                  <button
                    onClick={() => setEditItemQuantity(editItemQuantity + 1)}
                    className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions (Optional)</label>
                <textarea
                  value={editItemInstructions}
                  onChange={(e) => setEditItemInstructions(e.target.value)}
                  placeholder="e.g., Extra spicy, No onions..."
                  className="w-full px-3 py-2 border-2 rounded-lg resize-none"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditItemModal(null)}
                className="flex-1 px-4 py-2.5 border-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrderItem}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation */}
      {showDeleteItemConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <h3 className="text-xl font-bold mb-2">Remove Item?</h3>
              <p className="text-gray-600 text-sm">This will remove this item from the order.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteItemConfirm(null)} className="flex-1 px-4 py-2.5 border-2 rounded-lg font-semibold">Cancel</button>
              <button onClick={handleDeleteOrderItem} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-bold">
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Session?</h3>
              <p className="text-2xl font-bold text-green-600">₹{sessionTotal.toFixed(2)}</p>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full mt-3 px-4 py-2.5 bg-gray-50 border-2 rounded-lg text-sm">
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 px-4 py-2.5 border-2 rounded-lg font-semibold">Cancel</button>
              <button onClick={handleCompleteSession} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg font-bold">
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <h3 className="text-xl font-bold mb-2">Cancel Session?</h3>
              <p className="text-gray-600 text-sm">This will cancel all orders and free the table.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2.5 border-2 rounded-lg font-semibold">Go Back</button>
              <button onClick={handleCancelSession} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-bold">
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {showDeleteOrderConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <h3 className="text-xl font-bold mb-2">Delete Order?</h3>
              <p className="text-gray-600 text-sm">This will remove this order from the session.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteOrderConfirm(null)} className="flex-1 px-4 py-2.5 border-2 rounded-lg font-semibold">Cancel</button>
              <button onClick={() => handleDeleteOrder(showDeleteOrderConfirm)} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-bold">
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Delete'}
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
const OrderManagementDashboard = () => {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
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
      
      // Get today's date range
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

  // Calculate stats including completed sessions
  const todayRevenue = completedSessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  
  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    activeSessions: sessions.length,
    pendingOrders: orders.length,
    todayRevenue: todayRevenue
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Order Management</h1>
              <p className="text-gray-600 text-sm font-medium">Manage tables, sessions & orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white/90 backdrop-blur border border-blue-200 rounded-xl p-3 shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <UtensilsCrossed className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600">Tables</p>
            </div>
            <p className="text-xl font-bold text-blue-700">{stats.totalTables}</p>
          </div>

          <div className="bg-white/90 backdrop-blur border border-red-200 rounded-xl p-3 shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-red-100 p-1.5 rounded-lg">
                <Users className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600">Occupied</p>
            </div>
            <p className="text-xl font-bold text-red-700">{stats.occupiedTables}</p>
          </div>

          <div className="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-3 shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600">Active</p>
            </div>
            <p className="text-xl font-bold text-green-700">{stats.activeSessions}</p>
          </div>

          <div className="bg-white/90 backdrop-blur border border-orange-200 rounded-xl p-3 shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-orange-100 p-1.5 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600">Pending</p>
            </div>
            <p className="text-xl font-bold text-orange-700">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white/90 backdrop-blur border border-purple-200 rounded-xl p-3 shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-purple-100 p-1.5 rounded-lg">
                <IndianRupee className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600">Today</p>
            </div>
            <p className="text-xl font-bold text-purple-700">₹{stats.todayRevenue.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border border-amber-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 appearance-none cursor-pointer"
              >
                <option value="all">All Floors</option>
                {uniqueFloors.map(floor => (
                  <option key={floor} value={floor}>Floor {floor}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-7 h-7 text-amber-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTables.map((table) => {
              const tableSession = sessions.find(s => s.table._id === table._id);
              const isOccupied = table.status === 'occupied';
              
              return (
                <button
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  className={`relative p-4 rounded-xl border-2 shadow-md transition-all hover:scale-105 hover:shadow-lg ${
                    isOccupied
                      ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                      : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      isOccupied ? 'bg-red-200' : 'bg-green-200'
                    }`}>
                      <UtensilsCrossed className={`w-6 h-6 ${
                        isOccupied ? 'text-red-700' : 'text-green-700'
                      }`} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-0.5">
                      T{table.tableNumber}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1.5">Floor {table.floorNumber}</p>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold inline-block ${
                      isOccupied ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {isOccupied ? 'Busy' : 'Free'}
                    </div>
                    {tableSession && (
                      <div className="mt-2 text-xs text-gray-700 font-bold">
                        ₹{tableSession.totalAmount?.toFixed(0) || '0'}
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
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default OrderManagementDashboard;