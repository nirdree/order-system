'use client';
import React, { useState, useEffect } from 'react';
import {
  Plus, ChevronDown, Clock, CheckCircle, AlertCircle, Loader, 
  Eye, TrendingUp, Users, IndianRupee, UtensilsCrossed, X, 
  ShoppingBag, Trash2, Package, Utensils, Minus, ShoppingCart, 
  Send, Receipt, Edit2
} from 'lucide-react';
import { sessionsAPI, ordersAPI, tablesAPI, menuItemsAPI, customerAPI } from '@/lib/api-client';
import { useParams } from 'next/navigation';

const OrderManagementDashboard = () => {
  const params = useParams();
  const tableId = params?.tableId;

  // Main states
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Session & Order states
  const [session, setSession] = useState(null);

  // Menu & Cart states
  const [showMenuView, setShowMenuView] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadTableData();
  }, [tableId]);

  useEffect(() => {
    if (selectedTable) {
      if (selectedTable.status === 'occupied') {
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
    }
  }, [selectedTable]);

  const loadTableData = async () => {
    try {
      setIsLoading(true);
      const tabledata = await tablesAPI.getTableById(tableId);
      if (tabledata.success) setSelectedTable(tabledata.data);
    } catch (error) {
      console.error('Error loading table data:', error);
      showNotification('error', 'Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionsAPI.getAllSessions({ 
        tableId: selectedTable._id,
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
    
    const items = Object.entries(cart).map(([itemId, quantity]) => ({
      menuItemId: itemId,
      quantity
    }));

    // Use the public customer API endpoint instead of authenticated endpoints
    const orderResponse = await customerAPI.placeOrder({
      tableId: selectedTable._id,
      items,
      customerName: '', // Optional: you can add a form to collect this
      customerPhone: '', // Optional: you can add a form to collect this
      customerNotes: '' // Optional: you can add a form to collect this
    });

    if (orderResponse.success) {
      showNotification('success', 'Order placed successfully');
      setCart({});
      setShowMenuView(false);
      
      // Reload table data to get updated status
      await loadTableData();
      
      // Load the session that was created/updated by the order
      await loadSession();
    } else {
      showNotification('error', orderResponse.error || 'Failed to place order');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    showNotification('error', 'Failed to place order');
  } finally {
    setIsLoading(false);
  }
};

  const activeOrders = session?.orders?.filter(o => o.orderStatus !== 'cancelled') || [];
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-[70] animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-full w-full max-h-full overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Table {selectedTable?.tableNumber}</h2>
              <p className="text-white/90 text-sm">Floor {selectedTable?.floorNumber} • {selectedTable?.capacity} seats</p>
            </div>
          </div>

          {showMenuView ? (
            /* MENU VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Category Bar */}
              <div className="border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
                <div className="overflow-x-auto scrollbar-thin">
                  <div className="flex gap-3 px-4 py-3 min-w-max">
                    {isLoadingCategories ? (
                      <Loader className="w-5 h-5 text-amber-600 animate-spin" />
                    ) : (
                      categories.map(cat => (
                        <button
                          key={cat._id}
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
                      onClick={() => setShowMenuView(false)} 
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading || cartItemsCount === 0}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : (
                      <><Send className="w-4 h-4" />Place Order</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* SESSION VIEW */
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
                                <p className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                  order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  order.orderStatus === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-green-50 text-green-700 border-green-200'
                                }`}>{order.orderStatus}</p>
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
                        if (!menuItems.length) loadMenuItems(); 
                        if (!categories.length) loadCategories(); 
                      }} 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-5 h-5" />New Order
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
      </div>

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

export default OrderManagementDashboard;