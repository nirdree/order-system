'use client';
import React, { useState, useEffect } from 'react';
import {
  X, Plus, Edit, Trash2, Clock, IndianRupee, User, Calendar,
  CheckCircle, AlertCircle, Loader, ShoppingBag, Receipt,
  Utensils, Package, ArrowRight, Users, MapPin, Minus
} from 'lucide-react';
import { sessionsAPI, ordersAPI, menuItemsAPI } from '@/lib/api-client';

const TableDetailModal = ({ table, isOpen, onClose, onUpdate }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);

  useEffect(() => {
    if (isOpen && table) {
      if (table.status === 'occupied') {
        loadSession();
      }
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
        // Get full session details with orders
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

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleCreateSession = async () => {
    try {
      setIsCreatingSession(true);
      const response = await sessionsAPI.createSession({
        tableId: table._id,
        customerCount: 1
      });

      if (response.success) {
        showNotification('success', 'Session created successfully');
        setSession(response.data);
        onUpdate();
      } else {
        showNotification('error', response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      showNotification('error', 'Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleCompleteSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionsAPI.completeSession(session._id, {
        paymentMethod
      });

      if (response.success) {
        showNotification('success', 'Session completed successfully');
        setShowCompleteConfirm(false);
        onUpdate();
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
        onUpdate();
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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, newStatus);

      if (response.success) {
        showNotification('success', 'Order status updated');
        loadSession();
      } else {
        showNotification('error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification('error', 'Failed to update status');
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenuItems(true);
      setSelectedItems({}); // Reset selected items
      const response = await menuItemsAPI.getAllMenuItems();
      
      if (response.success) {
        setMenuItems(response.data || []);
      } else {
        showNotification('error', 'Failed to load menu items');
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      showNotification('error', 'Failed to load menu items');
    } finally {
      setIsLoadingMenuItems(false);
    }
  };

  const handleOpenAddOrderModal = async () => {
    setShowAddOrderModal(true);
    await loadMenuItems();
  };

  const handleAddItemToOrder = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemoveItemFromOrder = (itemId) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[itemId] > 1) {
        newItems[itemId] -= 1;
      } else {
        delete newItems[itemId];
      }
      return newItems;
    });
  };

  const handlePlaceOrder = async () => {
    try {
      if (Object.keys(selectedItems).length === 0) {
        showNotification('error', 'Please select at least one item');
        return;
      }

      setIsLoading(true);
      
      const items = Object.entries(selectedItems).map(([itemId, quantity]) => {
        const menuItem = menuItems.find(m => m._id === itemId);
        return {
          menuItemId: itemId,
          quantity: quantity
        };
      });

      const response = await ordersAPI.createOrder({
        sessionId: session._id,
        items: items,
        orderType: 'dine-in'
      });

      if (response.success) {
        showNotification('success', 'Order placed successfully');
        setShowAddOrderModal(false);
        setSelectedItems({});
        loadSession();
      } else {
        showNotification('error', response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('error', 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeOrders = session?.orders?.filter(o => o.orderStatus !== 'cancelled') || [];
  const sessionDuration = session ? Math.floor((new Date() - new Date(session.startTime)) / 1000 / 60) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Table {table.tableNumber}</h2>
            <p className="text-white/80">Floor {table.floorNumber} • Capacity: {table.capacity}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
          ) : table.status === 'available' ? (
            // Available Table - Start New Session
            <div className="text-center py-12">
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Table Available</h3>
              <p className="text-gray-600 mb-8">Start a new session to begin taking orders</p>
              
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {isCreatingSession ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Start New Session
                  </>
                )}
              </button>
            </div>
          ) : session ? (
            // Occupied Table - Show Session Details
            <>
              {/* Session Info */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Session ID</p>
                    <p className="font-bold text-gray-900">{session.sessionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="font-bold text-gray-900">{sessionDuration} mins</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Orders</p>
                    <p className="font-bold text-gray-900">{activeOrders.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="font-bold text-amber-600 text-lg">₹{session.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Initiated By</p>
                    <p className="font-semibold text-gray-900 capitalize">{session.initiatedBy}</p>
                  </div>
                  {session.customerName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Customer</p>
                      <p className="font-semibold text-gray-900">{session.customerName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders List */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  Orders ({activeOrders.length})
                </h3>

                {activeOrders.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <div key={order._id} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">{order.orderId}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(order.orderedAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-sm font-bold border-2 cursor-pointer ${
                              order.orderStatus === 'pending' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                              order.orderStatus === 'preparing' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                              order.orderStatus === 'served' ? 'bg-green-100 text-green-700 border-green-300' :
                              'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="served">Served</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                {item.menuItem?.imgURL && (
                                  <img
                                    src={item.menuItem.imgURL}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900">{item.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                                  {item.specialInstructions && (
                                    <p className="text-xs text-amber-600 italic">{item.specialInstructions}</p>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {order.customerNotes && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Customer Notes:</p>
                            <p className="text-sm text-gray-900">{order.customerNotes}</p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {order.estimatedTime} mins
                            </span>
                            <span className="capitalize">By: {order.placedBy}</span>
                          </div>
                          <span className="text-lg font-bold text-amber-600">₹{order.orderAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleOpenAddOrderModal}
                  className="flex-1 bg-blue-100 text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Order
                </button>
                
                <button
                  onClick={() => setShowCompleteConfirm(true)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Receipt className="w-5 h-5" />
                  Complete & Bill
                </button>
                
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="bg-red-100 text-red-700 px-6 py-3 rounded-xl font-bold hover:bg-red-200 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">No active session found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add Items to Order</h2>
              <button
                onClick={() => {
                  setShowAddOrderModal(false);
                  setSelectedItems({});
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingMenuItems ? (
                <div className="flex items-center justify-center h-64">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No menu items available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <div key={item._id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                      {item.imgURL && (
                        <img
                          src={item.imgURL}
                          alt={item.name}
                          className="w-full h-32 rounded-lg object-cover mb-3"
                        />
                      )}
                      
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">₹{item.price?.toFixed(2)}</span>
                          {item.category && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRemoveItemFromOrder(item._id)}
                          disabled={!selectedItems[item._id]}
                          className="flex-1 bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <Minus className="w-4 h-4" />
                          <span className="text-xs font-bold">Remove</span>
                        </button>
                        <div className="bg-gray-100 px-3 py-2 rounded-lg min-w-[60px] text-center">
                          <p className="text-sm font-bold text-gray-900">{selectedItems[item._id] || 0}</p>
                        </div>
                        <button
                          onClick={() => handleAddItemToOrder(item._id)}
                          className="flex-1 bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-xs font-bold">Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Summary */}
            <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
              {Object.keys(selectedItems).length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="space-y-2 mb-3">
                    {Object.entries(selectedItems).map(([itemId, qty]) => {
                      const item = menuItems.find(m => m._id === itemId);
                      return (
                        <div key={itemId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-900">{item?.name} × {qty}</span>
                          <span className="font-bold text-gray-900">₹{((item?.price || 0) * qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-blue-200 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
                        const item = menuItems.find(m => m._id === itemId);
                        return sum + ((item?.price || 0) * qty);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAddOrderModal(false);
                    setSelectedItems({});
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading || Object.keys(selectedItems).length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Session Confirmation */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Session?</h3>
              <p className="text-gray-600 mb-4">
                Total Amount: <span className="text-2xl font-bold text-green-600">₹{session?.totalAmount?.toFixed(2)}</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSession}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Session Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Cancel Session?</h3>
              <p className="text-gray-600">
                This will cancel all orders and free the table. This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSession}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all shadow-lg disabled:opacity-50"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Cancel Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default TableDetailModal;