'use client';
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Minus, X, Check, Clock, IndianRupee,
  ChevronRight, AlertCircle, Loader, Coffee, CheckCircle,
  User, Phone, MessageSquare, Eye, Package
} from 'lucide-react';
import { customerAPI } from '@/lib/api-client';
import { useParams } from 'next/navigation';

const CustomerMenu = () => {
  const params = useParams();
  const tableId = params.tableId ;
  const [menuData, setMenuData] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenuForOrder, setShowMenuForOrder] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [selectedItemsForOrder, setSelectedItemsForOrder] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    loadMenu();
  }, [tableId]);

  const loadMenu = async () => {
    try {
      setIsLoading(true);
      const response = await customerAPI.getMenuForTable(tableId);
      
      if (response.success) {
        setMenuData(response.data);
        
        // Auto-select first category
        if (response.data.menu.length > 0) {
          setSelectedCategory(response.data.menu[0].categoryId);
        }
      } else {
        showNotification('error', 'Failed to load menu');
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      showNotification('error', 'Failed to load menu');
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

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, specialInstructions: '' }]);
    }
    
    showNotification('success', `${item.name} added to cart`);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item._id === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const updateSpecialInstructions = (itemId, instructions) => {
    setCart(cart.map(item =>
      item._id === itemId ? { ...item, specialInstructions: instructions } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleAddItemsClick = (itemId) => {
    setSelectedItemsForOrder(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemoveItemClick = (itemId) => {
    setSelectedItemsForOrder(prev => {
      const newItems = { ...prev };
      if (newItems[itemId] > 1) {
        newItems[itemId] -= 1;
      } else {
        delete newItems[itemId];
      }
      return newItems;
    });
  };

  const handleSubmitAddItems = async () => {
    try {
      if (Object.keys(selectedItemsForOrder).length === 0) {
        showNotification('error', 'Please select at least one item');
        return;
      }

      setIsSubmitting(true);

      const items = Object.entries(selectedItemsForOrder).map(([itemId, quantity]) => ({
        menuItemId: itemId,
        quantity: quantity
      }));

      const response = await customerAPI.placeOrder({
        tableId,
        items: items
      });

      if (response.success) {
        showNotification('success', `Order placed! Order #${response.data.order.orderId}`);
        setSelectedItemsForOrder({});
        setShowAddItemsModal(false);
        
        // Reload menu to show updated session
        await loadMenu();
      } else {
        showNotification('error', response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('error', 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showNotification('error', 'Your cart is empty');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true);

      const orderData = {
        tableId,
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerNotes: customerInfo.notes
      };

      const response = await customerAPI.placeOrder(orderData);

      if (response.success) {
        showNotification('success', `Order placed! Order #${response.data.order.orderId}`);
        setCart([]);
        setIsCheckoutOpen(false);
        setShowMenuForOrder(false);
        setCustomerInfo({ name: '', phone: '', notes: '' });
        
        // Reload menu to show updated session
        await loadMenu();
      } else {
        showNotification('error', response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('error', 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Table Not Found</h2>
          <p className="text-gray-600">Please scan a valid QR code</p>
        </div>
      </div>
    );
  }

  const { table, session, menu, categories } = menuData;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If there's an active session, show session view instead of menu
  if (session && session.status === 'active') {
    const activeOrders = session.orders?.filter(o => o.orderStatus !== 'cancelled') || [];
    const sessionDuration = Math.floor((new Date() - new Date(session.startTime)) / 1000 / 60);

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 pb-24">
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
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b-2 border-amber-100 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Table {table.tableNumber}</h1>
              <p className="text-sm text-gray-600">Session Active • {sessionDuration} mins</p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Session ID</p>
                <p className="font-bold text-gray-900">{session.sessionId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Duration</p>
                <p className="font-bold text-gray-900">{sessionDuration} mins</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="font-bold text-blue-600 text-lg">₹{session.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Orders ({activeOrders.length})</h2>
          
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200 mb-6">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {activeOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-2xl p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{order.orderId}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.orderedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      order.orderStatus === 'pending' ? 'bg-orange-100 text-orange-700' :
                      order.orderStatus === 'preparing' ? 'bg-blue-100 text-blue-700' :
                      order.orderStatus === 'served' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          {item.menuItem?.imgURL && (
                            <img src={item.menuItem.imgURL} alt={item.name} className="w-8 h-8 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">₹{item.subtotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Order Total</span>
                      <span className="font-bold text-lg text-blue-600">₹{order.orderAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add More Items Button */}
          <button
            onClick={() => {
              setShowAddItemsModal(true);
              setSelectedCategory(menu.length > 0 ? menu[0].categoryId : 'all');
              setSelectedItemsForOrder({});
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add More Items
          </button>

          {/* Add Items Modal */}
          {showAddItemsModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Add Items to Order</h2>
                  <button
                    onClick={() => {
                      setShowAddItemsModal(false);
                      setSelectedItemsForOrder({});
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Categories */}
                <div className="border-b border-gray-200 px-8 py-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {menu.map((category) => (
                      <button
                        key={category.categoryId}
                        onClick={() => setSelectedCategory(category.categoryId)}
                        className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                          selectedCategory === category.categoryId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.categoryName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Items Grid */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menu
                      .filter(cat => cat.categoryId === selectedCategory)
                      .flatMap(cat => cat.items)
                      .map((item) => (
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
                              onClick={() => handleRemoveItemClick(item._id)}
                              disabled={!selectedItemsForOrder[item._id]}
                              className="flex-1 bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              <Minus className="w-4 h-4" />
                              <span className="text-xs font-bold">Remove</span>
                            </button>
                            <div className="bg-gray-100 px-3 py-2 rounded-lg min-w-[60px] text-center">
                              <p className="text-sm font-bold text-gray-900">{selectedItemsForOrder[item._id] || 0}</p>
                            </div>
                            <button
                              onClick={() => handleAddItemsClick(item._id)}
                              className="flex-1 bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-xs font-bold">Add</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Footer with Summary */}
                <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
                  {Object.keys(selectedItemsForOrder).length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <div className="space-y-2 mb-3">
                        {Object.entries(selectedItemsForOrder).map(([itemId, qty]) => {
                          const item = menu.flatMap(cat => cat.items).find(m => m._id === itemId);
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
                          ₹{Object.entries(selectedItemsForOrder).reduce((sum, [itemId, qty]) => {
                            const item = menu.flatMap(cat => cat.items).find(m => m._id === itemId);
                            return sum + ((item?.price || 0) * qty);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowAddItemsModal(false);
                        setSelectedItemsForOrder({});
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAddItems}
                      disabled={isSubmitting || Object.keys(selectedItemsForOrder).length === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 pb-24">
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
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b-2 border-amber-100 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Table {table.tableNumber}</h1>
              <p className="text-sm text-gray-600">Floor {table.floorNumber}</p>
            </div>
            <div className="flex gap-2">
              {session && (
                <button
                  onClick={() => setIsOrdersOpen(true)}
                  className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-200 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">My Orders</span>
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {session.orderCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 overflow-x-auto">
          <div className="flex gap-2">
            {menu.map((category) => (
              <button
                key={category.categoryId}
                onClick={() => setSelectedCategory(category.categoryId)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === category.categoryId
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.categoryName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {menu
          .filter(cat => cat.categoryId === selectedCategory)
          .map(category => (
            <div key={category.categoryId}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.categoryName}</h2>
              {category.categoryDescription && (
                <p className="text-gray-600 mb-6">{category.categoryDescription}</p>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                {category.items.map(item => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl p-4 shadow-lg border-2 border-amber-100 hover:shadow-xl transition-all"
                  >
                    <div className="flex gap-4">
                      {item.imgURL && (
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.imgURL}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4 text-amber-600" />
                            <span className="text-xl font-bold text-amber-600">₹{item.price}</span>
                          </div>
                          
                          <button
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                        
                        {item.preparationTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                            <Clock className="w-3 h-3" />
                            {item.preparationTime} mins
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">{cartItemCount} items</span>
          <span className="bg-white/20 px-3 py-1 rounded-full font-bold">
            ₹{calculateTotal().toFixed(2)}
          </span>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {cart.map(item => (
                <div key={item._id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-amber-600 font-bold">₹{item.price}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Special instructions (optional)"
                    value={item.specialInstructions}
                    onChange={(e) => updateSpecialInstructions(item._id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="border-t-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-amber-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Complete Your Order</h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="For order updates"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    placeholder="Any special requests?"
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-amber-300 mt-2 pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-amber-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Orders Modal */}
      {isOrdersOpen && session && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Orders</h2>
              <button
                onClick={() => setIsOrdersOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Session Total</span>
                  <span className="text-2xl font-bold text-blue-600">₹{session.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {session.orders.map((order, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">Order #{order.orderId}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.orderedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.orderStatus === 'pending' ? 'bg-orange-100 text-orange-700' :
                      order.orderStatus === 'preparing' ? 'bg-blue-100 text-blue-700' :
                      order.orderStatus === 'served' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.orderStatus}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {item.imgURL && (
                            <img src={item.imgURL} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Order Total</span>
                    <span className="text-lg font-bold text-amber-600">₹{order.orderAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
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

export default CustomerMenu;