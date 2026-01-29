'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Coffee, ShoppingCart, ArrowLeft, Plus, Minus, Send, AlertCircle } from 'lucide-react';

const MenuPage = () => {
  const params = useParams();
  const tableId = params?.tableId;
  
  const [tableInfo, setTableInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (tableId) {
      loadTableInfo();
      loadCategories();
      loadMenuItems();
    }
  }, [tableId]);

  const loadTableInfo = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}`);
      if (response.ok) {
        const data = await response.json();
        setTableInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading table info:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories([{ id: 'all', icon: 'list', description: 'All Items' }, ...data.data]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/menu-items');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const toggleItem = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeItem = (itemId) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId] > 1) {
        updated[itemId] -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const submitOrder = async () => {
    if (Object.keys(cart).length === 0) {
      showNotification('error', 'Please select items to order');
      return;
    }

    try {
      setIsSubmitting(true);
      const orderItems = Object.entries(cart).map(([itemId, quantity]) => ({
        menuItem: itemId,
        quantity
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: tableId,
          items: orderItems,
          status: 'pending',
          notes: ''
        })
      });

      if (response.ok) {
        showNotification('success', 'Order placed successfully!');
        setCart({});
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification('error', 'Failed to place order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      showNotification('error', 'Error submitting order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-500 to-orange-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Cafe Menu</h1>
                {tableInfo && (
                  <p className="text-white/90 text-sm">
                    Table {tableInfo.tableNumber} - Floor {tableInfo.floorNumber}
                  </p>
                )}
              </div>
            </div>
            {cartCount > 0 && (
              <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                {cartCount} item{cartCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-6 p-4 rounded-xl shadow-lg flex items-center gap-2 z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <>
            {/* Category Scrollable Navbar */}
            <div className="mb-8">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-6 min-w-max px-4">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center gap-3 p-3 rounded-xl transition-all hover:scale-105 ${
                        selectedCategory === cat.id
                          ? ' '
                          : 'hover:bg-amber-50 border-2 border-transparent'
                      }`}
                    >
                      {/* Category Image */}
                      <div className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-3 transition-all ${
                        selectedCategory === cat.id 
                          ? 'border-amber-500 shadow-lg' 
                          : 'border-gray-200'
                      }`}>
                        {cat.imgURL ? (
                          <img
                            src={cat.imgURL}
                            alt={cat.id}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">
                            {cat.id === 'all' ? '🍽️' : '✨'}
                          </div>
                        )}
                      </div>
                      {/* Category Name */}
                      <div className="text-center">
                        <p className={`text-sm font-bold  max-w-20 line-clamp-2 ${
                          selectedCategory === cat.id ? 'text-amber-500 underline' : 'text-gray-900'
                        }`}>
                          {cat.id === 'all' ? 'All Items' : (cat.description || cat.id)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-amber-100 hover:shadow-xl transition-all"
                  >
                    {/* Item Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {item.imgURL ? (
                        <img
                          src={item.imgURL}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                          <Coffee className="w-12 h-12 text-amber-500" />
                        </div>
                      )}
                      {item.mostSell && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          🔥 Popular
                        </div>
                      )}
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <p className="text-white font-bold">Out of Stock</p>
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-amber-600">Rs. {item.price}</span>
                        {item.preparationTime && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                            ⏱️ {item.preparationTime} min
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        {cart[item._id] ? (
                          <div className="flex items-center gap-2 bg-amber-500 rounded-lg p-2 flex-1">
                            <button
                              onClick={() => removeItem(item._id)}
                              className="text-white hover:bg-amber-600 p-1 rounded"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="flex-1 text-center text-white font-bold">
                              {cart[item._id]}
                            </span>
                            <button
                              onClick={() => toggleItem(item._id)}
                              className="text-white hover:bg-amber-600 p-1 rounded"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleItem(item._id)}
                            disabled={!item.available}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                              item.available
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Coffee className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No items in this category</p>
                </div>
              )}
            </div>

            {/* Order Summary & Submit */}
            {cartCount > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-amber-500 p-6 shadow-2xl">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Items: {cartCount}</p>
                    <p className="text-2xl font-bold text-amber-600">
                      Rs. {Object.entries(cart).reduce((total, [itemId, qty]) => {
                        const item = menuItems.find(m => m._id === itemId);
                        return total + (item?.price || 0) * qty;
                      }, 0)}
                    </p>
                  </div>
                  <button
                    onClick={submitOrder}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MenuPage;